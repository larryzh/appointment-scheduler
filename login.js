document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const supabaseUrl = 'https://xtugkgdrgaqlkzgsqosa.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWdrZ2RyZ2FxbGt6Z3Nxb3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMDMwODksImV4cCI6MjAzOTU3OTA4OX0.QNGgiwypeU8suVi0-5poH0Zm26SDsDScp6VlBz_Zjxk';

    // Create Supabase client
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const userTypeInput = document.getElementById('user-type');

    // Login form submit event
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const email = emailInput.value;
            const password = passwordInput.value;
            const userType = userTypeInput.value;

            if (!email || !password || !userType) {
                throw new Error('Please fill in all fields');
            }

            // Attempt to sign in
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Verify user type matches
            const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('user_type')
                .eq('id', data.user.id)
                .single();

            if (profileError) throw profileError;

            if (profile.user_type !== userType) {
                throw new Error('Invalid user type selected');
            }

            // Successful login
            alert('Login successful!');
            window.location.href = 'index.html';

        } catch (error) {
            alert('Error: ' + (error.message || 'An error occurred during login'));
        }
    });
});
