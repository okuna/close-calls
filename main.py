from __future__ import print_function
import json
import sys
from operator import add
from pyspark.sql import SparkSession
from pyspark.sql.functions import explode

from config import sql_password
from config import sql_host

import pymysql
import pandas as pd

sql_username = 'root'

def insertSql(df):
    df = df.withColumnRenamed("Reg", "callsign").withColumnRenamed("Alt", "alt");
    df.printSchema()
    df.write.format("jdbc")\
            .option("url", "jdbc:mysql://" + sql_host + "/airplanes")\
            .option("dbtable", "planes")\
            .option("driver", "com.mysql.cj.jdbc.Driver")\
            .option("user", sql_username)\
            .option("password", sql_password).mode("append").save()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: main <file>", file=sys.stderr)
        sys.exit(-1)

    spark = SparkSession\
        .builder\
        .appName("PythonWordCount")\
        .getOrCreate()

    df = spark.read.json(sys.argv[1], multiLine=True).select('acList')

    table = df.select(explode("acList").alias("tmp")).select("tmp.Alt", "tmp.Reg")

    insertSql(table)

    #dataMap = table.rdd.map(lambda x: (x.Alt, x.Reg)).collect()

    spark.stop()
