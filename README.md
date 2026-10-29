# 🔧 LocalFix - Community Issue Fixing Platform

LocalFix is a full-stack web platform that connects citizens who report local infrastructure issues with skilled workers who can fix them, all managed through an administrative system. The platform streamlines community problem-solving by enabling issue reporting, worker applications, payment processing, and quality ratings.

## 🌐 Live Demo

- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render
- **Email**: Resend API
- **Database**: Neon PostgreSQL
- **File Storage**: Neon Object Storage

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Neon project in a region that supports Object Storage
- Git

### Local Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Ragib100/LocalFix.git
cd LocalFix
```

2. **Neon Database Setup:**
```bash
# Link this checkout to your Neon project and branch
npm install -g neon@latest
neon auth
neon link
neon deploy
neon env pull --file server/.env

# Run migrations with the direct (unpooled) Neon URL
cd database
psql "YOUR_NEON_DIRECT_URL" -f migrations/999_run_all_migrations.sql

# (Optional) Seed sample data
psql "YOUR_NEON_DIRECT_URL" -f seeds/seed_data.sql
```

3. **Backend Setup:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration (see below)
npm start
```

4. **Frontend Setup:**
```bash
cd client
npm install
cp .env.example .env
# Edit .env with your backend URL
npm run dev
```

5. **Email Setup:** Set `RESEND_API_KEY` and `Email_from` in `server/.env` to
   enable email delivery through Resend. No separate email process is needed.

### Environment Variables

