# 🚀 Free Hosting Deployment Guide

This guide will help you deploy your video parser app for free so your friends can try it out!

## 🎯 **Recommended: Railway (Easiest)**

### Step 1: Prepare Your Code
1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Ensure these files exist**:
   - ✅ `package.json` (with postinstall script)
   - ✅ `Procfile` (web: npm start)
   - ✅ `tsconfig.json`
   - ✅ `src/` folder with all TypeScript files

### Step 2: Deploy to Railway
1. **Go to [Railway.app](https://railway.app/)**
2. **Sign up with GitHub** (free)
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your video_parser repository**
6. **Wait for automatic deployment**

### Step 3: Configure Environment Variables
1. **In Railway dashboard, go to your project**
2. **Click "Variables" tab**
3. **Add these variables**:
   ```
   ASSEMBLYAI_API_KEY=94bd121e761240dc8266fad51dc95d6e
   NODE_ENV=production
   PORT=3000
   ```

### Step 4: Get Your URL
- Railway will give you a URL like: `https://your-app-name.railway.app`
- Share this with your friends! 🎉

---

## 🌟 **Alternative: Render (Very Generous Free Tier)**

### Step 1: Deploy to Render
1. **Go to [Render.com](https://render.com/)**
2. **Sign up with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repo**
5. **Configure**:
   - **Name**: `video-parser`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 2: Environment Variables
Add in Render dashboard:
```
ASSEMBLYAI_API_KEY=94bd121e761240dc8266fad51dc95d6e
NODE_ENV=production
PORT=10000
```

### Step 3: Deploy
- Click "Create Web Service"
- Wait for build and deployment
- Get your URL: `https://your-app-name.onrender.com`

---

## 🔧 **Troubleshooting**

### Common Issues:
1. **Build fails**: Check that `tsconfig.json` exists and TypeScript compiles locally
2. **API key error**: Ensure `ASSEMBLYAI_API_KEY` is set in environment variables
3. **Port issues**: Some platforms use different default ports

### Local Testing:
```bash
# Test build
npm run build

# Test start
npm start

# Test with environment variable
ASSEMBLYAI_API_KEY=your_key npm start
```

---

## 💰 **Cost Breakdown**

### Railway:
- **Free tier**: $5 credit/month
- **Your app**: ~$2-3/month (very affordable!)
- **Upgrade**: $5/month for unlimited usage

### Render:
- **Free tier**: 750 hours/month
- **Your app**: Completely free! 🎉
- **Limitation**: Sleeps after 15 min inactivity

---

## 🎉 **Share with Friends**

Once deployed, your friends can:
1. **Visit your URL** (e.g., `https://your-app.railway.app`)
2. **Upload video files** (MP4, AVI, MOV)
3. **Upload subtitle files** (.srt format)
4. **Get real accuracy analysis** using AssemblyAI!

---

## 🚨 **Important Notes**

1. **API Key Security**: Your AssemblyAI key is now in environment variables (more secure)
2. **File Cleanup**: App automatically cleans up uploaded files
3. **Rate Limits**: AssemblyAI has usage limits (check your dashboard)
4. **Monitoring**: Check Railway/Render logs if something goes wrong

---

## 🆘 **Need Help?**

- **Railway Docs**: [railway.app/docs](https://railway.app/docs)
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **AssemblyAI Docs**: [assemblyai.com/docs](https://assemblyai.com/docs)

---

## 🎯 **New Feature: Generated SRT Files**

Your app now automatically generates SRT subtitle files from the actual audio transcription!

### What This Means:
- **Real speech-to-text** results saved as downloadable SRT files
- **Perfect for content creators** who need accurate subtitles
- **Quality assurance** for existing subtitle files
- **New subtitle generation** from any video with speech

### How It Works:
1. Upload video + subtitle files
2. App transcribes audio using AssemblyAI
3. Generates new SRT file with real transcription
4. Saves to `/generated_srt` directory
5. Provides download link in results

### Perfect For:
- **YouTubers** needing accurate captions
- **Content creators** wanting real subtitles
- **Language learners** practicing with authentic speech
- **Researchers** analyzing speech patterns

**Happy Deploying! 🚀**
