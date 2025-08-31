#!/bin/bash

echo "🎬 Video Subtitle Accuracy Parser - Setup Script"
echo "================================================"
echo ""

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed!"
    echo "Please install FFmpeg first:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
    echo ""
    exit 1
else
    echo "✅ FFmpeg is installed"
fi

# Check if Google Cloud credentials are set
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  GOOGLE_APPLICATION_CREDENTIALS environment variable is not set"
    echo ""
    echo "To set up Google Cloud Speech-to-Text API:"
    echo "1. Go to https://console.cloud.google.com/"
    echo "2. Create a new project or select existing one"
    echo "3. Enable the Speech-to-Text API"
    echo "4. Create a Service Account and download the JSON key file"
    echo "5. Set the environment variable:"
    echo "   export GOOGLE_APPLICATION_CREDENTIALS=\"/path/to/your/service-account-key.json\""
    echo ""
    echo "Or add it to your ~/.bashrc or ~/.zshrc file:"
    echo "   echo 'export GOOGLE_APPLICATION_CREDENTIALS=\"/path/to/your/key.json\"' >> ~/.bashrc"
    echo "   source ~/.bashrc"
    echo ""
else
    echo "✅ Google Cloud credentials are configured"
    echo "   Path: $GOOGLE_APPLICATION_CREDENTIALS"
fi

echo ""
echo "🚀 Ready to build and run!"
echo "Run these commands:"
echo "  npm run build"
echo "  npm start"
echo ""
echo "Or for development:"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"


