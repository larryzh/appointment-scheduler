import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function AddAppointment({ user }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!date || !startTime || !endTime) {
      setError('Please fill in all fields.');
      return;
    }

    if (endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }

    try {
      console.log('Attempting to insert appointment...');
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          { 
            host_email: user.email,
            date: date,
            start_time: startTime,
            end_time: endTime,
            is_available: true
          }
        ])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'An error occurred while adding the appointment.');
      }

      console.log('Supabase response:', data);

      if (!data || data.length === 0) {
        throw new Error('No data returned from Supabase after insertion.');
      }

      console.log('Appointment added successfully:', data[0]);
      setSuccess(true);
      setDate('');
      setStartTime('');
      setEndTime('');
    } catch (error) {
      console.error('Error adding appointment:', error);
      setError(`Failed to add appointment: ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Add Available Appointment</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>Appointment added successfully!</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="startTime">Start Time:</label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="endTime">End Time:</label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            padding: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer' 
          }}
        >
          Add Appointment
        </button>
      </form>
    </div>
  );
}

export default AddAppointment;