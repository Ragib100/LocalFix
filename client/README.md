# LocalFix Client

## Environment Setup

This application uses environment variables for configuration. Follow these steps to set up your environment:

### 1. Create Environment File

Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your configuration:

```env
# API Configuration
SERVER_URL=http://localhost:5000

# Email Server Configuration (if separate)
EMAIL_URL=http://localhost:5001
```

### 3. For Production (Vercel Deployment)

When deploying to Vercel, add these environment variables in your Vercel project settings:

- `SERVER_URL`: Your production API URL (e.g., `https://api.yourapp.com`)
- `EMAIL_URL`: Your production email server URL (if different from main API)

### 4. Run the Application

#### Development
```bash
npm run dev
```

#### Build for Production
```bash
npm run build
```

#### Preview Production Build
```bash
npm run preview
```

## Deployment to Vercel

This project is configured for deployment to Vercel with the `vercel.json` configuration file.

### Steps:

1. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

2. Deploy using Vercel CLI:
   ```bash
   vercel
   ```

3. Or connect your repository to Vercel's dashboard for automatic deployments.

4. Set environment variables in Vercel project settings:
   - Go to your project in Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add `SERVER_URL` with your production API URL

### Important Notes

- All environment variables for Vite must start with `VITE_` prefix
- Changes to `.env` require restarting the development server
- Never commit `.env` files to version control
- Use `.env.example` as a template for other developers
