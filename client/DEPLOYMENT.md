# Deployment Guide for LocalFix Client

## ✅ Changes Made

All hardcoded `http://localhost:5000` URLs have been replaced with the `SERVER_URL` environment variable throughout the application.

### Files Modified:

1. **Configuration Files:**
   - `vite.config.js` - Updated proxy configuration
   - `.env.example` - Created template file
   - `vercel.json` - Created Vercel deployment configuration
   - `.gitignore` - Created to exclude .env files

2. **Core Application Files:**
   - `src/context/AuthContext.jsx` - Base URL configuration
   - `src/utils/send_email.js` - Email server URL

3. **Page Components:**
   - `src/pages/citizen/postIssue.jsx`
   - `src/pages/common/view_details.jsx`
   - `src/pages/common/IssueList.jsx`
   - `src/pages/common/profile.jsx` (already correct)
   - `src/pages/worker/apply_job.jsx`
   - `src/pages/worker/payment.jsx`
   - `src/pages/worker/myApplications/myApplications.jsx`
   - `src/pages/worker/myApplications/submitProof.jsx`
   - `src/pages/admin/payment.jsx`
   - `src/pages/admin/review_problem.jsx`
   - `src/pages/admin/application.jsx`

## 🚀 Deploying to Vercel

### Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### Step 2: Prepare Your Environment

1. Create `.env` file for local development:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your local settings:
   ```env
   SERVER_URL=http://localhost:5000
   EMAIL_URL=http://localhost:5001
   ```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
cd client
vercel
```

Follow the prompts to link your project.

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Set the root directory to `client`
5. Configure environment variables (see below)
6. Deploy

### Step 4: Configure Environment Variables in Vercel

In your Vercel project settings:

1. Go to **Settings → Environment Variables**
2. Add the following variables:

   **For Production:**
   - Name: `SERVER_URL`
   - Value: `https://your-production-api.com` (your actual API URL)
   
   **Optional - Email Server:**
   - Name: `EMAIL_URL`
   - Value: `https://your-email-server.com` (if different from main API)

3. Select the environment (Production, Preview, Development)
4. Save changes

### Step 5: Redeploy

After adding environment variables, redeploy your application:

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

## 🔧 Important Notes

### Environment Variable Naming
- All Vite environment variables **MUST** start with `VITE_` prefix
- They are embedded in the client-side code at build time
- Never store sensitive secrets in these variables (they're public)

### Build Configuration
The `vercel.json` includes:
- Proper routing for Single Page Application
- Cache headers for static assets
- Rewrites to handle client-side routing

### Common Issues

1. **404 on refresh:** Already handled by the rewrite rules in `vercel.json`
2. **Environment variables not working:** Make sure they start with `VITE_` and restart dev server
3. **CORS errors:** Ensure your backend API has proper CORS configuration for your Vercel domain

## 📝 Testing Before Deployment

```bash
# Install dependencies
npm install

# Test development build
npm run dev

# Test production build locally
npm run build
npm run preview
```

## 🔄 Continuous Deployment

Once connected to Git:
- Pushes to `main` branch trigger production deployments
- Pull requests create preview deployments
- Environment variables are automatically included

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
