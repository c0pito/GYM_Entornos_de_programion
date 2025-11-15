import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import '../styles/public-pages.css';

const normalizeSlots = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.map((slot) => {
      if (typeof slot === 'string') {
        return { id: slot, label: slot, start: slot };
      }
      return {
        id: slot.id || `${slot.start_time || slot.start}-${slot.end_time || slot.end}`,
        label: slot.label || `${slot.start_time || slot.start} - ${slot.end_time || slot.end}`,
        start: slot.start_time || slot.start,
        end: slot.end_time || slot.end,
        available: slot.available !== false
      };
    });
  }

  if (Array.isArray(payload.slots)) {
    return normalizeSlots(payload.slots);
  }
  return [];
};

export default function ReservationsPage() {
  const { user } = useAuth();
  const { request } = useApi();

  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    request('/machines/', { secure: false })
      .then((data) => setMachines(Array.isArray(data) ? data : []))
      .catch(() => setMachines([]));
  }, [request]);

  useEffect(() => {
    if (!user) return;
    request('/reservations/mine')
      .then((data) => setReservations(Array.isArray(data) ? data : []))
      .catch(() => setReservations([]));
  }, [request, user]);

  useEffect(() => {
    if (!selectedMachine || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    setLoadingSlots(true);
    const params = new URLSearchParams({ machine_id: selectedMachine, date: selectedDate });
    request(`/reservations/slots?${params.toString()}`, { secure: !!user })
      .then((data) => setAvailableSlots(normalizeSlots(data)))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [request, selectedDate, selectedMachine, user]);

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return reservations
      .filter((reservation) => new Date(reservation.start_time || reservation.start) > now)
      .sort((a, b) => new Date(a.start_time || a.start) - new Date(b.start_time || b.start));
  }, [reservations]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setMessage('Debes iniciar sesión para crear una reserva.');
      setMessageType('error');
      return;
    }
    if (!selectedMachine || !selectedSlot) {
      setMessage('Selecciona una máquina y un horario disponible.');
      setMessageType('error');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      await request('/reservations/', {
        method: 'POST',
        body: {
          machine_id: selectedMachine,
          date: selectedDate,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end || selectedSlot.start
        }
      });
      setMessage('Reserva creada correctamente.');
      setMessageType('success');
      setSelectedSlot(null);
      const params = new URLSearchParams({ machine_id: selectedMachine, date: selectedDate });
      request(`/reservations/slots?${params.toString()}`, { secure: !!user })
        .then((data) => setAvailableSlots(normalizeSlots(data)))
        .catch(() => {});
      if (user) {
        request('/reservations/mine')
          .then((data) => setReservations(Array.isArray(data) ? data : []))
          .catch(() => {});
      }
    } catch (error) {
      setMessage(error.message || 'No se pudo crear la reserva');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-page">
      <header className="public-hero">
        <div>
          <p className="eyebrow">Agenda inteligente</p>
          <h1>Reserva máquinas y clases en minutos</h1>
          <p>
            Consulta disponibilidad en tiempo real, elige la máquina y confirma tu horario. Recibirás recordatorios en tu panel de
            cliente.
          </p>
          {!user && (
            <p className="muted">
              Necesitas una cuenta para confirmar la reserva. <Link to="/register">Regístrate aquí</Link>
            </p>
          )}
        </div>
        <div className="public-card">
          <h2>Crear una reserva</h2>
          <form className="public-form" onSubmit={handleSubmit}>
            <label>
              Máquina
              <select value={selectedMachine} onChange={(event) => setSelectedMachine(event.target.value)} required>
                <option value="">Selecciona una máquina</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.nombre || machine.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Fecha
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} required />
            </label>
            <label>
              Horario disponible
              <div className="slot-grid">
                {loadingSlots ? (
                  <p className="muted">Buscando horarios...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="muted">Selecciona otra fecha o máquina.</p>
                ) : (
                  availableSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot.id}
                      className={`slot-button ${selectedSlot?.id === slot.id ? 'active' : ''}`}
                      disabled={slot.available === false}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.label}
                    </button>
                  ))
                )}
              </div>
            </label>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </form>
          {message && <div className={`public-message ${messageType}`}>{message}</div>}
        </div>
      </header>

      <section className="public-section">
        <div className="section-header">
          <h2>Próximas reservas</h2>
        </div>
        {upcomingReservations.length === 0 ? (
          <p className="muted">Aún no tienes reservas confirmadas.</p>
        ) : (
          <div className="public-timeline">
            {upcomingReservations.map((reservation) => (
              <article key={reservation.id} className="timeline-card">
                <p className="eyebrow">{reservation.machine?.nombre || reservation.machine_name}</p>
                <h3>{new Date(reservation.start_time || reservation.start).toLocaleDateString()}</h3>
                <p>
                  {new Date(reservation.start_time || reservation.start).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {' '}-{' '}
                  {new Date(reservation.end_time || reservation.end || reservation.start).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <span className="badge badge-info">{reservation.status || 'Confirmada'}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
