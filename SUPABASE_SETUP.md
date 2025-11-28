# Supabase Storage Setup Guide

## Overview

This guide will help you set up Supabase Storage for your LocalFix application. The backend has been migrated from local file storage to Supabase Cloud Storage.

## Quick Summary

**What changed:**
- Files now upload to Supabase Cloud Storage (instead of local `uploads/` folder)
- Images are served via Supabase public URLs (CDN-backed)
- All backend controllers updated to use Supabase API
- Frontend compatible with both old and new URLs

---

## Step 1: Create Supabase Account & Project

1. **Sign up for Supabase**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "Start your project" or "Sign In"
   - Sign up with GitHub, Google, or email

2. **Create a New Project**
   - Click "New Project"
   - Fill in the details:
     - **Name:** `LocalFix` (or your preferred name)
     - **Database Password:** Create a strong password (save it!)
     - **Region:** Choose closest to your users
     - **Pricing Plan:** Free tier is sufficient to start
   - Click "Create new project"
   - Wait 2-3 minutes for project setup

3. **Get Your API Credentials**
   - Once project is ready, go to **Settings** (gear icon)
   - Click **API** in the left sidebar
   - Copy these two values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon public key** (long string starting with `eyJ...`)

---

## Step 2: Configure Environment Variables

1. **Edit your `.env` file** in the `server/` directory:

```env
# Add these to your existing .env file
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

2. **Replace the placeholders** with your actual values from Step 1

---

## Step 3: Create Storage Buckets

Your application needs three storage buckets for different types of images.

### Using Supabase Dashboard (Recommended)

1. **Navigate to Storage**
   - In your Supabase dashboard, click **Storage** in the left sidebar
   - Click **"Create a new bucket"** button

2. **Create the "profiles" bucket**
   - **Name:** `profiles`
   - **Public bucket:** ✅ Check this box (important!)
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:** Leave empty or add: `image/jpeg,image/jpg,image/png,image/gif,image/webp`
   - Click **"Create bucket"**

3. **Create the "issue-images" bucket**
   - **Name:** `issue-images` (exactly as written, with hyphen)
   - **Public bucket:** ✅ Check this box
   - **File size limit:** `10485760` (10MB)
   - **Allowed MIME types:** Same as above
   - Click **"Create bucket"**

4. **Create the "proofs" bucket**
   - **Name:** `proofs`
   - **Public bucket:** ✅ Check this box
   - **File size limit:** `10485760` (10MB)
   - **Allowed MIME types:** Same as above
   - Click **"Create bucket"**

### Verify Buckets Created

You should now see three buckets in your Storage tab:
- ✅ profiles
- ✅ issue-images
- ✅ proofs

---

## Step 4: Configure Bucket Policies

Even though buckets are public, you need policies to control read/write access.

### Option A: Using Supabase Dashboard (Easier)

1. **Go to Storage Policies**
   - Click **Storage** in left sidebar
   - Click **Policies** tab at the top

2. **For each bucket** (profiles, issue-images, proofs), create these policies:

#### Public Read Policy (allows anyone to view images)

- Click **"New Policy"** on the bucket
- Choose **"Create a policy from scratch"**
- **Policy name:** `Public Access`
- **Allowed operation:** `SELECT`
- **Policy definition:**
  ```sql
  true
  ```
- Click **"Review"** then **"Save policy"**

#### Authenticated Upload Policy (allows logged-in users to upload)

- Click **"New Policy"**
- **Policy name:** `Authenticated Upload`
- **Allowed operation:** `INSERT`
- **Policy definition:**
  ```sql
  auth.role() = 'authenticated'
  ```
- Click **"Review"** then **"Save policy"**

#### Authenticated Delete Policy (allows logged-in users to delete)

- Click **"New Policy"**
- **Policy name:** `Authenticated Delete`
- **Allowed operation:** `DELETE`
- **Policy definition:**
  ```sql
  auth.role() = 'authenticated'
  ```
- Click **"Review"** then **"Save policy"**

**Repeat for all three buckets.**

### Option B: Using SQL (Advanced)

If you prefer SQL, go to **SQL Editor** in Supabase dashboard and run:

```sql
-- Policies for 'profiles' bucket
CREATE POLICY "Public Access profiles"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profiles' );

CREATE POLICY "Authenticated Upload profiles"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete profiles"
ON storage.objects FOR DELETE
USING ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );

-- Policies for 'issue-images' bucket
CREATE POLICY "Public Access issue-images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'issue-images' );

CREATE POLICY "Authenticated Upload issue-images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'issue-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete issue-images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'issue-images' AND auth.role() = 'authenticated' );

-- Policies for 'proofs' bucket
CREATE POLICY "Public Access proofs"
ON storage.objects FOR SELECT
USING ( bucket_id = 'proofs' );

