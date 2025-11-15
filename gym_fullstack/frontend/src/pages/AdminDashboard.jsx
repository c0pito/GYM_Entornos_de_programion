import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import '../styles/dashboard.css';

const membershipStatus = ['Activa', 'Pendiente', 'Vencida'];
const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia'];

export default function AdminDashboard({ initialTab = 'usuarios' }) {
  const { user, logout } = useAuth();
  const { request } = useApi();

  const [activeTab, setActiveTab] = useState(initialTab);

  const [usuarios, setUsuarios] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [machines, setMachines] = useState([]);
  const [agenda, setAgenda] = useState([]);

  const [formUser, setFormUser] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    telefono: '',
    rol: 'Cliente'
  });
  const [formMembresia, setFormMembresia] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracionDias: ''
  });
  const [formAsignacion, setFormAsignacion] = useState({
    usuario_id: '',
    membresia_id: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'Pendiente'
  });
  const [formPago, setFormPago] = useState({
    clienteMembresiaId: '',
    fechaPago: '',
    monto: '',
    metodoPago: 'Efectivo'
  });
  const [formMachine, setFormMachine] = useState({ nombre: '', descripcion: '', ubicacion: '' });
  const [agendaFilters, setAgendaFilters] = useState({ machineId: '', date: '' });

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const clientes = useMemo(
    () => usuarios.filter((item) => item.rol === 'Cliente'),
    [usuarios]
  );

  const asignacionesActivas = useMemo(
    () => asignaciones.filter((item) => item.estado === 'Activa'),
    [asignaciones]
  );

  useEffect(() => {
    setMessage(null);
  }, [activeTab]);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
  };

  const loadUsuarios = async () => {
    const data = await request('/usuario/list');
    setUsuarios(data);
  };

  const loadMembresias = async () => {
    const data = await request('/membresia/list');
    setMembresias(data);
  };

  const loadAsignaciones = async () => {
    const data = await request('/clientemembresia/list');
    setAsignaciones(data);
  };

  const loadPagos = async () => {
    const data = await request('/gimnasio/pagos');
    setPagos(data);
  };

  const loadMachines = async () => {
    const data = await request('/machines/');
    setMachines(Array.isArray(data) ? data : []);
  };

  const loadAgenda = async (filters = agendaFilters) => {
    const params = new URLSearchParams();
    if (filters.machineId) {
      params.append('machine_id', filters.machineId);
    }
    if (filters.date) {
      params.append('date', filters.date);
    }
    const query = params.toString();
    const data = await request(query ? `/reservations/?${query}` : '/reservations/');
    setAgenda(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    if (activeTab === 'usuarios') {
      loadUsuarios().catch((error) => showMessage(error.message, 'error'));
    } else if (activeTab === 'membresias') {
      loadMembresias().catch((error) => showMessage(error.message, 'error'));
    } else if (activeTab === 'asignaciones') {
      Promise.all([loadAsignaciones(), loadUsuarios(), loadMembresias()]).catch((error) =>
        showMessage(error.message, 'error')
      );
    } else if (activeTab === 'pagos') {
      Promise.all([loadPagos(), loadAsignaciones()]).catch((error) =>
        showMessage(error.message, 'error')
      );
    } else if (activeTab === 'maquinas') {
      loadMachines().catch((error) => showMessage(error.message, 'error'));
    } else if (activeTab === 'agenda') {
      Promise.all([loadMachines(), loadAgenda()]).catch((error) =>
        showMessage(error.message, 'error')
      );
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'agenda') {
      loadAgenda(agendaFilters).catch((error) => showMessage(error.message, 'error'));
    }
  }, [agendaFilters, activeTab]);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    try {
      await request('/usuario/', { method: 'POST', body: formUser });
      showMessage('Usuario creado correctamente.');
      setFormUser({ nombre: '', apellido: '', email: '', password: '', telefono: '', rol: 'Cliente' });
      loadUsuarios();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await request(`/usuario/${id}`, { method: 'DELETE' });
      showMessage('Usuario eliminado.');
      loadUsuarios();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleCreateMembresia = async (event) => {
    event.preventDefault();
    const payload = {
      ...formMembresia,
      precio: parseFloat(formMembresia.precio || 0),
      duracionDias: parseInt(formMembresia.duracionDias || 0, 10)
    };
    try {
      await request('/membresia/', { method: 'POST', body: payload });
      showMessage('Membresía creada correctamente.');
      setFormMembresia({ nombre: '', descripcion: '', precio: '', duracionDias: '' });
      loadMembresias();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleDeleteMembresia = async (id) => {
    if (!window.confirm('¿Eliminar esta membresía?')) return;
    try {
      await request(`/membresia/${id}`, { method: 'DELETE' });
      showMessage('Membresía eliminada.');
      loadMembresias();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleCreateAsignacion = async (event) => {
    event.preventDefault();
    try {
      await request('/clientemembresia/', { method: 'POST', body: formAsignacion });
      showMessage('Membresía asignada.');
      setFormAsignacion({ usuario_id: '', membresia_id: '', fechaInicio: '', fechaFin: '', estado: 'Pendiente' });
      loadAsignaciones();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleDeleteAsignacion = async (id) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return;
    try {
      await request(`/clientemembresia/${id}`, { method: 'DELETE' });
      showMessage('Asignación eliminada.');
      loadAsignaciones();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleCreatePago = async (event) => {
    event.preventDefault();
    const payload = {
      ...formPago,
      monto: parseFloat(formPago.monto || 0)
    };
    try {
      await request('/gimnasio/pago', { method: 'POST', body: payload });
      showMessage('Pago registrado.');
      setFormPago({ clienteMembresiaId: '', fechaPago: '', monto: '', metodoPago: 'Efectivo' });
      loadPagos();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleDeletePago = async (id) => {
    if (!window.confirm('¿Eliminar este pago?')) return;
    try {
      await request(`/gimnasio/pago/${id}`, { method: 'DELETE' });
      showMessage('Pago eliminado.');
      loadPagos();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleCreateMachine = async (event) => {
    event.preventDefault();
    try {
      await request('/machines/', { method: 'POST', body: formMachine });
      showMessage('Máquina registrada.');
      setFormMachine({ nombre: '', descripcion: '', ubicacion: '' });
      loadMachines();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleDeleteMachine = async (id) => {
    if (!window.confirm('¿Eliminar esta máquina?')) return;
    try {
      await request(`/machines/${id}`, { method: 'DELETE' });
      showMessage('Máquina eliminada.');
      loadMachines();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('¿Cancelar esta reserva?')) return;
    try {
      await request(`/reservations/${id}`, { method: 'DELETE' });
      showMessage('Reserva cancelada.');
      loadAgenda();
    } catch (error) {
      showMessage(error.message, 'error');
    }
  };

  const totalIngresos = useMemo(
    () => pagos.reduce((acc, pago) => acc + Number(pago.monto || 0), 0),
    [pagos]
  );

  const formatHourRange = (start, end) => {
    if (!start) return 'N/A';
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
        <h2>Panel administrativo</h2>
        <div>
          <strong>{user?.nombre} {user?.apellido}</strong>
          <br />
          <small>{user?.email}</small>
        </div>

        <nav>
          <button className={`nav-button ${activeTab === 'usuarios' ? 'active' : ''}`} onClick={() => setActiveTab('usuarios')}>
            Usuarios
          </button>
          <button className={`nav-button ${activeTab === 'membresias' ? 'active' : ''}`} onClick={() => setActiveTab('membresias')}>
            Membresías
          </button>
          <button className={`nav-button ${activeTab === 'asignaciones' ? 'active' : ''}`} onClick={() => setActiveTab('asignaciones')}>
            Asignaciones
          </button>
          <button className={`nav-button ${activeTab === 'pagos' ? 'active' : ''}`} onClick={() => setActiveTab('pagos')}>
            Pagos
          </button>
          <button className={`nav-button ${activeTab === 'maquinas' ? 'active' : ''}`} onClick={() => setActiveTab('maquinas')}>
            Máquinas
          </button>
          <button className={`nav-button ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
            Agenda
          </button>
        </nav>

        <button className="logout-button" onClick={logout}>
          Cerrar sesión
        </button>
      </aside>

      <main className="content">
        {activeTab === 'usuarios' && (
          <section>
            <div className="section-header">
              <h1>Gestión de usuarios</h1>
            </div>

            <form className="form-grid" onSubmit={handleCreateUser}>
              <div className="form-field">
                <label>Nombre
                  <input value={formUser.nombre} onChange={(e) => setFormUser({ ...formUser, nombre: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Apellido
                  <input value={formUser.apellido} onChange={(e) => setFormUser({ ...formUser, apellido: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Correo electrónico
                  <input type="email" value={formUser.email} onChange={(e) => setFormUser({ ...formUser, email: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Contraseña
                  <input type="password" value={formUser.password} onChange={(e) => setFormUser({ ...formUser, password: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Teléfono
                  <input value={formUser.telefono} onChange={(e) => setFormUser({ ...formUser, telefono: e.target.value })} />
                </label>
              </div>
              <div className="form-field">
                <label>Rol
                  <select value={formUser.rol} onChange={(e) => setFormUser({ ...formUser, rol: e.target.value })}>
                    <option value="Administrador">Administrador</option>
                    <option value="Entrenador">Entrenador</option>
                    <option value="Cliente">Cliente</option>
                  </select>
                </label>
              </div>
              <div className="form-field" style={{ alignSelf: 'end' }}>
                <button className="primary-button" type="submit">Crear usuario</button>
              </div>
            </form>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No hay usuarios registrados.</td>
                    </tr>
                  ) : (
                    usuarios.map((item) => (
                      <tr key={item.id}>
                        <td>{item.nombre} {item.apellido}</td>
                        <td>{item.email}</td>
                        <td>{item.telefono || 'N/A'}</td>
                        <td><span className="badge badge-info">{item.rol}</span></td>
                        <td>
                          <button className="action-button" onClick={() => handleDeleteUser(item.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'membresias' && (
          <section>
            <div className="section-header">
              <h1>Membresías</h1>
            </div>

            <form className="form-grid" onSubmit={handleCreateMembresia}>
              <div className="form-field">
                <label>Nombre
                  <input value={formMembresia.nombre} onChange={(e) => setFormMembresia({ ...formMembresia, nombre: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Descripción
                  <textarea value={formMembresia.descripcion} onChange={(e) => setFormMembresia({ ...formMembresia, descripcion: e.target.value })} rows={3} />
                </label>
              </div>
              <div className="form-field">
                <label>Precio
                  <input type="number" min="0" step="0.01" value={formMembresia.precio} onChange={(e) => setFormMembresia({ ...formMembresia, precio: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Duración (días)
                  <input type="number" min="1" value={formMembresia.duracionDias} onChange={(e) => setFormMembresia({ ...formMembresia, duracionDias: e.target.value })} required />
                </label>
              </div>
              <div className="form-field" style={{ alignSelf: 'end' }}>
                <button className="primary-button" type="submit">Crear membresía</button>
              </div>
            </form>

            <div className="card-grid">
              {membresias.length === 0 ? (
                <div className="card">
                  <h3>No hay membresías</h3>
                  <p>Crea una membresía para empezar.</p>
                </div>
              ) : (
                membresias.map((item) => (
                  <div className="card" key={item.id}>
                    <h3>{item.nombre}</h3>
                    <p>{item.descripcion}</p>
                    <strong>${Number(item.precio).toLocaleString()}</strong>
                    <span className="badge badge-info">Duración: {item.duracionDias} días</span>
                    <button className="action-button" onClick={() => handleDeleteMembresia(item.id)}>Eliminar</button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'asignaciones' && (
          <section>
            <div className="section-header">
              <h1>Asignación de membresías</h1>
            </div>

            <form className="form-grid" onSubmit={handleCreateAsignacion}>
              <div className="form-field">
                <label>Cliente
                  <select value={formAsignacion.usuario_id} onChange={(e) => setFormAsignacion({ ...formAsignacion, usuario_id: e.target.value })} required>
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} {cliente.apellido}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-field">
                <label>Membresía
                  <select value={formAsignacion.membresia_id} onChange={(e) => setFormAsignacion({ ...formAsignacion, membresia_id: e.target.value })} required>
                    <option value="">Selecciona una membresía</option>
                    {membresias.map((membresia) => (
                      <option key={membresia.id} value={membresia.id}>
                        {membresia.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-field">
                <label>Fecha inicio
                  <input type="date" value={formAsignacion.fechaInicio} onChange={(e) => setFormAsignacion({ ...formAsignacion, fechaInicio: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Fecha fin
                  <input type="date" value={formAsignacion.fechaFin} onChange={(e) => setFormAsignacion({ ...formAsignacion, fechaFin: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Estado
                  <select value={formAsignacion.estado} onChange={(e) => setFormAsignacion({ ...formAsignacion, estado: e.target.value })}>
                    {membershipStatus.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-field" style={{ alignSelf: 'end' }}>
                <button className="primary-button" type="submit">Asignar membresía</button>
              </div>
            </form>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Membresía</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {asignaciones.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No hay asignaciones registradas.</td>
                    </tr>
                  ) : (
                    asignaciones.map((item) => (
                      <tr key={item.id}>
                        <td>{item.usuario?.nombre} {item.usuario?.apellido}</td>
                        <td>{item.membresia?.nombre}</td>
                        <td>{item.fechaInicio}</td>
                        <td>{item.fechaFin}</td>
                        <td>
                          <span className={`badge ${item.estado === 'Activa' ? 'badge-success' : item.estado === 'Vencida' ? 'badge-danger' : 'badge-warning'}`}>
                            {item.estado}
                          </span>
                        </td>
                        <td>
                          <button className="action-button" onClick={() => handleDeleteAsignacion(item.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'pagos' && (
          <section>
            <div className="section-header">
              <h1>Pagos</h1>
            </div>

            <div className="metrics">
              <div className="metric-card">
                <h4>Total ingresos</h4>
                <div className="metric-value">${totalIngresos.toLocaleString()}</div>
              </div>
              <div className="metric-card">
                <h4>Pagos registrados</h4>
                <div className="metric-value">{pagos.length}</div>
              </div>
            </div>

            <form className="form-grid" onSubmit={handleCreatePago}>
              <div className="form-field">
                <label>Asignación
                  <select value={formPago.clienteMembresiaId} onChange={(e) => setFormPago({ ...formPago, clienteMembresiaId: e.target.value })} required>
                    <option value="">Selecciona una asignación</option>
                    {asignacionesActivas.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.usuario?.nombre} {item.usuario?.apellido} - {item.membresia?.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-field">
                <label>Fecha de pago
                  <input type="date" value={formPago.fechaPago} onChange={(e) => setFormPago({ ...formPago, fechaPago: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Monto
                  <input type="number" min="0" step="0.01" value={formPago.monto} onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Método de pago
                  <select value={formPago.metodoPago} onChange={(e) => setFormPago({ ...formPago, metodoPago: e.target.value })}>
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-field" style={{ alignSelf: 'end' }}>
                <button className="primary-button" type="submit">Registrar pago</button>
              </div>
            </form>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Membresía</th>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No hay pagos registrados.</td>
                    </tr>
                  ) : (
                    pagos.map((pago) => (
                      <tr key={pago.id}>
                        <td>{pago.clienteNombre || 'N/A'}</td>
                        <td>{pago.membresiaNombre || 'N/A'}</td>
                        <td>{pago.fechaPago}</td>
                        <td>${Number(pago.monto).toLocaleString()}</td>
                        <td><span className="badge badge-info">{pago.metodoPago}</span></td>
                        <td>
                          <button className="action-button" onClick={() => handleDeletePago(pago.id)}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'maquinas' && (
          <section>
            <div className="section-header">
              <h1>Máquinas y equipos</h1>
            </div>

            <form className="form-grid" onSubmit={handleCreateMachine}>
              <div className="form-field">
                <label>Nombre
                  <input value={formMachine.nombre} onChange={(event) => setFormMachine({ ...formMachine, nombre: event.target.value })} required />
                </label>
              </div>
              <div className="form-field">
                <label>Descripción
                  <textarea value={formMachine.descripcion} onChange={(event) => setFormMachine({ ...formMachine, descripcion: event.target.value })} rows={3} />
                </label>
              </div>
              <div className="form-field">
                <label>Ubicación
                  <input value={formMachine.ubicacion} onChange={(event) => setFormMachine({ ...formMachine, ubicacion: event.target.value })} placeholder="Sala de fuerza, piso 2..." />
                </label>
              </div>
              <div className="form-field" style={{ alignSelf: 'end' }}>
                <button className="primary-button" type="submit">Agregar máquina</button>
              </div>
            </form>

            <div className="card-grid">
              {machines.length === 0 ? (
                <div className="card">
                  <h3>No hay máquinas registradas</h3>
                  <p>Agrega tus equipos para habilitar la agenda de reservas.</p>
                </div>
              ) : (
                machines.map((machine) => (
                  <div className="card" key={machine.id}>
                    <h3>{machine.nombre || machine.name}</h3>
                    <p>{machine.descripcion || machine.description}</p>
                    <span className="badge badge-info">{machine.ubicacion || machine.location || 'Sin ubicación'}</span>
                    <button className="action-button" onClick={() => handleDeleteMachine(machine.id)}>Eliminar</button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === 'agenda' && (
          <section>
            <div className="section-header">
              <h1>Agenda de reservas</h1>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Máquina
                  <select value={agendaFilters.machineId} onChange={(event) => setAgendaFilters((prev) => ({ ...prev, machineId: event.target.value }))}>
                    <option value="">Todas</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.nombre || machine.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-field">
                <label>Fecha
                  <input type="date" value={agendaFilters.date} onChange={(event) => setAgendaFilters((prev) => ({ ...prev, date: event.target.value }))} />
                </label>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Máquina</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {agenda.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No hay reservas en la agenda para los filtros seleccionados.</td>
                    </tr>
                  ) : (
                    agenda.map((reserva) => {
                      const status = reserva.status || 'Confirmada';
                      const cliente =
                        (reserva.usuario?.nombre && `${reserva.usuario.nombre} ${reserva.usuario.apellido || ''}`.trim()) ||
                        reserva.clienteNombre ||
                        reserva.client_name ||
                        'N/A';
                      const machineLabel = reserva.machine?.nombre || reserva.machine_name || 'N/A';
                      const start = reserva.start_time || reserva.start;
                      const end = reserva.end_time || reserva.end;
                      return (
                        <tr key={reserva.id}>
                          <td>{cliente}</td>
                          <td>{machineLabel}</td>
                          <td>{start ? new Date(start).toLocaleDateString() : 'N/A'}</td>
                          <td>{start ? formatHourRange(start, end) : 'N/A'}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(status)}`}>{status}</span>
                          </td>
                          <td>
                            <button className="action-button" onClick={() => handleCancelReservation(reserva.id)}>Cancelar</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {message && <div className={`message ${messageType}`}>{message}</div>}
      </main>
    </div>
  );
}
