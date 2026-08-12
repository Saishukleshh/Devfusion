import express, { Request, Response, NextFunction } from 'express';
import { getS3UploadUrl } from './s3';

const expressApp = express();

expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

// Express API Health Check Endpoint
expressApp.get('/api/express/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'Express.js + Next.js API Engine',
    timestamp: new Date().toISOString(),
  });
});

// Express S3 Presigned URL Generator Endpoint
expressApp.post('/api/express/s3-presigned-url', async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType are required' });
    }

    const s3Data = await getS3UploadUrl(fileName, fileType);
    res.json({ success: true, ...s3Data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'S3 presigned URL error' });
  }
});

// Express Error Handling Middleware
expressApp.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Express Backend Error:', err);
  res.status(500).json({ error: err.message || 'Express Internal Server Error' });
});

export default expressApp;
