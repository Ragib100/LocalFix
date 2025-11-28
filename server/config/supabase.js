// server/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase Storage Configuration
 * Manages connection to Supabase storage buckets
 */

// Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_KEY in .env file');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // We're using this for storage only
    },
});

/**
 * Bucket names configuration
 * Maps logical folder names to Supabase bucket names
 */
const BUCKET_NAMES = {
    profiles: 'profiles',      // Profile pictures bucket
    issue_img: 'issue-images', // Issue images bucket
    proofs: 'proofs',          // Proof images bucket
};

/**
 * Get bucket name for a folder
 * @param {string} folderName - Logical folder name (profiles, issue_img, proofs)
 * @returns {string} Supabase bucket name
 */
function getBucketName(folderName) {
    return BUCKET_NAMES[folderName] || folderName;
}

module.exports = {
    supabase,
    BUCKET_NAMES,
    getBucketName,
};
