import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const VisitorDashboard = () => {
  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchAvailableAppointments();
  }, []);

  const fetchAvailableAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .is('visitor_id', null)
        .order('date', { ascending: true });
      if (error) throw error;
      setAvailableAppointments(data);
    } catch (error) {
      console.error('Error fetching available appointments:', error.message);
    }
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleNoteChange = (e) => {
    setNote(e.target.value);
  };

  const handleBooking = async () => {
    if (selectedAppointment) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .update({ visitor_id: supabase.auth.user().id, note })
          .eq('id', selectedAppointment.id);
        if (error) throw error;
        setAvailableAppointments(availableAppointments.filter(apt => apt.id !== selectedAppointment.id));
        setSelectedAppointment(null);
        setNote('');
        alert('Appointment booked successfully!');
      } catch (error) {
        console.error('Error booking appointment:', error.message);
        alert('Failed to book appointment. Please try again.');
      }
    }
  };

  return (
    <div>
      <h2>Visitor Dashboard</h2>
      <h3>Available Appointments</h3>
      <ul>
        {availableAppointments.map((apt) => (
          <li key={apt.id} onClick={() => handleAppointmentSelect(apt)}>
            {apt.date} {apt.time} - ${apt.price}
            {selectedAppointment && selectedAppointment.id === apt.id && ' (Selected)'}
          </li>
        ))}
      </ul>
      {selectedAppointment && (
        <div>
          <h3>Book Appointment</h3>
          <p>Selected: {selectedAppointment.date} {selectedAppointment.time} - ${selectedAppointment.price}</p>
          <textarea
            placeholder="Add a note (optional)"
            value={note}
            onChange={handleNoteChange}
          />
          <button onClick={handleBooking}>Book Appointment</button>
        </div>
      )}
    </div>
  );
};

export default VisitorDashboard;