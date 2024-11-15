import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const HostDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState({ date: '', time: '', price: '' });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAppointment({ ...newAppointment, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...newAppointment, host_id: supabase.auth.user().id }]);
      if (error) throw error;
      setAppointments([...appointments, data[0]]);
      setNewAppointment({ date: '', time: '', price: '' });
    } catch (error) {
      console.error('Error creating appointment:', error.message);
    }
  };

  return (
    <div>
      <h2>Host Dashboard</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="date"
          name="date"
          value={newAppointment.date}
          onChange={handleInputChange}
          required
        />
        <input
          type="time"
          name="time"
          value={newAppointment.time}
          onChange={handleInputChange}
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={newAppointment.price}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Add Appointment</button>
      </form>
      <h3>Available Appointments</h3>
      <ul>
        {appointments.map((apt) => (
          <li key={apt.id}>
            {apt.date} {apt.time} - ${apt.price}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HostDashboard;