# Video Subtitle Accuracy Parser

A **real-time subtitle accuracy analyzer** that uses **actual speech-to-text** to compare provided subtitle files with the real audio content from videos.

## 🚀 **NEW: Real Speech-to-Text Analysis**

This application now uses **AssemblyAI Speech-to-Text API** to:
- Extract audio from video files using FFmpeg
- Transcribe audio segments for each subtitle timestamp
- Calculate **real accuracy scores** based on actual audio content
- Provide detailed mismatch analysis with transcribed text

## Features

- **Real Audio Processing** - FFmpeg audio extraction and segmentation
- **Live Speech Recognition** - AssemblyAI Speech-to-Text API integration
- **Accurate Analysis** - Real subtitle accuracy scores (not simulated)
- **Timestamp Segmentation** - Analyzes each subtitle at its exact time
- **Fallback Support** - Gracefully handles API failures
- Upload video files (MP4, AVI, MOV, etc.)
- Upload subtitle files (.srt, .txt)
- Automatic subtitle parsing and timestamp extraction
- **Real accuracy analysis** and mismatch detection
- Simple web interface
- RESTful API endpoints

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: Vanilla HTML + CSS + JavaScript
- **Audio Processing**: FFmpeg for video/audio extraction
- **Speech Recognition**: AssemblyAI Speech-to-Text API
- **File Handling**: Multer for file uploads
- **Deployment Ready**: Can be hosted on any Node.js platform

## Setup

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **AssemblyAI Speech-to-Text Setup**

1. Go to [AssemblyAI Console](https://www.assemblyai.com/)
2. Sign up for a free account or log in
3. Get your API key from the dashboard
4. Copy `config.example.js` to `config.js`
5. Fill in your AssemblyAI API key

### 3. **FFmpeg Installation**
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

### 4. **Build and Run**
```bash
npm run build
npm start
```

### 5. **For Development**
```bash
npm run dev
```

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Upload a video file (MP4, AVI, MOV, etc.)
3. Upload a subtitle file (.srt format recommended)
4. Click "Analyze Subtitle Accuracy"
5. **View real accuracy scores** based on actual audio transcription!

## API Endpoints

- `GET /` - Main application page
- `POST /api/analyze` - Upload and analyze video + subtitle files
- `GET /api/test` - Test endpoint
- `POST /api/test-upload` - Test file upload

## File Formats

### Supported Video Formats
- MP4, AVI, MOV, MKV, and other common video formats

### Supported Subtitle Formats
- **SRT (.srt)**: Standard SubRip format with timestamps
- **TXT (.txt)**: Plain text files (basic support)

### SRT Format Example
```
1
00:00:01,000 --> 00:00:04,000
This is the first subtitle

2
00:00:05,000 --> 00:00:08,000
This is the second subtitle
```

## How Real Analysis Works

1. **Video Upload** - Video file is uploaded and stored temporarily
2. **Audio Extraction** - FFmpeg extracts audio segments for each subtitle timestamp
3. **Speech Recognition** - AssemblyAI transcribes each audio segment
4. **Accuracy Calculation** - Compares original subtitle text with transcribed text
5. **Results Display** - Shows real accuracy scores and mismatches
6. **SRT Generation** - Creates new SRT file from actual audio transcription
7. **File Download** - Provides downloadable SRT file with real speech-to-text results

## Generated SRT Files

After analysis, the app automatically generates a new SRT file containing:
- **Real transcribed text** from the audio using AssemblyAI
- **Original timestamps** from the subtitle file
- **Proper SRT format** for easy use in video players
- **Saved location**: `/generated_srt/` directory
- **Downloadable** via the web interface

This feature is perfect for:
- Creating accurate subtitles from videos
- Comparing original vs. transcribed text
- Generating new subtitle files for content creators
- Quality assurance for subtitle accuracy

## Current Features

- **Real audio transcription** using AssemblyAI
- **Accurate timestamp analysis** for each subtitle
- **Fallback processing** if API fails
- **Detailed accuracy scoring** based on actual content
- **Audio segment extraction** for precise analysis
- **Generated SRT files** from actual audio transcription
- **Downloadable results** in standard SRT format

## Future Enhancements

- **Batch processing** capabilities
- **Multiple language support** (Spanish, French, etc.)
- **Advanced text similarity algorithms**
- **User authentication** and file storage
- **Enhanced UI** with video player integration
- **Real-time processing** progress updates

## Deployment

This application can be deployed to:
- **Heroku** (Procfile included)
- **Railway**
- **DigitalOcean App Platform**
- Any Node.js hosting service

**Important**: Set your AssemblyAI API key in the configuration file or as an environment variable on your hosting platform.

## License

ISC
