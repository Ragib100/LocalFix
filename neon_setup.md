# Neon Object Storage Setup and Supabase Migration

Supabase Storage is no longer the active upload provider. The backend now uploads to
[Neon Object Storage](https://neon.com/docs/storage/get-started), which uses an
S3-compatible API and branches with the Neon database.

## Active storage configuration

The root [`neon.ts`](./neon.ts) declares these buckets on the linked Neon branch:

| Bucket | Used for | Access |
| --- | --- | --- |
| `profiles` | Profile pictures | Public read |
| `issue-images` | Issue photos | Public read |
| `proofs` | Work completion photos | Public read |

Public-read matches the previous behavior: image URLs are directly readable by
the browser. Upload and delete requests still go through the authenticated API.

From the repository root, install and sign into the Neon CLI, link the existing
project and branch, then apply the bucket configuration and pull its environment:

```bash
npm install -g neon@latest
neon auth
neon link
neon deploy
neon env pull --file server/.env
```

The server requires these Neon variables:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=verify-full
AWS_ACCESS_KEY_ID=your-neon-storage-access-key
AWS_SECRET_ACCESS_KEY=your-neon-storage-secret-key
AWS_ENDPOINT_URL_S3=https://your-branch-storage-endpoint
AWS_REGION=your-neon-region
```

See [`server/.env.example`](./server/.env.example) for the complete application
environment template. Do not commit actual connection strings or credentials.

## Copy existing Supabase files

If your Postgres rows still contain Supabase public URLs, copy the old objects
before removing Supabase credentials. Keep these source variables temporarily
in `server/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-key-with-storage-read-access
```

The Supabase key needs permission to list and download objects from the old
`profiles`, `issue-images`, and `proofs` buckets. Once Neon buckets and `AWS_*`
variables are configured, run:

```bash
cd server
node scripts/migrateSupabaseStorageToNeon.js
```

The script copies the objects without deleting the Supabase originals. After a
successful copy it updates matching image URLs in the `users`, `issues`, and
`issue_proofs` tables to point at Neon. It can be rerun if a transfer fails;
objects are copied under the same keys. Verify the app's profile, issue, and
proof images before removing the source credentials.

If Supabase reports `ENOTFOUND`, check that `SUPABASE_URL` contains the correct
project reference and that the project is still reachable. The transfer cannot
download files from an unresolved hostname; use a working source URL or restore
the files from a backup first.

## Troubleshooting Neon uploads

- **Missing `AWS_*` settings:** Run `neon env pull --file server/.env` after
  deploying the buckets, or add the branch's storage credentials to the hosting
  provider's environment settings.
- **Bucket not found:** Run `neon config status` and `neon deploy` from the
  linked project directory; ensure the app and bucket use the same branch.
- **Image URL does not load:** Confirm the bucket has `public_read` access and
  the API generated the URL from that branch's `AWS_ENDPOINT_URL_S3` value.
