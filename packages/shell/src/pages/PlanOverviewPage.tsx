import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** Redirige la ruta legada al catálogo de planes. */
export const PlanOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/profile/plans', { replace: true });
  }, [navigate]);

  return null;
};

export default PlanOverviewPage;