**Backend (`server/.env`):**
```env
# Neon PostgreSQL connection string (pooled URL for application traffic)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=verify-full

# Neon Object Storage (provision with `neon deploy`, then pull with `neon env pull`)
AWS_ACCESS_KEY_ID=your-neon-storage-access-key
AWS_SECRET_ACCESS_KEY=your-neon-storage-secret-key
AWS_ENDPOINT_URL_S3=https://your-branch-storage-endpoint
AWS_REGION=your-neon-region

# JWT Secret (use a strong random string)
JWT_SECRET=your_secure_jwt_secret_min_32_characters

NODE_ENV=development
PORT=5000

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Mapbox Token (for maps)
MAPBOX_TOKEN=your_mapbox_access_token

# Email, uploads, and sender
RESEND_API_KEY=your-resend-api-key
Email_from=your-verified-sender@example.com
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

**Frontend (`client/.env`):**
```env
VITE_SERVER_URL=http://localhost:5000
```

**Email (`server/.env`):**
```env
RESEND_API_KEY=your-resend-api-key
Email_from=your-verified-sender@example.com
```

## 📱 Features

### 🏠 Citizens
- **Issue Reporting**: Post local infrastructure problems with photos, descriptions, and GPS location
- **Real-time Tracking**: Monitor issue status from posted → under review → in progress → completed
- **Worker Selection**: Review and accept worker applications based on proposals and cost estimates
- **Quality Control**: Rate and review completed work to maintain service quality
- **Dashboard Analytics**: View personal statistics, issue history, and spending
- **Notifications**: Receive updates on application submissions and work completion

### ⚒️ Workers
- **Job Discovery**: Browse available issues in their area with location-based filtering
- **Application System**: Submit detailed proposals with cost estimates and timelines
- **Proof Submission**: Upload before/after photos as proof of completed work
- **Earnings Management**: Track income, view payment history, and request withdrawals
- **Performance Metrics**: View ratings, completed jobs, and success rate
- **Dashboard**: Comprehensive overview of active jobs, applications, and earnings

### 👨‍💼 Admins
- **Application Review**: Approve or reject worker applications with feedback
- **Work Verification**: Review completion proofs and verify quality before payment release
- **Payment Processing**: Process payments to workers after successful completion
- **Withdrawal Management**: Handle worker withdrawal requests
- **Platform Analytics**: View comprehensive statistics with charts and visualizations
- **User Management**: Oversee citizens, workers, and their activities
- **Content Moderation**: Monitor and manage platform content

### 🔔 Common Features
- **Secure Authentication**: JWT-based auth with HTTP-only cookies and refresh tokens
- **Profile Management**: Update personal information and profile pictures
- **Interactive Maps**: Mapbox integration for location selection and visualization
- **Responsive Design**: Mobile-friendly interface with smooth animations
- **Real-time Updates**: Live status updates and notifications
- **File Management**: Neon Object Storage for uploaded images

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Hooks and Context API
- **Build Tool**: Vite 7 (Fast HMR and optimized builds)
- **Routing**: React Router v6 (SPA navigation)
- **Styling**: CSS3 with custom animations and responsive design
- **Maps**: Mapbox GL JS (Interactive maps with geocoding)
- **HTTP Client**: Axios (API communication with interceptors)
- **State Management**: React Context API (AuthContext)
- **Forms**: React Hook Form (Form validation)
- **Charts**: Recharts (Data visualization for dashboards)
- **Notifications**: React Hot Toast (User feedback)
- **Icons**: React Icons
- **Analytics**: Vercel Analytics + Speed Insights
- **Deployment**: Vercel (Serverless, automatic HTTPS, global CDN)

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js 4 (RESTful API)
- **Database**: PostgreSQL (production-ready with connection pooling)
  - **Driver**: `pg` (node-postgres)
  - **Connection Pool**: Optimized with keepalive and auto-reconnection
  - **Migration System**: Custom SQL migrations with triggers and functions
- **Authentication**: 
  - JWT (Access tokens with 15min expiry)
  - Refresh tokens (7-day expiry)
  - HTTP-only cookies (XSS protection)
  - bcryptjs (Password hashing)
- **Security**: 
  - Helmet.js (Security headers)
  - CORS with origin validation
  - express-rate-limit (DDoS protection)
  - express-validator (Input validation)
  - SQL injection prevention via parameterized queries
- **File Storage**: Neon Object Storage (S3-compatible, branch-aware buckets)
- **File Upload**: Multer (Multipart form handling)
- **Email**: Resend API (`resend` Node.js SDK)
- **Deployment**: Render (Managed Node.js hosting with auto-deploy)

### Email Delivery
- **Provider**: Resend
- **Integration**: Backend email controller calls the Resend API
- **Configuration**: `RESEND_API_KEY` and verified `Email_from` sender

### Database Architecture
- **PostgreSQL Features**:
  - Relational integrity with foreign keys
  - Triggers for auto-timestamps and validation
  - Views for complex queries
  - Stored functions for business logic
  - Transaction support for data consistency
- **Connection Pool**:
  - On-demand connection creation (min: 0, max: 10)
  - TCP keepalive to prevent timeouts
  - Auto-recovery on connection errors
  - 10-minute idle timeout

### File Storage (Neon)
- **Buckets**: `profiles`, `issue-images`, and `proofs`
- **Access**: Public-read object URLs; uploads and deletes go through the API
- **Configuration**: Root `neon.ts`, applied with `neon deploy`
- **Migration**: `server/scripts/migrateSupabaseStorageToNeon.js` copies legacy files and updates their Postgres URLs

## 📂 Project Structure

```
LocalFix/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── home/          # Landing page components (Hero, Features, etc.)
│   │   │   ├── AnimatedBackground.jsx
│   │   │   └── AnimatedBackground.css
│   │   ├── pages/             # Page components by user role
│   │   │   ├── home.jsx       # Public landing page
│   │   │   ├── auth/          # Authentication pages (login, signup, OTP)
│   │   │   ├── citizen/       # Citizen-specific pages (dashboard, post issue)
│   │   │   ├── worker/        # Worker-specific pages (jobs, applications)
│   │   │   ├── admin/         # Admin pages (analytics, payments, reviews)
│   │   │   └── common/        # Shared pages (profile, view details)
│   │   ├── context/           # React Context providers
│   │   │   └── AuthContext.jsx # Authentication state management
│   │   ├── utils/             # Utility functions
│   │   │   ├── imageUtils.js  # Image URL handling
│   │   │   └── send_email.js  # Email API client
│   │   ├── styles/            # CSS modules by feature/role
│   │   │   ├── home.css
│   │   │   ├── admin/
│   │   │   ├── citizen/
│   │   │   ├── worker/
│   │   │   └── common/
│   │   ├── App.jsx            # Main app component with routing
│   │   ├── main.jsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── public/                # Static assets (favicon, images)
│   ├── index.html             # HTML entry point
│   ├── vite.config.js         # Vite configuration
│   ├── vercel.json            # Vercel deployment config
│   └── package.json           # Frontend dependencies
│
├── server/                     # Backend Express application
│   ├── config/                # Configuration modules
│   │   ├── database.js        # PostgreSQL connection pool & query executor
│   │   └── neonStorage.js     # Neon S3-compatible storage client
│   ├── controllers/           # Route handlers (business logic)
│   │   ├── authController.js  # Login, signup, JWT refresh, OTP
│   │   ├── issueController.js # Issue CRUD, status updates, filtering
│   │   ├── workerController.js # Applications, job listings
│   │   ├── paymentsController.js # Payment processing, withdrawals
│   │   ├── jobProofController.js # Proof submissions and verification
│   │   └── fileController.js  # File upload/download via Neon
│   ├── middleware/            # Express middleware
│   │   ├── auth.js            # JWT verification, role-based access
│   │   └── validators.js      # Input validation schemas
│   ├── models/                # Database models
│   │   └── User.js            # User model with CRUD operations
│   ├── routes/                # API route definitions
│   │   ├── auth.js            # /api/auth/* routes
│   │   ├── issueRoutes.js     # /api/issues/* routes
│   │   ├── workerRoutes.js    # /api/worker/* routes
│   │   ├── paymentsRoutes.js  # /api/payments/* routes
│   │   ├── jobProofRoutes.js  # /api/proofs/* routes
│   │   ├── uploadRoutes.js    # /api/uploads/* routes
│   │   └── configRoutes.js    # /api/config/* routes (Mapbox token)
│   ├── services/              # Business logic services
│   │   └── uploadService.js   # Neon Object Storage operations
│   ├── app.js                 # Express app setup (middleware, routes)
│   ├── server.js              # Server entry point with graceful shutdown
│   ├── controllers/emailController.js # Sends messages through Resend
│   └── package.json           # Backend dependencies
│
├── database/                   # Database schema and migrations
│   ├── migrations/            # PostgreSQL migration files
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_create_locations_table.sql
│   │   ├── 003_create_issues_table.sql
│   │   ├── 004_create_applications_table.sql
│   │   ├── 005_create_issue_proofs_table.sql
│   │   ├── 006_create_payments_table.sql
│   │   ├── 007_create_ratings_table.sql
│   │   ├── 008_create_withdrawals_table.sql
│   │   ├── 999_run_all_migrations.sql # Master migration script
│   │   ├── README_Database.md
│   │   └── README_POSTGRESQL.md # Migration guide
│   ├── seeds/                 # Sample data for testing
│   │   └── seed_data.sql
│   ├── Database Operations.txt
│   ├── Queries Used.txt
│   └── Queries_Used_Report.md
│
├── shared/                     # Shared constants between frontend/backend
│   └── constants.js
│
├── uploads/                    # Local development file storage (deprecated)
│   ├── profiles/              # Legacy local uploads
│   ├── issue_img/             # Legacy local uploads
│   └── proofs/                # Legacy local uploads
│
├── neon.ts                    # Neon Object Storage bucket configuration
├── .gitignore                 # Git ignore rules
├── package.json               # Root package.json (workspace management)
├── README.md                  # This file
├── DEPLOYMENT.md              # Detailed deployment guide
└── neon_setup.md              # Neon Object Storage setup and Supabase migration
```

## 🚀 Deployment

### Prerequisites
- Vercel account (Frontend)
- Render account (Backend)
- Neon project (PostgreSQL and Object Storage)

### 1. Neon Database and Object Storage

From the repository root, link the existing Neon project, provision the buckets
declared in `neon.ts`, and pull the branch environment:

```bash
npm install -g neon@latest
neon auth
neon link
neon deploy
neon env pull --file server/.env
```

For existing Supabase files, follow [the migration guide](./neon_setup.md)
before removing the old source credentials.

### 2. Database Setup (Neon PostgreSQL)

1. Select the Neon project and branch for the application.
2. Use the branch's pooled connection string as `DATABASE_URL` for the app.
3. Connect via psql or database client:
   ```bash
   psql "YOUR_NEON_DIRECT_URL"
   ```
4. Run all migrations:
   ```bash
   cd database
   psql "YOUR_NEON_DIRECT_URL" -f migrations/999_run_all_migrations.sql
   ```
5. (Optional) Seed sample data:
   ```bash
   psql -h <host> -U <username> -d <database> -f database/seeds/seed_data.sql
   ```

### 3. Render (Backend)

1. **Create New Web Service**
   - Connect your GitHub repository
   - Name: `localfix-backend` (or your choice)

2. **Configure Build Settings**
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

3. **Add Environment Variables**
   ```env
   DATABASE_URL=<pooled_neon_connection_string>
   AWS_ACCESS_KEY_ID=<neon_storage_access_key>
   AWS_SECRET_ACCESS_KEY=<neon_storage_secret_key>
   AWS_ENDPOINT_URL_S3=<neon_branch_storage_endpoint>
   AWS_REGION=<neon_project_region>
   JWT_SECRET=<generate_strong_random_string>
   NODE_ENV=production
   CLIENT_URL=https://your-app.vercel.app
   MAPBOX_TOKEN=<your_mapbox_token>
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy the service URL: `https://your-service.onrender.com`

