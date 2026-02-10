
// Supabase Configuration
// Project ID extracted from your screenshot: hvkexhuqlwahcteujpqm
const SUPABASE_URL = 'https://hvkexhuqlwahcteujpqm.supabase.co';
window.SUPABASE_URL = SUPABASE_URL;

// Anon Key (Pasted from history)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2a2V4aHVxbHdhaGN0ZXVqcHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDM4MzEsImV4cCI6MjA4NjExOTgzMX0.GGQd8N-GS7swf078lCVaLzLmDfFlS_ZxyES4PdYuKGI';
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

// Make sure we wait for the supabase global if it's not ready yet
window.sb = null;

// The CDN usually exposes 'supabase' as a global variable with a 'createClient' method
// But sometimes it's window.supabase.createClient

function initSupabase() {
    let client = null;

    if (typeof supabase !== 'undefined' && supabase.createClient) {
        client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (window.supabase && window.supabase.createClient) {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    if (client) {
        window.sb = client;
        console.log("Supabase Initialized Successfully");
        return true;
    } else {
        console.log("Supabase SDK not found yet...");
        return false;
    }
}

// Try immediately
if (!initSupabase()) {
    // Retry a few times if script loading is slow
    let retries = 0;
    const retryInt = setInterval(() => {
        if (initSupabase() || retries > 20) {
            clearInterval(retryInt);
            if (!window.sb) console.error("Failed to initialize Supabase after multiple attempts.");
        }
        retries++;
    }, 200);
}
