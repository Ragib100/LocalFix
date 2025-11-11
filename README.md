# 🔧 LocalFix - Community Issue Fixing Platform

LocalFix is a platform that connects citizens who report local issues with workers who can fix them, managed by administrators.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Oracle Database
- Supabase Account (for image storage)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Saif-Sakib/LocalFix.git
cd LocalFix
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Set up Supabase Storage:
```bash
# See SUPABASE_SETUP.md for complete guide
# Quick steps:
# 1. Create Supabase project at supabase.com
# 2. Add credentials to server/.env
# 3. Run: cd server && node scripts/initSupabase.js
```

4. Set up environment variables:
```bash
cp server/.env.example server/.env
# Edit .env with your database and Supabase credentials
```

5. Start development servers:
```bash
npm run dev
```

This will start:
- React frontend on http://localhost:3000
- Express backend on http://localhost:5000

📖 **Image Storage**: See `SUPABASE_SETUP.md` for complete Supabase configuration guide.

## 👥 Team Members & Responsibilities

- **Member 1**: Md Saif Ahmed
- **Member 2**: Md Shihab Ahmed
- **Member 3**: Md Ragib Hossain
- **Member 4**: Md Arafat Hasan
- **Member 5**: Md Saifuddin Shawon

## 📱 Features

- 🏠 **Citizens**: Post local issues, review applications, rate workers
- ⚒️ **Workers**: Browse jobs, submit applications, complete tasks
- 👨‍💼 **Admins**: Review applications, verify completions, manage platform

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: Oracle Database
- **Authentication**: JWT

## 📝 License

MIT License
