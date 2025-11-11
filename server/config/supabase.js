// server/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for server-side operations

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env file.');
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Bucket names
const BUCKETS = {
    PROFILES: 'profiles',
    ISSUES: 'issue-images',
    PROOFS: 'proofs'
};

/**
 * Initialize Supabase Storage buckets
 * Run this once to set up your buckets
 */
const initializeBuckets = async () => {
    try {
        // Create public bucket for profiles
        await supabase.storage.createBucket(BUCKETS.PROFILES, {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        });
        console.log('✅ Profiles bucket created (public)');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Profiles bucket already exists');
        } else {
            console.error('❌ Error creating profiles bucket:', error.message);
        }
    }

    try {
        // Create public bucket for issue images
        await supabase.storage.createBucket(BUCKETS.ISSUES, {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        });
        console.log('✅ Issue images bucket created (public)');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Issue images bucket already exists');
        } else {
            console.error('❌ Error creating issue images bucket:', error.message);
        }
    }

    try {
        // Create private bucket for proofs (admin access only)
        await supabase.storage.createBucket(BUCKETS.PROOFS, {
            public: false, // PRIVATE bucket
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        });
        console.log('✅ Proofs bucket created (private - admin access only)');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Proofs bucket already exists');
        } else {
            console.error('❌ Error creating proofs bucket:', error.message);
        }
    }
};

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - Bucket name (e.g., 'profiles', 'issue-images', 'proofs')
 * @param {string} filePath - Full URL or just the file path in the bucket
 * @returns {Promise<void>}
 */
const deleteFromSupabase = async (bucket, filePath) => {
    try {
        if (!filePath) return;

        // Extract filename from URL if it's a full URL
        let filename = filePath;
        if (filePath.includes('supabase.co')) {
            const urlParts = filePath.split('/');
            filename = urlParts[urlParts.length - 1];
        } else if (filePath.includes('/')) {
            // If it's a path like 'profiles/filename.jpg', extract just the filename
            const pathParts = filePath.split('/');
            filename = pathParts[pathParts.length - 1];
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .remove([filename]);

        if (error) {
            console.error(`Error deleting file from ${bucket}:`, error.message);
            throw error;
        }

        console.log(`✅ Deleted file from ${bucket}: ${filename}`);
        return data;
    } catch (error) {
        console.error('Delete from Supabase error:', error);
        throw error;
    }
};

module.exports = {
    supabase,
    BUCKETS,
    initializeBuckets,
    deleteFromSupabase
};
