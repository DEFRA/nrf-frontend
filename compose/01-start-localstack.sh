#!/bin/bash

echo "[INIT SCRIPT] Starting LocalStack setup" >&2

export AWS_REGION=eu-west-2
export AWS_DEFAULT_REGION=eu-west-2
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

echo "[INIT SCRIPT] Creating buckets" >&2

# CDP Uploader buckets
aws --endpoint-url=http://localhost:4566 s3 mb s3://cdp-uploader-quarantine
aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket

# Add your own buckets here
# aws --endpoint-url=http://localhost:4566 s3 mb s3://your-bucket

echo "[INIT SCRIPT] Creating queues" >&2

# CDP Uploader queues
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name cdp-clamav-results
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name cdp-uploader-scan-results-callback.fifo --attributes '{"FifoQueue":"true","ContentBasedDeduplication": "true"}'

# Mock virus scanner setup
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name mock-clamav
aws --endpoint-url=http://localhost:4566 s3api put-bucket-notification-configuration --bucket cdp-uploader-quarantine --notification-configuration '{"QueueConfigurations": [{"QueueArn": "arn:aws:sqs:eu-west-2:000000000000:mock-clamav","Events": ["s3:ObjectCreated:*"]}]}'
aws --endpoint-url=http://localhost:4566 sqs create-queue --region $AWS_REGION --queue-name cdp-uploader-download-requests

# Add your own queues here
# aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name your-queue

echo "[INIT SCRIPT] LocalStack setup complete" >&2
