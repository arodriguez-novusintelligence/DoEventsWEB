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
  refresh: () => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  company: null,
  loading: false,
  loadError: false,
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
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!userId) {
      setCompany(null);
      setLoadError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
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
      .catch(() => {
        if (!cancelled) {
          setCompany(null);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, refreshKey]);

  const value = useMemo(
    () => ({ company, loading, loadError, refresh }),
    [company, loading, loadError],
  );

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
