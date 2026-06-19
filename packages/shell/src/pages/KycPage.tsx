import React from 'react';
import { useNavigate } from 'react-router-dom';
import KycCertificationView from '@lovable/components/feed/KycCertificationView';

export const KycPage: React.FC = () => {
  const navigate = useNavigate();
  return <KycCertificationView onBack={() => navigate('/profile')} />;
};

export default KycPage;
