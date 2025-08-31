#!/bin/bash

echo "🚀 Video Parser Deployment Helper"
echo "=================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found!"
    echo "Please run: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes!"
    echo "Please commit your changes first:"
    echo "  git add ."
    echo "  git commit -m 'Ready for deployment'"
    echo ""
    read -p "Press Enter to continue anyway..."
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote origin found!"
    echo "Please add your GitHub repository:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/video_parser.git"
    exit 1
fi

echo "✅ Git repository ready!"
echo ""

# Show current status
echo "📊 Current Status:"
echo "  Branch: $(git branch --show-current)"
echo "  Remote: $(git remote get-url origin)"
echo "  Last commit: $(git log -1 --oneline)"
echo ""

# Check if we need to push
if [ "$(git rev-list HEAD...origin/main --count)" -gt 0 ]; then
    echo "📤 Pushing to GitHub..."
    git push origin main
    echo "✅ Code pushed to GitHub!"
else
    echo "✅ Code is already up to date on GitHub!"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Go to Railway.app or Render.com"
echo "2. Connect your GitHub repository"
echo "3. Set environment variable: ASSEMBLYAI_API_KEY=94bd121e761240dc8266fad51dc95d6e"
echo "4. Deploy!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "�� Happy Deploying!"
