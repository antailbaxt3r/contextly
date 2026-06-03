from io import BytesIO

import boto3
from botocore.client import Config

from app.config import settings


_client = None


def get_s3_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            region_name=settings.s3_region,
            config=Config(signature_version="s3v4"),
        )
    return _client


def upload_bytes(key: str, data: bytes, content_type: str) -> None:
    client = get_s3_client()
    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=data,
        ContentType=content_type,
    )


def download_bytes(key: str) -> bytes:
    client = get_s3_client()
    buf = BytesIO()
    client.download_fileobj(settings.s3_bucket, key, buf)
    return buf.getvalue()


def delete_object(key: str) -> None:
    client = get_s3_client()
    client.delete_object(Bucket=settings.s3_bucket, Key=key)
