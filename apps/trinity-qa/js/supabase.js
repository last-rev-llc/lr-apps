/**
 * Supabase Client for Trinity QA
 * Uses official @supabase/supabase-js library
 */

const SUPABASE_URL = 'https://fzmhqcgzvgtvkswpwruc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bWhxY2d6dmd0dmtzd3B3cnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODQ4MDQsImV4cCI6MjA4NzQ2MDgwNH0.leVkFFz7nk2Sd30Q-fMKYwaRAVJAe0l28B1QMJnWv6M';

window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
