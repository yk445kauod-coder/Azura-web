import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export interface R2Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

let s3Client: S3Client | null = null;
let currentBucket = "";

export function initR2(config: R2Config) {
  s3Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  });
  currentBucket = config.bucket;
}

export async function uploadToR2(key: string, data: any) {
  if (!s3Client) throw new Error("R2 not initialized");
  const command = new PutObjectCommand({
    Bucket: currentBucket,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: "application/json",
  });
  return s3Client.send(command);
}

export async function downloadFromR2(key: string) {
  if (!s3Client) throw new Error("R2 not initialized");
  const command = new GetObjectCommand({
    Bucket: currentBucket,
    Key: key,
  });
  const response = await s3Client.send(command);
  const body = await response.Body?.transformToString();
  return body ? JSON.parse(body) : null;
}

export async function listR2Objects(prefix?: string) {
  if (!s3Client) throw new Error("R2 not initialized");
  const command = new ListObjectsV2Command({
    Bucket: currentBucket,
    Prefix: prefix,
  });
  const response = await s3Client.send(command);
  return response.Contents || [];
}

export async function testR2Connection(config: R2Config) {
  const testClient = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  });
  const command = new ListObjectsV2Command({
    Bucket: config.bucket,
    MaxKeys: 1,
  });
  return testClient.send(command);
}
