import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

function HostDashboard({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('host_email', user.email);

      if (error) {
        throw error;
      }

      setAppointments(data);
    } catch (error) {
      setError('Error fetching appointments: ' + error.message);
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const rejectAppointment = async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ visitor_email: null, is_available: true })
        .eq('id', appointmentId);

      if (error) {
        throw error;
      }

      // Refresh the appointments list
      fetchAppointments();
    } catch (error) {
      setError('Error rejecting appointment: ' + error.message);
      console.error('Error rejecting appointment:', error);
    }
  };

  const getAppointmentStatus = (appointment) => {
    if (appointment.visitor_email) {
      return 'Booked';
    } else if (appointment.is_available) {
      return 'Available';
    } else {
      return 'Unavailable';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(appointments);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAppointments(items);
  };

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2>Host Dashboard</h2>
      <p>Welcome, {user.email}!</p>
      
      <h3>Your Appointments:</h3>
      {appointments.length === 0 ? (
        <p>You have no appointments scheduled.</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="appointments">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef} style={{ listStyleType: 'none', padding: 0 }}>
                {appointments.map((appointment, index) => (
                  <Draggable key={appointment.id} draggableId={appointment.id} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          marginBottom: '10px',
                          border: '1px solid #ccc',
                          padding: '10px',
                          backgroundColor: 'white'
                        }}
                      >
                        <div>Date: {formatDate(appointment.date)}</div>
                        <div>Start Time: {appointment.start_time}</div>
                        <div>End Time: {appointment.end_time}</div>
                        <div>Status: {getAppointmentStatus(appointment)}</div>
                        {appointment.visitor_email && (
                          <>
                            <div>Visitor: {appointment.visitor_email}</div>
                            <button 
                              onClick={() => rejectAppointment(appointment.id)}
                              style={{ 
                                marginTop: '5px',
                                padding: '5px 10px',
                                backgroundColor: '#dc3545',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

export default HostDashboard;