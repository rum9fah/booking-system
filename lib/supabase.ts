import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qipstxjmyoxolbsjmlbb.supabase.co'; // Check this!
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcHN0eGpteW94b2xic2ptbGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTU4NjYsImV4cCI6MjA5MDYzMTg2Nn0.yGziFy9v_kGgwI3e4ofCDeXLOaEP4-mHT1UGAeHH0Z8';           // Check this!

export const supabase = createClient(supabaseUrl, supabaseAnonKey);