import { NextRequest, NextResponse } from 'next/server';
import expressApp from '@/lib/expressApp';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    backend: 'Express.js Engine running within Next.js API',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 's3-upload-url') {
      const { fileName, fileType } = body;
      const { getS3UploadUrl } = await import('@/lib/s3');
      const data = await getS3UploadUrl(fileName || 'file.png', fileType || 'image/png');
      return NextResponse.json({ success: true, ...data });
    }

    return NextResponse.json({ success: true, message: 'Processed via Express backend bridge' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Express bridge error' }, { status: 500 });
  }
}
