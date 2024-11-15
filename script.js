// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
const supabaseKey = 'YOUR_SUPABASE_PUBLIC_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM Elements
const dateInput = document.getElementById('date-input');
const timeInput = document.getElementById('time-input');
const addSlotBtn = document.getElementById('add-slot');
const availableSlotsList = document.getElementById('available-slots');
const reservationSlotsList = document.getElementById('reservation-slots');
const hostSection = document.getElementById('host-section');
const visitorSection = document.getElementById('visitor-section');
const userInfo = document.getElementById('user-info');
const logoutButton = document.getElementById('logout-button');

// Check user session
async function checkSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
    } else {
        displayUserInfo(user);
        const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', user.id)
            .single();
        
        if (profile.user_type === 'host') {
            hostSection.style.display = 'block';
        } else {
            visitorSection.style.display = 'block';
        }
        fetchSlots();
    }
}

// Display user info and logout button
function displayUserInfo(user) {
    userInfo.textContent = `Logged in as: ${user.email}`;
    logoutButton.innerHTML = '<button onclick="logout()">Logout</button>';
}

// Add a new time slot
addSlotBtn.addEventListener('click', async () => {
    const date = dateInput.value;
    const time = timeInput.value;
    if (date && time) {
        const { data, error } = await supabase
            .from('slots')
            .insert([{ date, time }]);
        
        if (error) {
            alert('Error adding slot: ' + error.message);
        } else {
            fetchSlots();
        }
    } else {
        alert('Please select both date and time.');
    }
});

// Fetch available slots
async function fetchSlots() {
    const { data: slots, error } = await supabase
        .from('slots')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
    
    if (error) {
        alert('Error fetching slots: ' + error.message);
    } else {
        updateSlotsList(slots);
    }
}

// Update slots list
function updateSlotsList(slots) {
    availableSlotsList.innerHTML = '';
    reservationSlotsList.innerHTML = '';
    slots.forEach(slot => {
        const li = document.createElement('li');
        li.textContent = `${slot.date} ${slot.time}`;
        
        if (hostSection.style.display === 'block') {
            availableSlotsList.appendChild(li);
        } else {
            const reserveBtn = document.createElement('button');
            reserveBtn.textContent = 'Reserve';
            reserveBtn.onclick = () => reserveSlot(slot.id);
            li.appendChild(reserveBtn);
            reservationSlotsList.appendChild(li);
        }
    });
}

// Reserve a slot
async function reserveSlot(slotId) {
    const { data, error } = await supabase
        .from('slots')
        .delete()
        .eq('id', slotId);
    
    if (error) {
        alert('Error reserving slot: ' + error.message);
    } else {
        fetchSlots();
        alert('Slot reserved successfully!');
    }
}

// Logout function
async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        alert('Error logging out: ' + error.message);
    } else {
        window.location.href = 'login.html';
    }
}

// Initialize
checkSession();