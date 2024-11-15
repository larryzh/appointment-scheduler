// Initialize Supabase client
const supabaseUrl = 'https://xyzcompany.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdmtjeXd6andidWZmemNjdmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTA2NDY2MjcsImV4cCI6MjAwNjIyMjYyN30.S6-pXnLf_OS7EFH05ugSh_H3_R8ozBYZ4UXLVvqZh6o';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const changePasswordForm = document.getElementById('change-password-form');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const messageDiv = document.getElementById('message');

// Password validation function
function isPasswordValid(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonAlphas = /\W/.test(password);
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasNonAlphas;
}

// Display message function
function displayMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = isError ? 'error' : 'success';
}

// Change password form submit event
changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate current password
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });

    if (signInError) {
        displayMessage('Current password is incorrect.', true);
        return;
    }

    if (newPassword !== confirmPassword) {
        displayMessage('New passwords do not match.', true);
        return;
    }

    if (!isPasswordValid(newPassword)) {
        displayMessage('New password must be at least 8 characters long and contain uppercase, lowercase, number, and special characters.', true);
        return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
        displayMessage('Error changing password: ' + error.message, true);
    } else {
        displayMessage('Password changed successfully!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
});