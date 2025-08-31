import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { SubtitleEntry, ProcessedSubtitle, VideoAnalysisResult, ApiResponse } from './types';
import { parseSubRipFile, timeToSeconds, calculateTextSimilarity } from './utils';
import { AudioProcessor } from './audioProcessor';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter called for:', file.fieldname, file.originalname, 'mimetype:', file.mimetype);
    
    // Temporarily accept all files for debugging
    console.log('Accepting file:', file.originalname);
    cb(null, true);
    
    /*
    if (file.fieldname === 'video') {
      // Accept video files
      if (file.mimetype.startsWith('video/')) {
        console.log('Video file accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('Video file rejected:', file.originalname, 'mimetype:', file.mimetype);
        cb(new Error('Only video files are allowed for video field'));
      }
    } else if (file.fieldname === 'subtitles') {
      // Accept subtitle files
      const allowedTypes = ['.srt', '.txt'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        console.log('Subtitle file accepted:', file.originalname);
        cb(null, true);
      } else {
        console.log('Subtitle file rejected:', file.originalname, 'extension:', ext);
        cb(new Error('Only .srt and .txt files are allowed for subtitles field'));
      }
    } else {
      console.log('Invalid field name:', file.fieldname);
      cb(new Error('Invalid field name'));
    }
    */
  }
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'subtitles', maxCount: 1 }
]);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

app.get('/api/test-simple', (req, res) => {
  try {
    console.log('Simple test endpoint hit');
    res.json({ success: true, message: 'Simple test working' });
  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({ success: false, error: 'Simple test failed' });
  }
});

