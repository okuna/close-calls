if [ "$#" -ne 1 ]; then
    echo "usage: RunSpark.sh <YYYY-MM-DD>"
    exit -1
fi
spark-submit --driver-class-path /usr/share/java/mysql-connector-java-8.0.20.jar --jars /usr/share/java/mysql-connector-java-8.0.20.jar --packages com.amazonaws:aws-java-sdk:1.7.4,org.apache.hadoop:hadoop-aws:2.7.7,mysql:mysql-connector-java:8.0.20 --master spark://172.31.11.65:7077 --conf spark.sql.shuffle.partitions=64 main.py $1
