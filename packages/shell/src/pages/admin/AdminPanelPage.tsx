import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAdminDashboard, RootState, useToast, type AdminDashboardStats } from '@doevents/shared';
import AdminLayout, { type AdminTabId } from './AdminLayout';
import { AdminLoading, useAdminGuard } from './useAdminGuard';
import { AdminHomeTab } from './tabs/AdminHomeTab';
import { AdminReportsTab } from './tabs/AdminReportsTab';
import AdminUsersPanel from '@lovable/components/admin/AdminUsersPanel';
import PaymentsPanel from '@lovable/components/admin/PaymentsPanel';
import NewUsersPanel from '@lovable/components/admin/NewUsersPanel';
import SupportSearchPanel from '@lovable/components/admin/SupportSearchPanel';
import AdminRefundsPanel from '@lovable/components/admin/AdminRefundsPanel';

const TAB_IDS: AdminTabId[] = ['home', 'reports', 'refunds', 'support', 'payments', 'admin', 'newusers'];

const LEGACY_TAB_MAP: Record<string, AdminTabId> = {
  users: 'admin',
  orders: 'payments',
  events: 'home',
  venues: 'home',
  services: 'home',
  activity: 'home',
  content: 'home',
  ai: 'home',
  reports: 'reports',
  refunds: 'refunds',
};

export const AdminPanelPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const { showToast } = useToast();
  const { ready } = useAdminGuard(userId);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);

  const activeTab = useMemo<AdminTabId>(() => {
    const tab = searchParams.get('tab') || 'home';
    if (TAB_IDS.includes(tab as AdminTabId)) return tab as AdminTabId;
    return 'home';
  }, [searchParams]);

  useEffect(() => {
    if (!ready) return;
    void fetchAdminDashboard()
      .then(setStats)
      .catch((err) => showToast(err instanceof Error ? err.message : 'Error al cargar panel', 'error'));
  }, [ready, showToast]);

  const handleTabChange = (tab: AdminTabId) => {
    setSearchParams({ tab });
  };

  if (!ready) return <AdminLoading />;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'home' && <AdminHomeTab stats={stats} />}
      {activeTab === 'reports' && <AdminReportsTab />}
      {activeTab === 'refunds' && <AdminRefundsPanel embedded />}
      {activeTab === 'support' && <SupportSearchPanel />}
      {activeTab === 'payments' && <PaymentsPanel />}
      {activeTab === 'admin' && <AdminUsersPanel />}
      {activeTab === 'newusers' && <NewUsersPanel />}
    </AdminLayout>
  );
};

export function AdminLegacyRedirect({ section }: { section: string }) {
  const navigate = useNavigate();
  useEffect(() => {
    const tab = LEGACY_TAB_MAP[section] || 'home';
    navigate(`/admin?tab=${tab}`, { replace: true });
  }, [navigate, section]);
  return <AdminLoading />;
}

export function AdminGuardedLegacyRedirect({ section }: { section: string }) {
  const userId = useSelector((s: RootState) => s.auth.idUser);
  const { ready } = useAdminGuard(userId);
  if (!ready) return <AdminLoading />;
  return <AdminLegacyRedirect section={section} />;
}

export default AdminPanelPage;
