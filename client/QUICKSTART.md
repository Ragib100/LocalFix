# Quick Start Guide - Environment Variables

## 🚀 Immediate Steps

### Step 1: Create .env File
```bash
cd client
cp .env.example .env
```

### Step 2: Start Development Server
```bash
npm install
npm run dev
```

Your app will run with default settings (localhost:5000)

## 🌐 Deploy to Vercel

### Quick Deploy
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel
```

### Set Environment Variables in Vercel Dashboard
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Variable**: `SERVER_URL`
   - **Value**: `https://your-backend-api.com`
4. Click "Save"
5. Redeploy

## 📝 Environment Variables Reference

| Variable | Purpose | Default | Production Example |
|----------|---------|---------|-------------------|
| `SERVER_URL` | Backend API URL | `http://localhost:5000` | `https://api.yourapp.com` |
| `EMAIL_URL` | Email service URL | `http://localhost:5001` | `https://email.yourapp.com` |

## ✅ What's Been Fixed

All these files now use environment variables:
- ✅ All API calls in components
- ✅ Axios configuration
- ✅ Image URLs
- ✅ Email service calls
- ✅ Vite proxy configuration

## 🔧 Troubleshooting

### Environment variable not working?
1. Restart dev server: `Ctrl+C` then `npm run dev`
2. Check it starts with `VITE_`
3. Check no quotes around values in .env

### CORS errors in production?
Your backend needs to allow your Vercel domain in CORS settings.

### 404 on page refresh?
Already handled by `vercel.json` rewrites configuration.

## 📚 Files to Reference

- **Setup Guide**: `README.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Complete Summary**: `MIGRATION_SUMMARY.md`
- **Environment Template**: `.env.example`

## ⚡ Common Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
vercel --prod
```

## 🎯 Remember

- ✅ Never commit `.env` files
- ✅ Always use `.env.example` as template
- ✅ Environment variables are public (no secrets!)
- ✅ Must start with `VITE_` prefix
- ✅ Restart dev server after changes
