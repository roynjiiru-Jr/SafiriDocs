#!/bin/bash

# SafiriDocs - GitHub Push Script
# This script will create a new GitHub repository and push your code

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        SafiriDocs - GitHub Repository Setup                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Navigate to project directory
cd /home/user/safiridocs

echo "📁 Current directory: $(pwd)"
echo "📊 Git status:"
git status --short
echo ""

echo "📝 Commits ready to push:"
git log --oneline | head -10
echo ""

# Ask for GitHub username
echo "Please enter your GitHub username:"
read GITHUB_USERNAME

# Ask for repository name
echo ""
echo "Repository name (press Enter for 'safiridocs'):"
read REPO_NAME
REPO_NAME=${REPO_NAME:-safiridocs}

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "Ready to push to: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Option 1: Using GitHub CLI (if authenticated)
echo "Attempting to create repository with GitHub CLI..."
if gh auth status &> /dev/null; then
    echo "✅ GitHub CLI is authenticated!"
    echo ""
    echo "Creating repository '$REPO_NAME'..."
    
    gh repo create $REPO_NAME \
        --public \
        --source=. \
        --description="SafiriDocs - Document delivery marketplace connecting senders with verified travelers. Built with Hono + Cloudflare Workers + Flutterwave." \
        --push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║                    ✅ SUCCESS!                               ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo ""
        echo "Your repository is live at:"
        echo "🔗 https://github.com/$GITHUB_USERNAME/$REPO_NAME"
        echo ""
        exit 0
    fi
fi

# Option 2: Manual instructions
echo ""
echo "⚠️  GitHub CLI not authenticated. Here's how to push manually:"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "STEP 1: Create repository on GitHub.com"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1. Go to: https://github.com/new"
echo "2. Repository name: $REPO_NAME"
echo "3. Description: Document delivery marketplace with Flutterwave"
echo "4. Choose Public or Private"
echo "5. ⚠️  DO NOT initialize with README (we have one)"
echo "6. Click 'Create repository'"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "STEP 2: Run these commands in terminal"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "cd /home/user/safiridocs"
echo "git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "git branch -M main"
echo "git push -u origin main"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "OR: Authenticate GitHub CLI and run this script again"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "gh auth login"
echo "bash push-to-github.sh"
echo ""
