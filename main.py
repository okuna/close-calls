from __future__ import print_function
import json
import sys
from operator import add
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

from config import sql_password
from config import sql_host

import pymysql
import pandas as pd

sql_username = 'root'

def insertSql(df):
    df.write.format("jdbc")\
            .option("url", "jdbc:mysql://" + sql_host + "/airplanes")\
            .option("dbtable", "planes")\
            .option("driver", "com.mysql.cj.jdbc.Driver")\
            .option("user", sql_username)\
            .option("password", sql_password).mode("append").save()

def explodeCosArrToPosition(row):
    output = []
    outCount = -1;
    latLong = row[2]
    lat = lon = time = alt = 0
    for i in range(len(latLong)):
        if i % 4 == 0:
            lat = latLong[i]
            if (i != 0):
                output.append( (row[0], alt, row[2], lat, lon, time, row[6], row[7], row[8] ))
        if i % 4 == 1: 
             lon = latLong[i]
        if i % 4 == 2: 
            time = None
            if latLong[i]:
                time = int(latLong[i])
        if i % 4 == 3: 
            alt = None
            if latLong[i]:
                alt = int(latLong[i])
    output.append( (row[0], alt, row[2], lat, lon, time, row[6], row[7], row[8] ))
    return output
            
    


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: main <file>", file=sys.stderr)
        sys.exit(-1)

    spark = SparkSession\
        .builder\
        .appName("CloseCalls")\
        .getOrCreate()

    df = spark.read.json(sys.argv[1], multiLine=True).select('acList')
        

    df = df.select(explode("acList").alias("tmp")).select("tmp.*")\
            .select("Reg", "Alt", "Cos", "Lat", "Long", "PosTime", "Spd", "From", "To")\
            .dropna("any", None, ["Alt", "Lat", "Long", "PosTime", "Cos"])


    #df = df.withColumnRenamed("Reg", "callsign").withColumnRenamed("Alt", "alt");
    #df = df.select("*", posexplode("Cos"))
    df.printSchema()
    df.show()

    expandedMap = df.rdd.flatMap(explodeCosArrToPosition);

    newDf = spark.createDataFrame(expandedMap, df.schema).show()

    #insertSql(table)

    spark.stop()