CREATE POLICY "Authenticated Upload proofs"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'proofs' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete proofs"
ON storage.objects FOR DELETE
USING ( bucket_id = 'proofs' AND auth.role() = 'authenticated' );
```

---

## Step 5: Test Your Setup

1. **Start your server:**
   ```bash
   cd server
   npm install  # if you haven't already
   npm start
   ```

2. **Check for errors:**
   - Server should start without "Missing Supabase configuration" errors
   - Look for successful Supabase connection in logs

3. **Test file upload:**
   - Start your client: `cd client && npm run dev`
   - Log in to your application
   - Try uploading a profile picture
   - Go to Supabase Dashboard → Storage → profiles
   - You should see your uploaded file!

4. **Test other uploads:**
   - Create a new issue with an image
   - Submit a work proof (if applicable)
   - Check respective buckets in Supabase

---

## Step 6: (Optional) Configure CORS

If you encounter CORS errors:

1. **Go to Storage Settings**
   - Supabase Dashboard → Storage → Configuration
   
2. **Add CORS policy:**
   ```json
   {
     "allowedOrigins": ["http://localhost:5173", "http://localhost:3000", "https://yourdomain.com"],
     "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
     "allowedHeaders": ["*"],
     "maxAge": 3600
   }
   ```

---

## Verification Checklist

After completing all steps, verify:

- [ ] Supabase project created
- [ ] API credentials added to `server/.env`
- [ ] Three buckets created: profiles, issue-images, proofs
- [ ] All buckets set to public
- [ ] Policies configured for each bucket (read, upload, delete)
- [ ] Server starts without Supabase errors
- [ ] Can upload profile picture
- [ ] Can upload issue image
- [ ] Can upload proof image
- [ ] Images display correctly in the app
- [ ] Files appear in Supabase Storage dashboard

---

## Troubleshooting

### "Missing Supabase configuration"
**Solution:** Check `server/.env` has both `SUPABASE_URL` and `SUPABASE_KEY` set correctly.

### "Failed to upload to Supabase"
**Possible causes:**
- Bucket name mismatch (must be exactly: `profiles`, `issue-images`, `proofs`)
- Bucket not set to public
- Missing upload policy
- Invalid API key

**Solution:** 
1. Verify bucket names in Supabase dashboard
2. Check "Public bucket" is enabled
3. Verify policies exist (Storage → Policies)
4. Regenerate API key if needed

### Images not loading
**Possible causes:**
- Bucket not public
- Missing read policy
- CORS issues

**Solution:**
1. Enable "Public bucket" in bucket settings
2. Add public read policy (see Step 4)
3. Configure CORS if needed (see Step 6)

### "File too large"
**Solution:** Check file size limits:
- Profiles: 5MB max
- Issue images: 10MB max
- Proofs: 10MB max

### Authentication errors
**Solution:** Make sure you're passing the JWT token in requests. The backend `authenticateToken` middleware should be working correctly.

---

## Database Migration (Optional)

If you have existing files in the local `uploads/` folder and want to migrate them:

### 1. Upload Existing Files to Supabase

Manually upload files from your `uploads/` folder to the corresponding Supabase buckets using the dashboard or write a migration script.

### 2. Update Database URLs

Run these SQL queries in your Oracle database to convert old paths to Supabase URLs:

```sql
-- Update issues table
UPDATE issues 
SET image_url = 'https://your-supabase-url/storage/v1/object/public/issue-images/' || 
                REGEXP_REPLACE(image_url, '^/uploads/issue_img/', '')
WHERE image_url LIKE '/uploads/issue_img/%';

-- Update users table  
UPDATE users 
SET img_url = 'https://your-supabase-url/storage/v1/object/public/profiles/' || 
              REGEXP_REPLACE(img_url, '^/uploads/profiles/', '')
WHERE img_url LIKE '/uploads/profiles/%';

-- Update issue_proofs table
UPDATE issue_proofs 
SET proof_photo = 'https://your-supabase-url/storage/v1/object/public/proofs/' || 
                  REGEXP_REPLACE(proof_photo, '^/uploads/proofs/', '')
WHERE proof_photo LIKE '/uploads/proofs/%';
```

**⚠️ Warning:** Backup your database before running these queries!

---

## Code Changes Summary

### Backend Files Modified:
- ✅ `server/config/supabase.js` (NEW) - Supabase client configuration
- ✅ `server/services/uploadService.js` - Upload to Supabase instead of disk
- ✅ `server/controllers/fileController.js` - Async operations with Supabase API
- ✅ `server/controllers/authController.js` - Profile uploads to Supabase
- ✅ `server/controllers/jobProofController.js` - Proof uploads to Supabase

### Frontend Files Modified:
- ✅ `client/src/utils/imageUtils.js` (NEW) - Helper functions for image URLs
- ✅ `client/src/pages/common/profile.jsx` - Handle Supabase URLs

### Configuration:
- ✅ `.env.example` - Updated with Supabase variables

---

## Benefits

✅ **Scalability** - No server disk space concerns
✅ **Performance** - CDN-backed global delivery
✅ **Reliability** - Built-in redundancy and backups
✅ **Security** - Fine-grained access control
✅ **Cost-effective** - Free tier: 1GB storage + 2GB bandwidth/month

---

## Support & Resources

- **Supabase Documentation:** [https://supabase.com/docs/guides/storage]
- **Storage Policies:** [https://supabase.com/docs/guides/storage/security/access-control]
- **JavaScript Client:** [https://supabase.com/docs/reference/javascript/storage]
- **Supabase Community:** [https://github.com/supabase/supabase/discussions]

---

## Next Steps

1. Complete the setup steps above
2. Test all file upload features
3. Monitor storage usage in Supabase dashboard
4. Consider migrating existing files (optional)
5. Update production environment variables when deploying

**You're all set! Your application now uses Supabase Cloud Storage.** 🎉
