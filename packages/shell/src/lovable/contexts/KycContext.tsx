import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchUserById } from '@doevents/shared';

export type KycStatus = 'pending' | 'in_review' | 'verified' | 'rejected';

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  pending: 'Pendiente de certificación',
  in_review: 'En revisión',
  verified: 'Certificado',
  rejected: 'Rechazado',
};

interface KycContextValue {
  status: KycStatus;
  loading: boolean;
  loadError: boolean;
  isCertified: boolean;
  statusLabel: string;
  refresh: () => void;
}

const KycContext = createContext<KycContextValue>({
  status: 'pending',
  loading: false,
  loadError: false,
  isCertified: false,
  statusLabel: KYC_STATUS_LABELS.pending,
  refresh: () => undefined,
});

export const useKyc = () => useContext(KycContext);

interface KycProviderProps {
  userId?: string | null;
  children: ReactNode;
}

function resolveKycStatus(profile: Record<string, unknown> | null): KycStatus {
  if (!profile) return 'pending';
  const raw = profile.kycStatus || profile.kyc_state || profile.certificationStatus;
  if (typeof raw === 'string') {
    const normalized = raw.toLowerCase();
    if (normalized.includes('verified') || normalized.includes('approved') || normalized.includes('certified')) {
      return 'verified';
    }
    if (normalized.includes('review') || normalized.includes('pending')) return 'in_review';
    if (normalized.includes('reject')) return 'rejected';
  }
  if (profile.isKycVerified === true || profile.organizerCertified === true) return 'verified';
  return 'pending';
}

export const KycProvider = ({ userId, children }: KycProviderProps) => {
  const [status, setStatus] = useState<KycStatus>('pending');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!userId) {
      setStatus('pending');
      setLoadError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    void fetchUserById(userId)
      .then((profile) => {
        if (!cancelled) {
          setStatus(resolveKycStatus(profile as Record<string, unknown> | null));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('pending');
          setLoadError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, refreshKey]);

  const value = useMemo(
    () => ({
      status,
      loading,
      loadError,
      isCertified: status === 'verified',
      statusLabel: KYC_STATUS_LABELS[status],
      refresh,
    }),
    [status, loading, loadError],
  );

  return (
    <KycContext.Provider value={value}>
      {children}
    </KycContext.Provider>
  );
};
