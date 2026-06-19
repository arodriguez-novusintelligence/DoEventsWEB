import React from 'react';
import { useNavigate } from 'react-router-dom';
import MyPurchasesView from '@lovable/components/purchases/MyPurchasesView';

export const PurchasesPage: React.FC = () => {
  const navigate = useNavigate();
  return <MyPurchasesView onBack={() => navigate('/profile')} />;
};

export default PurchasesPage;