app.post('/api/test-upload', upload, (req, res) => {
  try {
    console.log('Test upload endpoint hit');
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    console.log('Files received:', Object.keys(files));
    
    if (files.video) {
      console.log('Video file:', files.video[0].originalname, 'Size:', files.video[0].size);
    }
    if (files.subtitles) {
      console.log('Subtitle file:', files.subtitles[0].originalname, 'Size:', files.subtitles[0].size);
    }
    
    res.json({ 
      success: true, 
      files: Object.keys(files),
      video: files.video ? files.video[0].originalname : 'none',
      subtitles: files.subtitles ? files.subtitles[0].originalname : 'none'
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Download generated SRT file
app.get('/api/download-srt/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const srtFilePath = path.join(__dirname, '../generated_srt', filename);
    
    if (!fs.existsSync(srtFilePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'Generated SRT file not found' 
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(srtFilePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading SRT file:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error downloading SRT file' 
    });
  }
});

app.post('/api/analyze', upload, async (req, res) => {
  let videoFilePath: string | null = null;
  let subtitleFilePath: string | null = null;
  
  try {
    console.log('Starting file processing...');
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    console.log('Files received:', Object.keys(files));
    
    if (!files.video || !files.subtitles) {
      console.log('Missing required files');
      return res.status(400).json({
        success: false,
        error: 'Both video and subtitle files are required'
      } as ApiResponse<null>);
    }

    const videoFile = files.video[0];
    const subtitleFile = files.subtitles[0];
    console.log('Video file:', videoFile.originalname, 'Size:', videoFile.size);
    console.log('Subtitle file:', subtitleFile.originalname, 'Size:', subtitleFile.size);
    
    // Store file paths for cleanup
    videoFilePath = videoFile.path;
    subtitleFilePath = subtitleFile.path;
    console.log('Video path:', videoFilePath);
    console.log('Subtitle path:', subtitleFilePath);

    // Validate files exist
    if (!fs.existsSync(videoFilePath) || !fs.existsSync(subtitleFilePath)) {
      console.log('Files do not exist on disk');
      return res.status(400).json({
        success: false,
        error: 'One or more uploaded files are missing'
      } as ApiResponse<null>);
    }

    console.log('Reading subtitle file...');
    // Read subtitle file
    const subtitleContent = fs.readFileSync(subtitleFilePath, 'utf-8');
    console.log('Subtitle content length:', subtitleContent.length);
    console.log('First 200 chars:', subtitleContent.substring(0, 200));
    
    const subtitles = parseSubRipFile(subtitleContent);
    console.log('Parsed subtitles count:', subtitles.length);

    if (subtitles.length === 0) {
      console.log('No subtitles parsed');
      return res.status(400).json({
        success: false,
        error: 'No valid subtitles found in the file. Please ensure the file is in SRT format.'
      } as ApiResponse<null>);
    }

    console.log('Processing subtitles with real audio...');
    
    // Use real audio processing instead of simulation
    const audioProcessor = new AudioProcessor();
    let processedSubtitles: ProcessedSubtitle[];
    let generatedSrtPath: string | null = null;
    
    try {
      // Process subtitles with real audio transcription and progress updates
      processedSubtitles = await audioProcessor.processSubtitlesWithAudio(
        videoFilePath,
        subtitles,
        (progress) => {
          // Broadcast progress update to all connected clients
          broadcastProgress('subtitle_progress', {
            current: progress.current,
            total: progress.total,
            subtitleId: progress.subtitle.id,
            status: progress.status,
            text: progress.subtitle.text.substring(0, 50) + '...'
          });
        }
      );
      
      // Generate SRT file from transcribed audio
      console.log('🎯 Generating SRT file from audio transcription...');
      broadcastProgress('status', { message: 'Generating SRT file...' });
      
      generatedSrtPath = await audioProcessor.generateSRTFromAudio(
        videoFilePath,
        subtitles
      );
      
      broadcastProgress('status', { message: 'SRT file generated successfully!' });
      
    } catch (audioError) {
      console.error('❌ Audio processing failed, falling back to basic processing:', audioError);
      broadcastProgress('status', { message: 'Audio processing failed, using fallback method' });
      
      // Fallback to basic processing if audio processing fails
      processedSubtitles = subtitles.map(subtitle => {
        const startSeconds = timeToSeconds(subtitle.startTime);
        const endSeconds = timeToSeconds(subtitle.endTime);
        
        // Basic fallback - mark as failed but keep structure
        const accuracy = 0.0; // No accuracy data available
        const isMatch = false;
        
        return {
          ...subtitle,
          startSeconds,
          endSeconds,
          accuracy,
          transcribedText: '[Audio processing failed]',
          isMatch
        };
      });
    }

    console.log('Calculating results...');
    const matchedSubtitles = processedSubtitles.filter(sub => sub.isMatch).length;
    const overallAccuracy = processedSubtitles.reduce((sum, sub) => sum + sub.accuracy, 0) / processedSubtitles.length;

    const result: VideoAnalysisResult = {
      videoFile: videoFile.originalname,
      subtitleFile: subtitleFile.originalname,
      totalSubtitles: subtitles.length,
      matchedSubtitles,
      overallAccuracy,
      subtitles: processedSubtitles,
      processingTime: Date.now(), // Simple timing for MVP
      generatedSrtFile: generatedSrtPath ? path.basename(generatedSrtPath) : undefined
    };

    console.log('Sending response...');
    res.json({
      success: true,
      data: result
    } as ApiResponse<VideoAnalysisResult>);

  } catch (error) {
    console.error('Error processing files:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Files received:', req.files);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as ApiResponse<null>);
  } finally {
    // Clean up uploaded files safely
    try {
      if (videoFilePath && fs.existsSync(videoFilePath)) {
        fs.unlinkSync(videoFilePath);
      }
      if (subtitleFilePath && fs.existsSync(subtitleFilePath)) {
        fs.unlinkSync(subtitleFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError);
    }
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
  });
});

// Function to broadcast progress updates
function broadcastProgress(type: string, data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = WebSocket.OPEN
      client.send(JSON.stringify({ type, data }));
    }
  });
}

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  console.error('Error stack:', error.stack);
  
  // Handle multer errors specifically
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error.code, error.message);
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`
    } as ApiResponse<null>);
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  } as ApiResponse<null>);
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, '../uploads')}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
});
