document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase client
    const supabaseUrl = 'https://xtugkgdrgaqlkzgsqosa.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWdrZ2RyZ2FxbGt6Z3Nxb3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMDMwODksImV4cCI6MjAzOTU3OTA4OX0.QNGgiwypeU8suVi0-5poH0Zm26SDsDScp6VlBz_Zjxk';

    // Create Supabase client using the global supabase object
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // Get form elements
    const form = document.getElementById('signup-form');
    const errorDisplay = document.getElementById('error-display');
    const loadingDisplay = document.getElementById('loading');

    // Function to show error
    const showError = (message) => {
        console.error('Error:', message);
        errorDisplay.style.display = 'block';
        errorDisplay.textContent = message;
        loadingDisplay.style.display = 'none';
    };

    // Function to show loading
    const showLoading = () => {
        loadingDisplay.style.display = 'block';
        errorDisplay.style.display = 'none';
    };

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const userType = document.getElementById('user-type').value;

        console.log('Starting signup process...', { email, userType });

        try {
            // Verify form data
            if (!email || !password || !userType) {
                throw new Error('Please fill in all fields');
            }

            console.log('Attempting to sign up user...');

            // Sign up user
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        user_type: userType
                    }
                }
            });

            console.log('Signup response:', data);

            if (error) {
                throw error;
            }

            if (!data.user) {
                throw new Error('No user data returned');
            }

            console.log('Creating profile for user:', data.user.id);

            // Insert into profiles table
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email: email,
                    user_type: userType,
                    created_at: new Date().toISOString()
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                throw profileError;
            }

            console.log('Profile created successfully');

            // Success
            alert('Signup successful! Please check your email to verify your account.');
            window.location.href = 'login.html';

        } catch (error) {
            console.error('Signup error:', error);
            showError(error.message || 'An error occurred during signup');
        }
    });
});
