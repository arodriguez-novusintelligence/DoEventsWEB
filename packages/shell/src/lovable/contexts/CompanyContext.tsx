import { createContext, useContext, useState, ReactNode } from 'react';
import { fetchUserById, type UserProfile } from '@doevents/shared';

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type BusinessPlan = 'free-business' | 'pro-business';

export interface CompanyData {
  legalName: string;
  nit: string;
  sector: string;
  foundedYear: string;
  size: string;
  website: string;
  city: string;
  description: string;
}

interface CompanyContextType {
  isCompany: boolean;
  setIsCompany: (v: boolean) => void;
  company: CompanyData;
  setCompany: (data: Partial<CompanyData>) => void;
  verification: VerificationStatus;
  requestVerification: () => void;
  approveVerificationMock: () => void;
  businessPlan: BusinessPlan;
  setBusinessPlan: (p: BusinessPlan) => void;
}

const defaultCompany: CompanyData = {
  legalName: 'Global Eventos S.A.S',
  nit: '900.123.456-7',
  sector: 'Producción de eventos',
  foundedYear: '2018',
  size: '11-50 empleados',
  website: 'www.globaleventos.com',
  city: 'Medellín, Colombia',
  description: 'Productora especializada en eventos corporativos, festivales y experiencias culturales.',
};

const CompanyContext = createContext<CompanyContextType>({
  isCompany: false,
  setIsCompany: () => undefined,
  company: defaultCompany,
  setCompany: () => undefined,
  verification: 'none',
  requestVerification: () => undefined,
  approveVerificationMock: () => undefined,
  businessPlan: 'free-business',
  setBusinessPlan: () => undefined,
});

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [isCompany, setIsCompany] = useState(false);
  const [company, setCompanyState] = useState<CompanyData>(defaultCompany);
  const [verification, setVerification] = useState<VerificationStatus>('none');
  const [businessPlan, setBusinessPlan] = useState<BusinessPlan>('free-business');

  const setCompany = (data: Partial<CompanyData>) =>
    setCompanyState((prev) => ({ ...prev, ...data }));

  const requestVerification = () => {
    setVerification('pending');
    // Simulated review process: auto-approve after 6s
    setTimeout(() => setVerification('verified'), 6000);
  };

  const approveVerificationMock = () => setVerification('verified');

  return (
    <CompanyContext.Provider
      value={{
        isCompany,
        setIsCompany,
        company,
        setCompany,
        verification,
        requestVerification,
        approveVerificationMock,
        businessPlan,
        setBusinessPlan,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};