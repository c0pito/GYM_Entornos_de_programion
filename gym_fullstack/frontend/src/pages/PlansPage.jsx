import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import '../styles/public-pages.css';

export default function PlansPage() {
  const { user } = useAuth();
  const { request } = useApi();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activatingPlan, setActivatingPlan] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    let isMounted = true;
    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        const endpoint = user ? '/membresia/list' : '/public/memberships';
        const data = await request(endpoint, user ? undefined : { secure: false });
        if (isMounted) {
          setPlans(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error.message || 'No se pudieron cargar los planes');
          setMessageType('error');
        }
      } finally {
        if (isMounted) {
          setLoadingPlans(false);
        }
      }
    };

    loadPlans();
    return () => {
      isMounted = false;
    };
  }, [request, user]);

  const featuredPlan = useMemo(() => plans[0], [plans]);

  const handleActivatePlan = async (planId) => {
    if (!user) {
      setMessage('Debes iniciar sesión para activar un plan.');
      setMessageType('error');
      return;
    }

    setActivatingPlan(planId);
    setMessage(null);

    try {
      await request('/memberships/activate', {
        method: 'POST',
        body: { membership_id: planId }
      });
      setMessage('Plan activado correctamente. Revisa tu panel de cliente.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.message || 'No se pudo activar el plan');
      setMessageType('error');
    } finally {
      setActivatingPlan(null);
    }
  };

  return (
    <div className="public-page">
      <header className="public-hero">
        <div>
          <p className="eyebrow">Conoce nuestros planes</p>
          <h1>Flexibilidad para cada objetivo</h1>
          <p>
            Planes mensuales, trimestrales y bonos de sesiones para que gestiones tu progreso con libertad. Activa tus membresías
            y reserva máquinas desde la app.
          </p>
          <div className="public-cta-row">
            <Link className="primary-button" to={user ? '/cliente' : '/register'}>
              {user ? 'Ir a mi panel' : 'Crear cuenta'}
            </Link>
            <Link className="ghost-button" to="/reservas">Reservar una máquina</Link>
          </div>
        </div>
        {featuredPlan && (
          <div className="public-card">
            <p className="eyebrow">Plan destacado</p>
            <h2>{featuredPlan.nombre}</h2>
            <p>{featuredPlan.descripcion}</p>
            <div className="price">${Number(featuredPlan.precio || 0).toLocaleString()}</div>
            <small>Duración: {featuredPlan.duracionDias} días</small>
            <button
              className="primary-button"
              onClick={() => handleActivatePlan(featuredPlan.id)}
              disabled={activatingPlan === featuredPlan.id}
            >
              {activatingPlan === featuredPlan.id ? 'Activando...' : 'Activar este plan'}
            </button>
          </div>
        )}
      </header>

      <section className="public-section">
        <div className="section-header">
          <h2>Todos los planes disponibles</h2>
        </div>

        {loadingPlans ? (
          <p className="muted">Cargando planes...</p>
        ) : (
          <div className="plans-grid">
            {plans.length === 0 ? (
              <div className="public-card">
                <h3>No hay planes publicados</h3>
                <p>Vuelve más tarde para descubrir nuevas membresías.</p>
              </div>
            ) : (
              plans.map((plan) => (
                <article key={plan.id} className="plan-card">
                  <div>
                    <p className="eyebrow">{plan.duracionDias} días</p>
                    <h3>{plan.nombre}</h3>
                    <p>{plan.descripcion}</p>
                  </div>
                  <div className="plan-footer">
                    <strong>${Number(plan.precio || 0).toLocaleString()}</strong>
                    <button
                      className="ghost-button"
                      onClick={() => handleActivatePlan(plan.id)}
                      disabled={activatingPlan === plan.id}
                    >
                      {activatingPlan === plan.id ? 'Procesando...' : user ? 'Activar' : 'Inicia sesión'}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {message && <div className={`public-message ${messageType}`}>{message}</div>}
      </section>
    </div>
  );
}
