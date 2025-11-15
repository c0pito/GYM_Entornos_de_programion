import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import '../styles/login.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await register(form);
      setMessage('Cuenta creada correctamente. Redirigiendo...');
      setMessageType('success');
      setTimeout(() => {
        navigate('/cliente', { replace: true });
      }, 700);
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-layout">
      <div className="login-card">
        <h1>Crear cuenta</h1>
        <p>Regístrate para comenzar a usar el portal de clientes.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              type="text"
              name="nombre"
              required
              value={form.nombre}
              onChange={handleChange}
              placeholder="Juan"
            />
          </label>

          <label>
            Apellido
            <input
              type="text"
              name="apellido"
              required
              value={form.apellido}
              onChange={handleChange}
              placeholder="Pérez"
            />
          </label>

          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="cliente@gym.com"
            />
          </label>

          <label>
            Teléfono (opcional)
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+57 300 123 4567"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          <button className="login-button" type="submit" disabled={loading}>
            Crear cuenta
          </button>
        </form>

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            Guardando información...
          </div>
        )}

        {message && <div className={`message ${messageType}`}>{message}</div>}

        <div className="login-links">
          <span>¿Ya tienes una cuenta?</span>
          <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
