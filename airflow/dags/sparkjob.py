from datetime import timedelta
from datetime import datetime
import wget
# The DAG object; we'll need this to instantiate a DAG
from airflow import DAG
# Operators; we need this to operate!
from airflow.operators.bash_operator import BashOperator
from airflow.operators.dummy_operator import DummyOperator
from airflow.operators.python_operator import PythonOperator

from airflow.utils.dates import days_ago

date = '2017-01-01'

with DAG('python_dag', description='Python DAG', schedule_interval='0 0 5 * *', start_date=days_ago(1), catchup=False) as dag:
    dummy_task      = DummyOperator(task_id='dummy_task', retries=3)
    download_task   = BashOperator(task_id='download_task', bash_command='~/close-calls/DownloadAndUnzip.sh {{ params.date }}', params={'date': date})
    spark_task    = BashOperator(task_id='spark_task', bash_command='~/close-calls/RunSpark.sh {{ params.date }}', params={'date': date})

    dummy_task >> download_task >> spark_task
