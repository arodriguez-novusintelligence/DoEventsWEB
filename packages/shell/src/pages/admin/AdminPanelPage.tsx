import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAdminDashboard, RootState, useToast, type AdminDashboardStats } from '@doevents/shared';
import AdminLayout, { type AdminTabId } from './AdminLayout';
import { AdminLoading, useAdminGuard } from './useAdminGuard';
import { AdminHomeTab } from './tabs/AdminHomeTab';
import { AdminSupportTab } from './tabs/AdminSupportTab';
import { AdminPaymentsTab } from './tabs/AdminPaymentsTab';
import { AdminStaffTab } from './tabs/AdminStaffTab';
import { AdminNewUsersTab } from './tabs/AdminNewUsersTab';
import { AdminContentTab } from './tabs/AdminContentTab';
import { AdminAITab } from './tabs/AdminAITab';

const TAB_IDS: AdminTabId[] = ['home', 'content', 'ai', 'support', 'payments', 'admin', 'newusers'];

const LEGACY_TAB_MAP: Record<string, AdminTabId> = {
  users: 'admin',
  orders: 'payments',
  events: 'content',
  venues: 'content',
  services: 'content',
  activity: 'home',
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
      {activeTab === 'content' && <AdminContentTab />}
      {activeTab === 'ai' && <AdminAITab />}
      {activeTab === 'support' && <AdminSupportTab />}
      {activeTab === 'payments' && <AdminPaymentsTab />}
      {activeTab === 'admin' && <AdminStaffTab />}
      {activeTab === 'newusers' && <AdminNewUsersTab />}
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

export default AdminPanelPage;
