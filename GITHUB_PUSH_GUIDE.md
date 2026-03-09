# 🚀 Push to GitHub - Step by Step Guide

## Prerequisites
- Git installed on your computer
- GitHub account created
- Repository created on GitHub (optional - can create during push)

---

## Method 1: Using Command Line (Recommended)

### Step 1: Open Terminal/Command Prompt
Navigate to your project folder:
```bash
cd C:\Users\naren\OneDrive\Documents\Desktop\Careertrack
```

### Step 2: Initialize Git (if not already done)
```bash
git init
```

### Step 3: Configure Git (First time only)
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 4: Add All Files
```bash
git add .
```

### Step 5: Commit Changes
```bash
git commit -m "Initial commit: ProConnect - Professional Networking Platform"
```

### Step 6: Create GitHub Repository
1. Go to https://github.com
2. Click "+" icon → "New repository"
3. Name: `ProConnect` or `professional-networking-platform`
4. Description: "LinkedIn + Internshala inspired professional networking and job portal"
5. Choose Public or Private
6. **DO NOT** initialize with README (we already have code)
7. Click "Create repository"

### Step 7: Connect to GitHub
Replace `YOUR_USERNAME` and `REPO_NAME` with your actual values:
```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

Example:
```bash
git remote add origin https://github.com/johndoe/ProConnect.git
```

### Step 8: Push to GitHub
```bash
git branch -M main
git push -u origin main
```

### Step 9: Enter Credentials
- Username: Your GitHub username
- Password: Use **Personal Access Token** (not your password)

---

## Method 2: Using GitHub Desktop (Easier)

### Step 1: Download GitHub Desktop
- Download from: https://desktop.github.com/
- Install and sign in with GitHub account

### Step 2: Add Repository
1. Open GitHub Desktop
2. File → Add Local Repository
3. Choose folder: `C:\Users\naren\OneDrive\Documents\Desktop\Careertrack`
4. Click "Add Repository"

### Step 3: Create Repository on GitHub
1. Click "Publish repository" button
2. Name: `ProConnect`
3. Description: "Professional Networking Platform"
4. Choose Public/Private
5. Click "Publish repository"

Done! ✅

---

## Method 3: Using VS Code

### Step 1: Open Project in VS Code
```bash
code C:\Users\naren\OneDrive\Documents\Desktop\Careertrack
```

### Step 2: Initialize Git
1. Click Source Control icon (left sidebar)
2. Click "Initialize Repository"

### Step 3: Stage Changes
1. Click "+" next to "Changes" to stage all files
2. Or click "+" next to individual files

### Step 4: Commit
1. Type commit message: "Initial commit: ProConnect Platform"
2. Click ✓ (checkmark) or press Ctrl+Enter

### Step 5: Publish to GitHub
1. Click "Publish to GitHub" button
2. Choose repository name
3. Select Public/Private
4. Click "Publish"

---

## 🔑 Creating Personal Access Token (For Command Line)

If using command line and it asks for password:

### Step 1: Go to GitHub Settings
1. GitHub.com → Click your profile → Settings
2. Scroll down → Developer settings
3. Personal access tokens → Tokens (classic)
4. Generate new token (classic)

### Step 2: Configure Token
- Note: "ProConnect Git Access"
- Expiration: 90 days (or custom)
- Select scopes:
  - ✅ repo (all)
  - ✅ workflow
- Click "Generate token"

### Step 3: Copy Token
- **IMPORTANT:** Copy the token NOW (you won't see it again)
- Use this as password when pushing

---

## 📝 Quick Commands Reference

```bash
# Check status
git status

# Add specific file
git add filename.js

# Add all files
git add .

# Commit with message
git commit -m "Your message"

# Push to GitHub
git push

# Pull latest changes
git pull

# Check remote URL
git remote -v

# Change remote URL
git remote set-url origin https://github.com/USERNAME/REPO.git
```

---

## 🎯 Recommended Commit Message

```
Initial commit: ProConnect - Professional Networking Platform

Features:
- User authentication (JWT)
- Profile management
- Job portal with applications
- Social feed with like/comment/share
- Connection system
- Real-time notifications
- Projects showcase
- Analytics dashboard
- Settings management
- Media upload (photos/videos)
- Responsive design

Tech Stack:
- Frontend: React 19, TypeScript, Framer Motion
- Backend: Node.js, Express, MongoDB
- Authentication: JWT, Bcrypt
```

---

## ⚠️ Important Notes

1. **Never commit .env files** - Already in .gitignore
2. **Never commit node_modules** - Already in .gitignore
3. **Use meaningful commit messages**
4. **Push regularly** to backup your work

---

## 🔄 Future Updates

After initial push, use these commands:

```bash
# Make changes to code
# ...

# Stage changes
git add .

# Commit
git commit -m "Add feature: user profile editing"

# Push
git push
```

---

## 🆘 Troubleshooting

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/REPO.git
```

### Error: "failed to push"
```bash
git pull origin main --rebase
git push
```

### Error: "authentication failed"
- Use Personal Access Token instead of password
- Or use GitHub Desktop/VS Code

---

## ✅ Verification

After pushing, verify on GitHub:
1. Go to your repository URL
2. Check all files are there
3. README.md should display
4. Check commit history

---

## 🎉 Success!

Your code is now on GitHub! Share the link:
```
https://github.com/YOUR_USERNAME/ProConnect
```

Add this to your resume and LinkedIn! 🚀
