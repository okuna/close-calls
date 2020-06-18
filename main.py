from __future__ import print_function
import json
import sys
from math import radians, sin, cos, sqrt, asin

from operator import add
from pyspark.sql import SparkSession
import pyspark.sql.functions as PY

from pyspark.sql.types import DoubleType


from config import sql_password
from config import sql_host
from config import sql_username

import pymysql
import pandas as pd

ALT_FILTER = 1000

def insertSql(df):
    df.write.format("jdbc")\
            .option("url", "jdbc:mysql://" + sql_host + "/airplanes")\
            .option("dbtable", "close_calls")\
            .option("driver", "com.mysql.cj.jdbc.Driver")\
            .option("user", sql_username)\
            .option("password", sql_password).mode("append").save()

def calcDistance(lat1, lon1, lat2, lon2):
    '''
    Calculates Haversine distance between two lat/lon coordinates
    From https://rosettacode.org/wiki/Haversine_formula#Python
    :param lat1: Latitude of first point
    :param lon1: Longitude of first point
    :param lat2: Latitude of second point
    :param lon2: Longitude of second point
    :returns:    Float, distance between two points in km
    '''
    R = 6372.8 # Earth radius in kilometers
    delta_lat = radians(lat2 - lat1)
    delta_lon = radians(lon2 - lon1)
    lat1 = radians(lat1)
    lat2 = radians(lat2)
    a = sin(delta_lat / 2.0) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2.0) ** 2
    c = 2 * asin(sqrt(a))
    return R * c


def explodeCosArr(row):
    output = []
    outCount = -1;
    latLongArr = row[3]
    lat = lon = time = alt = 0
    for i in range(len(latLongArr)):
        if i % 4 == 0:
            if (i != 0):
                output.append( (row[0], row[1], alt, row[3], lat, lon, time, row[7], row[8], row[9], row[10], row[11] ))
            lat = None
            if latLongArr[i]:
                lat = latLongArr[i]
        if i % 4 == 1: 
            lon = None
            if latLongArr[i]:
                lon = latLongArr[i]
        if i % 4 == 2: 
            time = None
            if latLongArr[i]:
                #remove milliseconds from timestamp
                time = int(latLongArr[i] / 1000) 
        if i % 4 == 3: 
            alt = None
            if latLongArr[i]:
                alt = int(latLongArr[i])
    output.append( (row[0], row[1], alt, row[3], lat, lon, time, row[7], row[8], row[9], row[10], row[11] ))
    return output
            
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: main <file>", file=sys.stderr)
        sys.exit(-1)

    spark = SparkSession\
        .builder\
        .appName("CloseCalls with join math")\
        .getOrCreate()

    #register UDF 
    udfCalcDistance = PY.udf(calcDistance, DoubleType())

    #read main file
    df = spark.read.json(sys.argv[1], multiLine=True).select('acList')
    airportAltDf = spark.read.json('s3a://radar-data/airportsLatLon.json')

    df = df.select(PY.explode("acList").alias("tmp")).select("tmp.*")\
            .select("Icao", "Reg", "Alt", "Cos", "Lat", "Long", "PosTime", "Spd", "Trak", "From", "To", "Call")\
            .dropna("any", None, ["Icao", "Reg", "Alt", "Lat", "Long", "PosTime", "Cos"])\

    #expand Cos position into rows
    expandedMap = df.rdd.repartition(32).flatMap(explodeCosArr);

    #turn RDD back into DF and remove duplicated timestamps 
    explodedDf = spark.createDataFrame(expandedMap, df.schema)\
        .dropDuplicates(["Icao", "PosTime"])\
        .drop("Cos")\
        .dropna("any", None, ["Icao", "Reg", "Alt", "Lat", "Long", "PosTime"])\
        .filter(PY.col("Alt") > 500) #filter out planes below 500ft

    #self-join to detect planes with 0.01 degrees and 1000 ft
    d1 = explodedDf.alias("d1")
    d2 = explodedDf.toDF("_Icao", "_Reg", "_Alt", "_Lat", "_Long", "_PosTime", "_Spd", "_Trak", "_From", "_To", "_Call" )
    joined_df = d1.join(d2, 
              ((d1.PosTime == d2._PosTime )\
            & (PY.abs(d1.Lat - d2._Lat) <= .01)\
            & (PY.abs(d1.Long - d2._Long) <= .01)\
            & (PY.abs(d1.Alt - d2._Alt) < 1000)\
            & (d1.Lat < d2._Lat)\
            & (d1.Icao != d2._Icao)), 'inner')
    joined_df = joined_df\
        .withColumn("altDiff", (PY.abs(PY.col('Alt') - PY.col('_Alt'))))\
        .withColumn("distDiff", udfCalcDistance( PY.col('Lat'), PY.col('Long'), PY.col('_Lat'), PY.col('_Long') ) )\

    #detect when close call is .1 deg away from airport
    closeAirportDf = joined_df.join(airportAltDf,
             ((PY.abs(joined_df.Lat - airportAltDf.lat) <= .1)\
            & (PY.abs(joined_df.Long - airportAltDf.lon) <= .1)\
            & (joined_df.Alt - airportAltDf.elevation <= 2000)), 'inner')
    
    #remove close calls near airport
    joined_df = joined_df.join(closeAirportDf,
            ((joined_df.Icao == closeAirportDf.Icao)\
            &(joined_df._Icao == closeAirportDf._Icao)\
            &(joined_df.PosTime == closeAirportDf.PosTime)), 'leftanti')

    joined_df.show(100)

    #insertSql(joined_df)

    spark.stop()
