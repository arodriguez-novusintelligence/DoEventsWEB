import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initApiClient } from '@doevents/shared';
import { getEnvironment } from '@config/environments/index';
import { LoginPage } from './pages/LoginPage';
import { CreateAccountPage } from './pages/CreateAccountPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyIdentityPage, OtpRecoveryAdvicePage } from './pages/OtpPages';
import { GustosPage } from './pages/GustosPage';
import { EnrolmentSuccessPage } from './pages/EnrolmentSuccessPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import { TermsAcceptancePage } from './pages/TermsAcceptancePage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';
import { ResetPasswordTokenPage } from './pages/ResetPasswordTokenPage';
import { CheckEmailPage } from './pages/CheckEmailPage';

initApiClient(getEnvironment());
export const AuthRoutes: React.FC = () => (
  <Routes>
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<CreateAccountPage />} />
    <Route path="forgot-password" element={<ForgotPasswordPage />} />
    <Route path="verify-identity" element={<VerifyIdentityPage />} />
    <Route path="otp-recovery" element={<OtpRecoveryAdvicePage />} />
    <Route path="reset-password" element={<ResetPasswordTokenPage />} />
    <Route path="activate" element={<ActivateAccountPage />} />
    <Route path="check-email" element={<CheckEmailPage />} />
    <Route path="terms" element={<TermsAcceptancePage />} />
    <Route path="gustos" element={<GustosPage />} />
    <Route path="enrolment-success" element={<EnrolmentSuccessPage />} />
    <Route path="callback" element={<OAuthCallbackPage />} />
    <Route path="*" element={<Navigate to="login" replace />} />
  </Routes>
);

export default AuthRoutes;
