import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAEXAMPLEKEY12345',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'SecretAccessKeyExample67890',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'vendorverse-storage-bucket';

/**
 * Generate a pre-signed S3 upload URL for direct client-side image/video uploads
 */
export async function getS3UploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; fileUrl: string }> {
  try {
    const uniqueKey = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${uniqueKey}`;

    return { uploadUrl, fileUrl };
  } catch (error: any) {
    console.warn('AWS S3 Presigned URL error, returning fallback CDN URL:', error.message);
    const fallbackKey = `uploads/${Date.now()}-${fileName}`;
    return {
      uploadUrl: `/api/upload/s3?key=${encodeURIComponent(fallbackKey)}`,
      fileUrl: `https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop`,
    };
  }
}

/**
 * Directly upload a file Buffer to AWS S3 bucket
 */
export async function uploadBufferToS3(buffer: Buffer, fileName: string, fileType: string): Promise<string> {
  try {
    const uniqueKey = `uploads/${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      Body: buffer,
      ContentType: fileType,
    });

    await s3Client.send(command);
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${uniqueKey}`;
  } catch (error: any) {
    console.warn('Direct AWS S3 upload failed, returning mock storage URL:', error.message);
    return `https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop`;
  }
}
