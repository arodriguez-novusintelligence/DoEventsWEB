import { SocialWallTab } from './SocialWallTab';

/**
 * Equivalente Lovable Index: feed principal dentro de layout secundario.
 * La navegación por tabs vive en `LovableLayout`; esta página concentra el muro social.
 */
export const Index = () => (
  <div className="mx-auto min-h-screen max-w-lg bg-secondary pb-24">
    <SocialWallTab />
  </div>
);

export default Index;
