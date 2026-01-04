import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Remplacez ces valeurs par vos vraies credentials Supabase
// Ces valeurs seront incluses dans le build de production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pshatvsqirupsxpuoudh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzaGF0dnNxaXJ1cHN4cHVvdWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjU5ODUsImV4cCI6MjA4MzEwMTk4NX0.OPXVQ8zuCx0uyVKqG3RKaafLv561MRk6xx9DeCGnh68'



export const supabase = createClient(supabaseUrl, supabaseAnonKey)
