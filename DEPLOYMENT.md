# LocalFix Deployment Guide

## Architecture

```text
Vercel (React frontend) → Render (Express API) → Neon Postgres
                                             → Neon Object Storage
                                             → Resend Email API
```

The API connects to Neon using `DATABASE_URL` and Neon Object Storage using the
`AWS_*` variables. Keep these secrets in the Render environment settings; do not
commit them to the repository.

## Neon setup

The root `neon.ts` declares the `profiles`, `issue-images`, and `proofs` buckets.
They are public-read buckets to preserve the app's existing image URL behavior.
From the repository root, install and authenticate the Neon CLI, link this
directory to the existing Neon project and branch, then provision the config:

```bash
npm install -g neon@latest
neon auth
neon link
neon deploy
neon env pull --file server/.env
```

The project must be in a region that supports Neon Object Storage. The CLI writes
branch-specific database and storage settings to the environment file. For a
hosted deployment, copy the required values into Render's environment settings:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=verify-full
AWS_ACCESS_KEY_ID=your-neon-storage-access-key
AWS_SECRET_ACCESS_KEY=your-neon-storage-secret-key
AWS_ENDPOINT_URL_S3=https://your-branch-storage-endpoint
AWS_REGION=your-neon-region
JWT_SECRET=your-long-random-secret
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend.example.com
MAPBOX_TOKEN=your-mapbox-token
RESEND_API_KEY=your-resend-api-key
Email_from=your-verified-sender@example.com
```

Use the pooled `DATABASE_URL` for normal application traffic. Keep the Neon
storage credentials scoped to the branch used by this deployment.

### Copy existing files from Supabase

If the database still contains Supabase image URLs, keep `SUPABASE_URL` and
`SUPABASE_KEY` available temporarily in `server/.env`. The key needs permission
to list and download the old objects. After provisioning Neon buckets and pulling
the Neon environment, run this once from the server directory:

```bash
cd server
node scripts/migrateSupabaseStorageToNeon.js
```

The script copies files from the `profiles`, `issue-images`, and `proofs`
Supabase buckets, then updates matching URLs in Postgres. It does not delete the
Supabase originals. Verify images and uploads before removing the Supabase
credentials. If the Supabase project hostname no longer resolves, restore the
correct project URL or a source backup before running the copy.

## Backend API (Render)

1. Create a Render Web Service and connect the repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Add the environment variables listed above in Render. Include `DATABASE_URL`,
   all four `AWS_*` values, `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL`, and any
   integrations the app uses.
5. Deploy and check the service logs for successful database initialization.

Do not configure `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, or `DB_NAME`;
the backend now reads the single `DATABASE_URL` connection string.

## Frontend (Vercel)

1. Import the repository in Vercel.
2. Set **Root Directory** to `client`.
3. Use the Vite framework preset, `npm run build`, and `dist` as the output
   directory.
4. Set `VITE_SERVER_URL` to the deployed Render API URL.

## Email (Resend)

Set `RESEND_API_KEY` and `Email_from` in the Render backend environment. Verify
the sender address with Resend. The backend sends through the Resend API, so no
separate SMTP server, VM, or frontend email credentials are needed.

## Local development

```bash
cd server
npm install
cp .env.example .env
# Fill in Neon database, Object Storage, and app credentials.
npm start
```

Run the frontend separately from `client` with `npm install && npm run dev`.

## Deployment checks

- Backend root endpoint responds successfully.
- Login and signup work against the Neon database.
- Profile, issue, and proof image uploads appear in the matching Neon buckets.
- Existing migrated images load from Neon URLs.
- Vercel can call the Render API with the configured CORS origin.
- Map and email integrations work if enabled.

## Troubleshooting

**`DATABASE_URL is required`:** Set the Neon connection string in the server
environment and restart the backend.

**Neon Object Storage is not configured:** Provision the buckets with `neon
deploy`, then pull or copy `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_ENDPOINT_URL_S3`, and `AWS_REGION` into the backend environment.

**Storage returns an access or missing-bucket error:** Confirm the deployment
uses credentials and endpoint from the same Neon branch where the buckets were
provisioned. Check that `neon.ts` has been applied to that branch.

**Supabase hostname returns `ENOTFOUND`:** The old Supabase project hostname is
not resolving. New app uploads use Neon; the one-time copy script still needs a
working Supabase source URL to transfer existing objects.

**CORS errors:** Ensure `CLIENT_URL` contains the exact frontend origin, with no
path suffix.
