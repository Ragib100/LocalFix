# 🔧 LocalFix - Community Issue Fixing Platform

LocalFix is a platform that connects citizens who report local issues with workers who can fix them, managed by administrators.

## 🌐 Live Demo

- **Frontend**: [Deployed on Vercel]
- **Backend**: [Deployed on Render]
- **Email Service**: Running on Cloud VM

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Oracle Database
- Git

### Local Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Ragib100/LocalFix.git
cd LocalFix
```

2. **Backend Setup:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials and configurations
node server.js
```

3. **Frontend Setup:**
```bash
cd client
npm install
cp .env.example .env
# Edit .env with your backend URL
npm run dev
```

4. **Email Service Setup (Optional - for OTP emails):**
```bash
cd server
node email_server.js
```

### Environment Variables

**Backend (`server/.env`):**
```env
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_CONNECT_STRING=your_db_host:1521/XEPDB1
JWT_SECRET=your_secure_jwt_secret
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
EMAIL_SERVICE_URL=http://localhost:5001
MAPBOX_TOKEN=your_mapbox_token
```

**Frontend (`client/.env`):**
```env
VITE_SERVER_URL=http://localhost:5000
```

**Email Service (on VM):**
```env
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
EMAIL_PORT=5001
```

## 📱 Features

### 🏠 Citizens
- Post local issues with photos and location
- Browse and track issue status
- Review worker applications
- Rate and review completed work
- View personal dashboard with statistics

### ⚒️ Workers
- Browse available jobs in their area
- Submit applications for issues
- Upload proof of completed work
- Track earnings and payment history
- Request withdrawals

### 👨‍💼 Admins
- Review and approve/reject applications
- Verify work completion proofs
- Process payments to workers
- Manage platform operations
- View comprehensive analytics

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Styling**: CSS3 with custom animations
- **Maps**: Mapbox GL
- **HTTP Client**: Axios
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js v24
- **Framework**: Express.js
- **Database**: Oracle Database (OracleDB driver)
- **Authentication**: JWT + HTTP-only cookies
- **Security**: Helmet, CORS, Rate Limiting
- **File Upload**: Multer
- **Email**: Nodemailer
- **Deployment**: Render

### Email Service
- **Standalone Service**: Express + Nodemailer
- **Provider**: Gmail SMTP
- **Deployment**: Cloud VM

## 📂 Project Structure

```
LocalFix/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components (citizen/worker/admin)
│   │   ├── context/       # React Context (Auth)
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS files
│   ├── public/            # Static assets
│   └── vercel.json        # Vercel configuration
│
├── server/                # Backend Express application
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth & validation middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic & services
│   ├── app.js           # Express app setup
│   ├── server.js        # Server entry point
│   └── email_server.js  # Standalone email service
│
├── database/             # Database migrations & seeds
│   ├── migrations/      # SQL migration files
│   └── seeds/          # Sample data
│
├── uploads/             # User-uploaded files (local dev)
│   ├── profiles/       # Profile pictures
│   ├── issue_img/      # Issue photos
│   └── proofs/         # Work completion proofs
│
├── shared/              # Shared constants
└── DEPLOYMENT.md        # Detailed deployment guide
```

## 🚀 Deployment

### Vercel (Frontend)
1. Import project to Vercel
2. Set root directory to `client`
3. Add environment variable:
   - `VITE_SERVER_URL=https://your-backend.onrender.com`
4. Deploy

### Render (Backend)
1. Create new Web Service
2. Set root directory to `server`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables from `.env`
6. Deploy

### Cloud VM (Email Service)
1. SSH into your VM
2. Upload `email_server.js` and install dependencies
3. Run with PM2: `pm2 start email_server.js --name localfix-email`
4. Configure firewall to allow port 5001

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔐 Security Features

- JWT-based authentication with HTTP-only cookies
- Password hashing with bcrypt
- CORS protection with origin validation
- Rate limiting on API endpoints
- Helmet.js security headers
- SQL injection prevention
- File upload validation
- Environment variable protection

## 📊 API Documentation

See all available APIs:
- Authentication: `/api/auth/*`
- Issues: `/api/issues/*`
- Workers: `/api/worker/*`
- Payments: `/api/payments/*`
- File Uploads: `/api/uploads/*`
- Proofs: `/api/proofs/*`

For complete API documentation, check the route files in `server/routes/`

## 👥 Team Members

- **Md Saif Ahmed** - [@Saif-Sakib](https://github.com/Saif-Sakib)
- **Md Shihab Ahmed**
- **Md Ragib Hossain** - [@Ragib100](https://github.com/Ragib100)
- **Md Arafat Hasan**
- **Md Saifuddin Shawon**

## 📝 License

MIT License

---

**Built with ❤️ by the LocalFix Team**
