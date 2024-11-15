import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xtugkgdrgaqlkzgsqosa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWdrZ2RyZ2FxbGt6Z3Nxb3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMDMwODksImV4cCI6MjAzOTU3OTA4OX0.QNGgiwypeU8suVi0-5poH0Zm26SDsDScp6VlBz_Zjxk';

export const supabase = createClient(supabaseUrl, supabaseKey);