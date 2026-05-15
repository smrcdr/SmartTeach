#!/bin/sh
set -eu

echo 'Waiting for MinIO to become available...'

until mc alias set smarteach http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"; do
  sleep 2
done

mc mb --ignore-existing "smarteach/${MINIO_BUCKET}"
echo "Bucket ${MINIO_BUCKET} is ready."
