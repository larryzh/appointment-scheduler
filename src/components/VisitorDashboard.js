import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function VisitorDashboard({ user }) {
  const [myAppointments, setMyAppointments] = useState([]);
  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Fetch user's appointments
      const { data: userAppointments, error: userError } = await supabase
        .from('appointments')
        .select('*')
        .eq('visitor_email', user.email);

      if (userError) throw userError;
      setMyAppointments(userAppointments);

      // Fetch all available appointments
      const { data: availableAppts, error: availableError } = await supabase
        .from('appointments')
        .select('*')
        .eq('is_available', true)
        .is('visitor_email', null);

      if (availableError) throw availableError;
      setAvailableAppointments(availableAppts);

    } catch (error) {
      setError('Error fetching appointments: ' + error.message);
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ visitor_email: user.email, is_available: false })
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh the appointments
      await fetchAppointments();
    } catch (error) {
      setError('Error booking appointment: ' + error.message);
      console.error('Error booking appointment:', error);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Visitor Dashboard</h2>
      <p>Welcome, {user.email}!</p>
      
      <h3>Your Appointments:</h3>
      {myAppointments.length === 0 ? (
        <p>You have no booked appointments.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {myAppointments.map((appointment) => (
            <li key={appointment.id} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
              <div>Host: {appointment.host_email}</div>
              <div>Date: {formatDate(appointment.date)}</div>
              <div>Start Time: {appointment.start_time}</div>
              <div>End Time: {appointment.end_time}</div>
            </li>
          ))}
        </ul>
      )}

      <h3>Available Appointments:</h3>
      {availableAppointments.length === 0 ? (
        <p>There are no available appointments at the moment.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {availableAppointments.map((appointment) => (
            <li key={appointment.id} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '10px' }}>
              <div>Host: {appointment.host_email}</div>
              <div>Date: {formatDate(appointment.date)}</div>
              <div>Start Time: {appointment.start_time}</div>
              <div>End Time: {appointment.end_time}</div>
              <button 
                onClick={() => bookAppointment(appointment.id)}
                style={{ 
                  marginTop: '5px',
                  padding: '5px 10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Book
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default VisitorDashboard;