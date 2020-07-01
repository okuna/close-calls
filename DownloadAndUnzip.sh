#!/bin/bash
#This script downloads the zip file passed as a command line argument
#from ADSBExchange.com
#The zip is unzipped and uploaded to S3 storage

if [ "$#" -ne 1 ]; then
    echo "usage: DownloadAndUnzip.sh <YYYY-MM-DD>"
    exit -1
fi

file="${1}.zip"
path="http://history.adsbexchange.com/downloads/samples/${file}"

wget $path &&\
unzip $file -d $1 &&\
rm $file &&\
aws s3 cp $1/ s3://radar-data/$1/ --recursive
rm -r $1

