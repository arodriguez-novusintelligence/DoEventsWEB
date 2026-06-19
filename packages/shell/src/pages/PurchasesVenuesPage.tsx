import React from 'react';
import { useNavigate } from 'react-router-dom';
import MyReservedVenuesView from '@lovable/components/purchases/MyReservedVenuesView';

export const PurchasesVenuesPage: React.FC = () => {
  const navigate = useNavigate();
  return <MyReservedVenuesView onBack={() => navigate('/purchases')} />;
};

export default PurchasesVenuesPage;