### 4. Vercel (Frontend)

1. **Import Project**
   - Go to Vercel dashboard
   - Click "Add New" → "Project"
   - Import your GitHub repository

2. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Add Environment Variable**
   ```env
   VITE_SERVER_URL=https://your-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build completion (2-5 minutes)
   - Access your app at: `https://your-app.vercel.app`

### 5. Configure Resend Email

Set `RESEND_API_KEY` and `Email_from` in the Render backend environment. The
sender address must be verified with Resend. Email is sent directly by the
backend; there is no separate VM or SMTP service to deploy.

### Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend.onrender.com/`
- [ ] Frontend loads correctly
- [ ] Login/Signup works
- [ ] File uploads work (check the linked Neon branch's Object Storage buckets)
- [ ] Email OTP delivery (if email service configured)
- [ ] Database connections stable (no timeout errors)
- [ ] Maps display correctly (Mapbox token valid)
- [ ] CORS configured (frontend can call backend)
- [ ] HTTPS enabled on all services

For detailed troubleshooting and advanced configuration, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🔐 Security Features

- **Authentication & Authorization**
  - JWT-based authentication with access tokens (15min expiry)
  - Refresh tokens for seamless re-authentication (7-day expiry)
  - HTTP-only cookies to prevent XSS attacks
  - Role-based access control (citizen/worker/admin)
  - Secure password hashing with bcryptjs (10 rounds)

- **API Security**
  - CORS protection with origin whitelist validation
  - Rate limiting (100 requests per 15 minutes per IP)
  - Helmet.js security headers (XSS, clickjacking protection)
  - Express trust proxy configuration for production
  - Input validation on all endpoints (express-validator)
  
- **Database Security**
  - Parameterized queries (SQL injection prevention)
  - Connection pool with timeout protection
  - Secure connection credentials via environment variables
  - No sensitive data in logs (password sanitization)
  
- **File Upload Security**
  - File type validation (images only)
  - File size limits (10MB max)
  - Neon buckets allow public reads; upload and delete operations use backend credentials
  - Sanitized filenames (prevent path traversal)
  
- **Production Hardening**
  - Environment variable protection (never committed)
  - HTTPS enforcement on all deployments
  - Secure cookie configuration (sameSite, httpOnly, secure flags)
  - Database connection keepalive (prevents timeout exploits)
  - Graceful error handling (no stack traces exposed in production)

## 📊 API Documentation

### Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://your-backend.onrender.com`

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - User login (returns JWT in cookie)
- `POST /logout` - Logout and clear cookies
- `POST /send-otp` - Send OTP for email verification
- `POST /verify-otp` - Verify OTP code
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with token
- `GET /refresh` - Refresh access token
- `GET /me` - Get current user info

#### Issues (`/api/issues`)
- `GET /` - List all issues (with filters)
- `GET /:id` - Get issue details
- `POST /` - Create new issue (citizen only)
- `PUT /:id` - Update issue (citizen/admin)
- `DELETE /:id` - Delete issue (citizen/admin)
- `PUT /:id/status` - Update issue status (admin)

#### Worker (`/api/worker`)
- `GET /jobs` - List available jobs for workers
- `POST /apply` - Submit application for an issue
- `GET /applications` - Get worker's applications
- `GET /earnings` - Get earnings summary
- `PUT /applications/:id` - Update application

#### Payments (`/api/payments`)
- `POST /process` - Process payment to worker (admin)
- `GET /worker/:id` - Get worker payment history
- `POST /withdraw` - Request withdrawal (worker)
- `GET /withdrawals` - List withdrawal requests (admin)
- `PUT /withdrawals/:id` - Approve/reject withdrawal (admin)

#### Proofs (`/api/proofs`)
- `POST /` - Submit work completion proof (worker)
- `GET /issue/:id` - Get proofs for an issue
- `PUT /:id/verify` - Verify proof (admin)

#### Uploads (`/api/uploads`)
- `POST /profile` - Upload profile picture
- `POST /issue` - Upload issue image
- `POST /proof` - Upload proof image
- `GET /image/:folder/:filename` - Redirect to the Neon Object Storage image URL

#### Config (`/api/config`)
- `GET /mapbox-token` - Get Mapbox access token

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}
```

For complete API documentation with request/response examples, check the controller files in `server/controllers/`.

## 🗄️ Database Schema

### Core Tables

**users** - User accounts (citizens, workers, admins)
- Primary key: `user_id` (SERIAL)
- Fields: name, email, password, phone, address, user_type, status, img_url
- Indexes: email (unique)

**locations** - Geographic data for issues
- Primary key: `location_id` (SERIAL)
- Fields: latitude, longitude, full_address, upazila, district
- Indexes: district, upazila

**issues** - Problem reports
- Primary key: `issue_id` (SERIAL)
- Fields: title, description, category, priority, status, image_url, citizen_id, location_id
- Foreign keys: citizen_id → users, location_id → locations
- Status flow: posted → under_review → accepted → in_progress → completed

**applications** - Worker job applications
- Primary key: `application_id` (SERIAL)
- Fields: issue_id, worker_id, estimated_cost, estimated_time, proposal, admin_feedback
- Foreign keys: issue_id → issues, worker_id → users
- Validation: One application per worker per issue (trigger-enforced)

**payments** - Payment transactions
- Primary key: `payment_id` (SERIAL)
- Fields: issue_id, citizen_id, worker_id, amount, payment_method, payment_status, transaction_id
- Foreign keys: issue_id → issues, citizen_id → users, worker_id → users

**issue_proofs** - Work completion evidence
- Primary key: `proof_id` (SERIAL)
- Fields: issue_id, worker_id, proof_photo, description, verified_by, verified_at
- Foreign keys: issue_id → issues, worker_id → users, verified_by → users

**ratings** - Worker performance ratings
- Primary key: `rating_id` (SERIAL)
- Fields: issue_id, citizen_id, worker_id, rating, review
- Constraint: Rating between 1-5

**withdrawals** - Worker withdrawal requests
- Primary key: `withdrawal_id` (SERIAL)
- Fields: worker_id, amount, payment_method, account_details, status, processed_by
- Foreign keys: worker_id → users, processed_by → users

### Views

**v_issues_with_details** - Issues with full citizen and location info
**v_worker_payment_summary** - Aggregated payment data by worker and status

### Functions

**get_issue_count_by_status(worker_id, status)** - Count issues for a worker by status
**set_issue_status_safe(issue_id, status)** - Update status with validation

### Triggers

- Auto-update `updated_at` timestamps on all tables
- Validate worker applications (prevent duplicate applications)
- Validate admin permissions on status changes
- Auto-generate transaction IDs for payments
- Cascade status updates to related records

For complete migration scripts, see `database/migrations/`

## 🧪 Testing

### Local Testing

```bash
# Run backend
cd server
npm start

