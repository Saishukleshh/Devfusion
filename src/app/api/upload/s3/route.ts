import { NextRequest, NextResponse } from 'next/server';
import { getS3UploadUrl, uploadBufferToS3 } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const { fileName, fileType } = await request.json();
      const s3Data = await getS3UploadUrl(fileName || 'product-image.jpg', fileType || 'image/jpeg');
      return NextResponse.json({ success: true, ...s3Data });
    }

    // Direct binary file upload to AWS S3
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in request' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const s3Url = await uploadBufferToS3(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      url: s3Url,
      fileName: file.name,
      fileType: file.type,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Error in S3 upload endpoint:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
