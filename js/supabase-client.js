/* ── Supabase Client ── */
const SUPABASE_URL  = 'https://csqenogssghecrtrzdvs.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzcWVub2dzc2doZWNydHJ6ZHZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNDQ5OTQsImV4cCI6MjA5MjYyMDk5NH0.EAxJZi26WL7Thh5vNPzHjEQygFvr_nsf2MBa9un8QhA';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
