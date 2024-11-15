import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xtugkgdrgaqlkzgsqosa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWdrZ2RyZ2FxbGt6Z3Nxb3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMDMwODksImV4cCI6MjAzOTU3OTA4OX0.QNGgiwypeU8suVi0-5poH0Zm26SDsDScp6VlBz_Zjxk';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test database connection and auth setup
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test auth configuration
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Auth configuration error:', authError);
    } else {
      console.log('Auth configuration successful');
    }

    // Test database access
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (dbError) {
      console.error('Database connection error:', dbError);
    } else {
      console.log('Database connection successful');
    }

  } catch (error) {
    console.error('Connection test error:', error);
  }
};

// Run connection test
testConnection();
