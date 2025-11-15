import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useApi } from '../hooks/useApi.js';
import '../styles/public-pages.css';

const initialForm = {
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  telefono: ''
};

export default function RegisterPage() {
  const { request } = useApi();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await request('/auth/register', {
        method: 'POST',
        body: formData,
        secure: false
      });
      setMessage('Cuenta creada correctamente. Puedes iniciar sesión.');
      setMessageType('success');
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (error) {
      setMessage(error.message || 'No se pudo crear la cuenta');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page">
      <header className="public-hero">
        <div>
          <p className="eyebrow">GYM 3000</p>
          <h1>Crea tu cuenta y reserva tu espacio</h1>
          <p>
            Gestiona membresías, pagos y reservas desde un mismo panel. Completa el formulario para unirte a la comunidad.
          </p>
        </div>
        <div className="public-card">
          <h2>Registro</h2>
          <form className="public-form" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input name="nombre" value={formData.nombre} onChange={handleChange} required />
            </label>
            <label>
              Apellido
              <input name="apellido" value={formData.apellido} onChange={handleChange} required />
            </label>
            <label>
              Correo electrónico
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </label>
            <label>
              Teléfono
              <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Opcional" />
            </label>
            <label>
              Contraseña
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </label>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>
          <p className="muted">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
          {message && <div className={`public-message ${messageType}`}>{message}</div>}
        </div>
      </header>
    </div>
  );
}
