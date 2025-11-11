// server/scripts/initSupabase.js
require('dotenv').config(); // Load environment variables first
const { initializeBuckets } = require('../config/supabase');

/**
 * Initialize Supabase Storage Buckets
 * Run this script once after setting up Supabase credentials
 */
async function init() {
    console.log('🚀 Initializing Supabase Storage Buckets...\n');
    
    try {
        await initializeBuckets();
        console.log('\n✅ Supabase initialization complete!');
        console.log('\n📋 Bucket Summary:');
        console.log('   • profiles: Public bucket for user profile pictures (5MB limit)');
        console.log('   • issue-images: Public bucket for issue photos (10MB limit)');
        console.log('   • proofs: Private bucket for work completion proofs (10MB limit, admin access only)');
        console.log('\n💡 Next Steps:');
        console.log('   1. Make sure your .env file has SUPABASE_URL and SUPABASE_SERVICE_KEY');
        console.log('   2. Configure Row Level Security (RLS) policies in Supabase dashboard if needed');
        console.log('   3. Start your server: npm start');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during initialization:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   • Check that SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env');
        console.error('   • Verify your Supabase credentials are correct');
        console.error('   • Ensure your Supabase project is active');
        process.exit(1);
    }
}

init();
