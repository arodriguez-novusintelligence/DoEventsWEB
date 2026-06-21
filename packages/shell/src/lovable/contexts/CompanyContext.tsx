import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchUserById, type UserProfile } from '@doevents/shared';

interface CompanyInfo {
  accountType?: UserProfile['accountType'];
  companyName?: string;
  companyWebsite?: string;
  companyIndustry?: string;
  companyDescription?: string;
  organizerName?: string;
}

interface CompanyContextValue {
  company: CompanyInfo | null;
  loading: boolean;
  loadError: boolean;
  loadErrorMessage: string | null;
  hasCompany: boolean;
  isEmpty: boolean;
  accountTypeLabel: string;
  refresh: () => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  company: null,
  loading: false,
  loadError: false,
  loadErrorMessage: null,
  hasCompany: false,
  isEmpty: true,
  accountTypeLabel: 'Personal',
  refresh: () => undefined,
});

export const useCompany = () => useContext(CompanyContext);

interface CompanyProviderProps {
  userId?: string | null;
  children: ReactNode;
}

export const CompanyProvider = ({ userId, children }: CompanyProviderProps) => {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!userId) {
      setCompany(null);
      setLoadError(false);
      setLoadErrorMessage(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    setLoadErrorMessage(null);
    void fetchUserById(userId)
      .then((profile) => {
        if (cancelled || !profile) return;
        const organizerName = [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim();
        setCompany({
          accountType: profile.accountType,
          companyName: profile.companyName,
          companyWebsite: profile.companyWebsite,
          companyIndustry: profile.companyIndustry,
          companyDescription: profile.companyDescription,
          organizerName: organizerName || profile.username || profile.email,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setCompany(null);
          setLoadError(true);
          setLoadErrorMessage(err instanceof Error ? err.message : 'No se pudieron cargar los datos de empresa');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, refreshKey]);

  const value = useMemo(
    () => ({
      company,
      loading,
      loadError,
      loadErrorMessage,
      hasCompany: Boolean(company?.companyName || company?.accountType === 'company'),
      isEmpty: !loading && !loadError && !company?.companyName && company?.accountType !== 'company',
      accountTypeLabel: company?.accountType === 'company' ? 'Empresa' : 'Personal',
      refresh,
    }),
    [company, loading, loadError, loadErrorMessage],
  );

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
