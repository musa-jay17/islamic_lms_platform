import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbwpcwqezdyjeysjvrdl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZid3Bjd3FlemR5amV5c2p2cmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMDE2MTQsImV4cCI6MjA3ODc3NzYxNH0.KJGK5frzh9BB8VFsSIGDPrF2dWD184FNVy4VvhbCKY0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the supabase client like this:
// For React:
// import { supabase } from "@/integrations/supabase/client";
// For React Native:
// import { supabase } from "@/src/integrations/supabase/client";
