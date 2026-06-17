import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@doevents/shared';
import AIAssistantView from '@lovable/components/ai/AIAssistantView';

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const userId = useSelector((s: RootState) => s.auth.idUser) || undefined;

  return (
    <AIAssistantView
      userId={userId}
      onBack={() => navigate(-1)}
    />
  );
};

export default AIAssistantPage;
