import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import '../styles/dashboard.css';

export default function ClientDashboard() {
  const { user, logout, setUser } = useAuth();
  const { request } = useApi();

  const [perfil, setPerfil] = useState(null);
  const [membresias, setMembresias] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [reservasLoading, setReservasLoading] = useState(false);

  const [formPerfil, setFormPerfil] = useState({ nombre: '', apellido: '', telefono: '', password: '' });
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    request('/usuario/perfil')
      .then((data) => {
        setPerfil(data);
        setFormPerfil({ nombre: data.nombre, apellido: data.apellido, telefono: data.telefono || '', password: '' });
      })
      .catch(() => {});

    request('/clientemembresia/mis-membresias')
      .then(setMembresias)
      .catch(() => {});

    request('/gimnasio/mis-pagos')
      .then(setPagos)
      .catch(() => {});

    setReservasLoading(true);
    request('/reservations/mine')
      .then((data) => setReservas(Array.isArray(data) ? data : []))
      .catch(() => setReservas([]))
      .finally(() => setReservasLoading(false));
  }, [request]);

  const handleUpdatePerfil = async (event) => {
    event.preventDefault();
    const payload = { ...formPerfil };
    if (!payload.password) {
      delete payload.password;
    }
    try {
      const data = await request('/usuario/perfil', { method: 'PUT', body: payload });
      setPerfil(data);
      setFormPerfil({ nombre: data.nombre, apellido: data.apellido, telefono: data.telefono || '', password: '' });
      setUser(data);
      setMessage('Perfil actualizado correctamente.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    }
  };

  const activeMembership = useMemo(
    () => membresias.find((m) => m.estado === 'Activa'),
    [membresias]
  );

  const totalActivas = useMemo(
    () => membresias.filter((m) => m.estado === 'Activa').length,
    [membresias]
  );

  const diasRestantes = useMemo(() => {
    if (!activeMembership) return 0;
    if (typeof activeMembership.days_left === 'number') {
      return Math.max(0, activeMembership.days_left);
    }
    const today = new Date();
    const fechaFin = new Date(activeMembership.fechaFin);
    const diff = Math.ceil((fechaFin - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [activeMembership]);

  const totalPagos = pagos.length;
  const totalPagado = useMemo(() => pagos.reduce((acc, item) => acc + Number(item.monto || 0), 0), [pagos]);

  const proximaReserva = useMemo(() => {
    const now = new Date();
    const futuras = reservas
      .filter((reserva) => new Date(reserva.start_time || reserva.start) > now)
      .sort((a, b) => new Date(a.start_time || a.start) - new Date(b.start_time || b.start));
    return futuras[0] || null;
  }, [reservas]);

  const historialReservas = useMemo(() => {
    const now = new Date();
    return reservas
      .filter((reserva) => new Date(reserva.start_time || reserva.start) <= now)
      .sort((a, b) => new Date(b.start_time || b.start) - new Date(a.start_time || a.start));
  }, [reservas]);

  const formatHourRange = (start, end) => {
    const inicio = new Date(start);
    const fin = new Date(end || start);
    return `${inicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${fin.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  };

  const getStatusBadge = (status) => {
    if (status === 'Cancelada') return 'badge-danger';
    if (status === 'Pendiente') return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <h2>Mi cuenta</h2>
        <div>
          <strong>{perfil?.nombre} {perfil?.apellido}</strong>
          <br />
          <small>{perfil?.email}</small>
        </div>
        <nav>
          <button className="nav-button active">Resumen</button>
        </nav>
        <button className="logout-button" onClick={logout}>Cerrar sesión</button>
      </aside>

      <main className="content">
        <section>
          <div className="section-header">
            <h1>Perfil y membresías</h1>
          </div>

          <div className="metrics">
            <div className="metric-card">
              <h4>Membresías activas</h4>
              <div className="metric-value">{totalActivas}</div>
            </div>
            <div className="metric-card">
              <h4>Días restantes</h4>
              <div className="metric-value">{diasRestantes}</div>
            </div>
            <div className="metric-card">
              <h4>Pagos realizados</h4>
              <div className="metric-value">{totalPagos}</div>
            </div>
            <div className="metric-card">
              <h4>Total pagado</h4>
              <div className="metric-value">${totalPagado.toLocaleString()}</div>
            </div>
          </div>

          <div className="active-membership-card">
            <div>
              <h2>Mi membresía</h2>
              {activeMembership ? (
                <>
                  <p className="highlight">{activeMembership.membresia?.nombre}</p>
                  <p>
                    {diasRestantes} días restantes · vence el {activeMembership.fechaFin}
                  </p>
                </>
              ) : (
                <p>
                  No tienes una membresía activa. Explora los <Link to="/planes">planes disponibles</Link> o solicita ayuda al
                  administrador.
                </p>
              )}
            </div>
            <div className="action-links">
              <Link className="link-chip" to="/planes">Ver planes</Link>
              <Link className="link-chip" to="/reservas">Reservar máquina</Link>
              <a className="link-chip" href="#historial-reservas">Historial</a>
            </div>
          </div>

          <h2>Actualizar perfil</h2>
          <form className="form-grid" onSubmit={handleUpdatePerfil}>
            <div className="form-field">
              <label>Nombre
                <input value={formPerfil.nombre} onChange={(e) => setFormPerfil({ ...formPerfil, nombre: e.target.value })} required />
              </label>
            </div>
            <div className="form-field">
              <label>Apellido
                <input value={formPerfil.apellido} onChange={(e) => setFormPerfil({ ...formPerfil, apellido: e.target.value })} required />
              </label>
            </div>
            <div className="form-field">
              <label>Teléfono
                <input value={formPerfil.telefono} onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })} />
              </label>
            </div>
            <div className="form-field">
              <label>Nueva contraseña
                <input type="password" value={formPerfil.password} onChange={(e) => setFormPerfil({ ...formPerfil, password: e.target.value })} placeholder="Opcional" />
              </label>
            </div>
            <div className="form-field" style={{ alignSelf: 'end' }}>
              <button className="primary-button" type="submit">Guardar cambios</button>
            </div>
          </form>

          <h2>Mis membresías</h2>
          <div className="card-grid">
            {membresias.length === 0 ? (
              <div className="card">
                <h3>No tienes membresías</h3>
                <p>Solicita una membresía al administrador.</p>
              </div>
            ) : (
              membresias.map((item) => (
                <div className="card" key={item.id}>
                  <h3>{item.membresia?.nombre}</h3>
                  <p>{item.membresia?.descripcion}</p>
                  <strong>${Number(item.membresia?.precio || 0).toLocaleString()}</strong>
                  <p>Desde: {item.fechaInicio}</p>
                  <p>Hasta: {item.fechaFin}</p>
                  <span className={`badge ${item.estado === 'Activa' ? 'badge-success' : item.estado === 'Vencida' ? 'badge-danger' : 'badge-warning'}`}>
                    {item.estado}
                  </span>
                </div>
              ))
            )}
          </div>

          <h2>Reservas</h2>
          <div className="reservation-overview" id="panel-reservas">
            <div className="card next-reservation-card">
              <h3>Próxima reserva</h3>
              {reservasLoading ? (
                <p>Consultando disponibilidad...</p>
              ) : proximaReserva ? (
                <>
                  <p className="highlight">{proximaReserva.machine?.nombre || proximaReserva.machine_name}</p>
                  <p>
                    {new Date(proximaReserva.start_time || proximaReserva.start).toLocaleDateString()} ·{' '}
                    {formatHourRange(proximaReserva.start_time || proximaReserva.start, proximaReserva.end_time || proximaReserva.end)}
                  </p>
                  <span className={`badge ${getStatusBadge(proximaReserva.status || 'Confirmada')}`}>
                    {proximaReserva.status || 'Confirmada'}
                  </span>
                </>
              ) : (
                <p>No tienes reservas programadas. Usa el botón para agendar una nueva.</p>
              )}
              <Link className="primary-button" to="/reservas">Agendar nueva reserva</Link>
            </div>
            <div className="card reservation-summary-card">
              <h3>Resumen</h3>
              <div className="reservation-summary">
                <div>
                  <strong>{reservas.length}</strong>
                  <span>Reservas registradas</span>
                </div>
                <div>
                  <strong>{historialReservas.length}</strong>
                  <span>Completadas</span>
                </div>
                <div>
                  <strong>{proximaReserva ? 1 : 0}</strong>
                  <span>Próximas</span>
                </div>
              </div>
              <p>Consulta la agenda completa y administra tus turnos en la sección de reservas.</p>
            </div>
          </div>

          <h2 id="historial-reservas">Historial de reservas</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Máquina</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {reservasLoading ? (
                  <tr>
                    <td colSpan={4}>Consultando reservas...</td>
                  </tr>
                ) : historialReservas.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No hay reservas registradas aún.</td>
                  </tr>
                ) : (
                  historialReservas.map((reserva) => {
                    const status = reserva.status || 'Completada';
                    const start = reserva.start_time || reserva.start;
                    const end = reserva.end_time || reserva.end;
                    return (
                      <tr key={reserva.id}>
                        <td>{new Date(start).toLocaleDateString()}</td>
                        <td>{formatHourRange(start, end)}</td>
                        <td>{reserva.machine?.nombre || reserva.machine_name || 'N/A'}</td>
                        <td>
                          <span className={`badge ${getStatusBadge(status)}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <h2>Historial de pagos</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Membresía</th>
                </tr>
              </thead>
              <tbody>
                {pagos.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No hay pagos registrados.</td>
                  </tr>
                ) : (
                  pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td>{pago.fechaPago}</td>
                      <td>${Number(pago.monto).toLocaleString()}</td>
                      <td><span className="badge badge-info">{pago.metodoPago}</span></td>
                      <td>{pago.membresiaNombre || 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {message && <div className={`message ${messageType}`}>{message}</div>}
        </section>
      </main>
    </div>
  );
}
