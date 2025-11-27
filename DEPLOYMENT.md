# LocalFix Deployment Guide

## Architecture Overview

```
Vercel (Frontend)  →  Render (Backend API)  →  Cloud VM (Email Service)
                              ↓
                        Oracle Database
```

## Deployment Steps

### 1. Email Service (Cloud VM)

**Setup on VM:**
```bash
# SSH into your VM
ssh user@your-vm-ip

# Clone or upload email_server.js
cd /path/to/email-service

# Install dependencies
npm install express nodemailer cors dotenv

# Create .env file
cat > .env << EOF
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_PORT=5001
EOF

# Run with PM2 (recommended for production)
npm install -g pm2
pm2 start email_server.js --name "localfix-email"
pm2 save
pm2 startup

# Or run with nohup
nohup node email_server.js &
```

**Firewall Configuration:**
```bash
# Allow port 5001
sudo ufw allow 5001/tcp
# Or for iptables
sudo iptables -A INPUT -p tcp --dport 5001 -j ACCEPT
```

**Get your VM's public IP or domain:**
```bash
curl ifconfig.me
# Or use your domain: email.yourdomain.com
```

### 2. Backend API (Render)

**Environment Variables on Render:**
```env
# Database
DB_USER=localfix
DB_PASSWORD=your-db-password
DB_CONNECT_STRING=your-db-host:1521/XEPDB1

# JWT
JWT_SECRET=your-secure-jwt-secret

# Server
PORT=5000
NODE_ENV=production

# Frontend URL (Vercel)
CLIENT_URL=https://your-app.vercel.app

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Mapbox
MAPBOX_TOKEN=your-mapbox-token

# Email Service URL (Your VM)
EMAIL_SERVICE_URL=http://YOUR_VM_IP:5001
# Or with domain: https://email.yourdomain.com
```

**Build Command:** `npm install`  
**Start Command:** `npm start`  
**Root Directory:** `server`

### 3. Frontend (Vercel)

**Environment Variables on Vercel:**
```env
# Backend API URL (Render)
VITE_SERVER_URL=https://your-app-name.onrender.com
```

**Build Settings:**
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `client`

### 4. Local Development

**Terminal 1 - Backend:**
```bash
cd server
npm install
npm start
```

**Terminal 2 - Email Service:**
```bash
cd server
node email_server.js
```

**Terminal 3 - Frontend:**
```bash
cd client
npm install
npm run dev
```

## Email Flow

1. **Vercel (Frontend)** calls `/api/send-email` on Render backend
2. **Render (Backend)** proxies the request to VM's email service
3. **VM (Email Service)** sends email via Gmail SMTP
4. Response flows back: VM → Render → Vercel

## Security Considerations

### Email Service VM:
- Use HTTPS with SSL certificate (Let's Encrypt)
- Implement rate limiting
- Add IP whitelisting (only allow Render's IPs)
- Use environment variables, never hardcode credentials
- Enable firewall and close unnecessary ports

### Recommended nginx config for HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name email.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/email.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/email.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Only allow Render IPs (add Render's IP ranges)
        allow YOUR_RENDER_IP;
        deny all;
    }
}
```

## Testing the Deployment

1. **Test Email Service directly:**
```bash
curl -X POST http://YOUR_VM_IP:5001/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","text":"Test message"}'
```

2. **Test Backend Proxy:**
```bash
curl -X POST https://your-app.onrender.com/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","text":"Test message"}'
```

3. **Test from Frontend:**
- Go to your Vercel app
- Try registering or any feature that sends emails
- Check browser console and network tab

## Troubleshooting

**Email not sending:**
- Check VM is running: `pm2 status`
- Check VM logs: `pm2 logs localfix-email`
- Verify firewall allows port 5001
- Test Gmail credentials with nodemailer

**Connection refused:**
- Ensure EMAIL_SERVICE_URL is correct in Render
- Check VM firewall settings
- Verify email_server.js is running

**CORS errors:**
- Add Render domain to email_server.js CORS config
- Check CLIENT_URL in backend .env

## Monitoring

**On VM:**
```bash
# Check email service status
pm2 status

# View logs
pm2 logs localfix-email

# Restart if needed
pm2 restart localfix-email
```

**On Render:**
- Check logs in Render dashboard
- Monitor response times
- Set up health checks

## Cost Optimization

- Use free tier VMs (Oracle Cloud, AWS Free Tier, etc.)
- Render free tier for backend (sleeps after inactivity)
- Vercel free tier for frontend
- Implement email queue to batch requests
