FROM python:latest

ENV AWS_ACCESS_KEY_ID=accessKey1
ENV AWS_SECRET_ACCESS_KEY=verySecretKey1

# Install dependencies
RUN pip install --upgrade awscli \
    && apt-get clean

## Script from the web to wait for S3 to start up
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait /wait
RUN chmod +x /wait

## Run the wait script until SQS is up
## Create buckets and add the signature
## Start
CMD /wait && \
aws --endpoint-url=http://s3:7000 s3 mb s3://cvs-retro-reports-local
