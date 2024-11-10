import { config } from 'dotenv';
import { Client } from 'minio';

config({
  path: '.env.local',
});

export const BUCKET_NAME = 'resources';

export const minioClient = new Client({
  endPoint: process.env.MINIO_URL!,
  port: Number(process.env.MINIO_PORT!) || 9000,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
  useSSL: process.env.MINIO_USE_SSL === 'true',
});