# Run frontend (in new terminal)
cd client
npm run dev

# Email sends through Resend when RESEND_API_KEY and Email_from are configured.
```

### Test User Accounts (after seeding)

**Admin:**
- Email: `admin@gmail.com`
- Password: `123456`

**Citizen:**
- Email: `citizen@gmail.com`
- Password: `123456`

**Worker:**
- Email: `worker@gmail.com`
- Password: `123456`

### Testing Checklist

- [ ] User registration with OTP verification
- [ ] Login with remember me functionality
- [ ] Citizen: Post issue with image and location
- [ ] Worker: Browse jobs and submit application
- [ ] Admin: Review and accept/reject application
- [ ] Worker: Upload completion proof
- [ ] Admin: Verify proof and process payment
- [ ] Citizen: Rate and review completed work
- [ ] Worker: Request withdrawal
- [ ] All dashboards display correct analytics
- [ ] Profile picture upload/update
- [ ] Map displays correctly with markers
- [ ] Responsive design on mobile devices

## 🐛 Troubleshooting

### Common Issues

**Database Connection Errors:**
```
Error: Connection terminated unexpectedly
```
**Solution:** Check that PostgreSQL is running and credentials in `.env` are correct. The connection pool now has keepalive enabled to prevent timeouts.

**CORS Errors:**
```
Access to fetch has been blocked by CORS policy
```
**Solution:** Ensure `CLIENT_URL` in backend `.env` matches your frontend URL exactly. For Vercel preview deployments, update CORS to allow `*.vercel.app`.

**File Upload Fails:**
```
Failed to upload image
```
**Solution:** Verify the `AWS_*` values belong to the same Neon branch where `neon.ts` was deployed. Confirm the `profiles`, `issue-images`, and `proofs` buckets exist. See [DEPLOYMENT.md](./DEPLOYMENT.md) and the migration guide in [neon_setup.md](./neon_setup.md).

**JWT Errors:**
```
Invalid token or Token expired
```
**Solution:** Clear browser cookies and login again. Ensure `JWT_SECRET` is at least 32 characters. Verify system clocks are synchronized (JWT uses timestamps).

**Rate Limit Errors in Production:**
```
ValidationError: The 'X-Forwarded-For' header is set but Express 'trust proxy' setting is false
```
**Solution:** This is now fixed with `app.set('trust proxy', 1)` in production mode.

**Email Not Sending:**
```
Failed to send email
```
**Solution:** Check that `RESEND_API_KEY` is valid and `Email_from` is a verified sender in Resend. Review the backend logs and Resend delivery status.

**Maps Not Loading:**
```
Map failed to load
```
**Solution:** Verify `MAPBOX_TOKEN` is valid and has not exceeded quota. Check browser console for specific Mapbox errors.

### Debug Mode

Enable detailed logging in backend:
```env
NODE_ENV=development
```

This will show:
- Full error stack traces
- SQL query previews
- Database connection events
- Request/response details

## 📚 Additional Resources

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment guide with troubleshooting
- **[neon_setup.md](./neon_setup.md)** - Neon Object Storage setup and legacy Supabase file transfer
- **[database/migrations/README_POSTGRESQL.md](./database/migrations/README_POSTGRESQL.md)** - Database migration guide
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **React Documentation**: https://react.dev/
- **Express.js Guide**: https://expressjs.com/
- **Mapbox GL JS**: https://docs.mapbox.com/mapbox-gl-js/
- **Neon Object Storage**: https://neon.com/docs/storage/get-started

## 👥 Team Members

- **Md Saif Ahmed** - [@Saif-Sakib](https://github.com/Saif-Sakib)
- **Md Shihab Ahmed**
- **Md Ragib Hossain** - [@Ragib100](https://github.com/Ragib100)
- **Md Arafat Hasan**
- **Md Saifuddin Shawon**

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React and Vite teams for excellent development tools
- Neon for PostgreSQL and branch-aware object storage
- Mapbox for mapping solutions
- PostgreSQL community for robust database technology
- All contributors and testers who helped improve the platform

---

**Built with ❤️ by the LocalFix Team**

*Making communities better, one fix at a time.*
