# 🚀 Supabase Storage Setup Guide

Complete setup steps for using Supabase Cloud Storage with LocalFix.

---

## 📦 Setup Steps

### Step 1: Get Supabase Credentials (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or login
3. Click **"New Project"**
4. Fill in:
   - **Name**: LocalFix (or your choice)
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
5. Wait for provisioning (~2 minutes)
6. Go to **Settings** → **API**
7. Copy these values:

```
Project URL: https://xxxxx.supabase.co
service_role key: eyJhbGciOi... (long string)
```

⚠️ **Important**: Use the **service_role** key, NOT the anon key!

### Step 2: Update Environment Variables

Edit `/server/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
```

### Step 3: Initialize Storage Buckets

```bash
cd server
node scripts/initSupabase.js
```

**Expected output:**
```
🚀 Initializing Supabase Storage Buckets...

✅ Profiles bucket created (public)
✅ Issue images bucket created (public)
✅ Proofs bucket created (private - admin access only)

✅ Supabase initialization complete!
```

### Step 4: Start Your Server

```bash
npm start
```

### Step 5: Test Upload

```bash
curl -X POST http://localhost:5000/api/uploads/issue \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -F "image=@test.jpg"
```

**Expected response:**
```json
{
  "success": true,
  "fileUrl": "https://xxx.supabase.co/storage/v1/object/public/issue-images/..."
}
```

✅ **Done!** Your images are now stored in Supabase Cloud Storage.

---

## � Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase Dashboard](https://app.supabase.com)

---

**Happy coding! 🚀**

---

**Happy coding! 🚀**
