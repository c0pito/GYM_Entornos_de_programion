import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import '../styles/login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const user = await login(email, password);
      setMessage('Inicio de sesión exitoso. Redirigiendo...');
      setMessageType('success');
      setTimeout(() => {
        navigate(user.role === 'Administrador' ? '/admin' : '/cliente', { replace: true });
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
        <h1>GYM 3000</h1>
        <p>Accede con tu correo y contraseña para continuar.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@gym.com"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button className="login-button" type="submit" disabled={loading}>
            Iniciar sesión
          </button>
        </form>

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            Verificando credenciales...
          </div>
        )}

        {message && <div className={`message ${messageType}`}>{message}</div>}

        <div className="login-links">
          <span>¿Aún no tienes cuenta?</span>
          <Link to="/register">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
}
