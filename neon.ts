import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  buckets: {
    profiles: { access: "public_read" },
    "issue-images": { access: "public_read" },
    proofs: { access: "public_read" },
  },
});
