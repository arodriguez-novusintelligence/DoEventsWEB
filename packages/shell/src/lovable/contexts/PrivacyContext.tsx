import { createContext, useContext, useState, ReactNode } from 'react';

interface PrivacyContextType {
  privateProfile: boolean;
  setPrivateProfile: (v: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  privateProfile: false,
  setPrivateProfile: () => undefined,
});

export const usePrivacy = () => useContext(PrivacyContext);

export const PrivacyProvider = ({ children }: { children: ReactNode }) => {
  const [privateProfile, setPrivateProfile] = useState(false);
  return (
    <PrivacyContext.Provider value={{ privateProfile, setPrivateProfile }}>
      {children}
    </PrivacyContext.Provider>
  );
};

// Mock: which OTHER users have a private profile (so following them needs a request)
export const PRIVATE_USER_IDS = new Set<string>(['u2', 'u4', 'u-VT', 'u-CG']);
export const isUserPrivate = (userId: string) => PRIVATE_USER_IDS.has(userId);
