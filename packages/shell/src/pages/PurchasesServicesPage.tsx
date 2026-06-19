import React from 'react';
import { useNavigate } from 'react-router-dom';
import MyReservedServicesView from '@lovable/components/purchases/MyReservedServicesView';

export const PurchasesServicesPage: React.FC = () => {
  const navigate = useNavigate();
  return <MyReservedServicesView onBack={() => navigate('/purchases')} />;
};

export default PurchasesServicesPage;
