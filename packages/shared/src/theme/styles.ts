import { Colors, FontSizes, Gradients, Layout, Shadows } from './tokens';

export const globalStyles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root {
    min-height: 100vh;
    font-family: 'Urbanist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: ${Colors.LovableForeground};
    background: ${Colors.LovableBackground};
    -webkit-font-smoothing: antialiased;
  }

  a { color: ${Colors.LovablePrimary}; text-decoration: none; }
  a:hover { text-decoration: underline; }

  input, button, textarea, select { font: inherit; }

  textarea.de-input,
  select.de-input {
    resize: vertical;
    min-height: 44px;
  }

  .de-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 24px 16px;
    background: ${Colors.LovableBackground};
  }

  .de-card {
    width: 100%;
    max-width: ${Layout.cardMaxWidth}px;
    background: ${Colors.LovableCard};
    border-radius: 16px;
    padding: 24px 20px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid ${Colors.LovableBorder};
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .de-page--login {
    justify-content: flex-start;
    padding-top: 48px;
    background: ${Colors.LovableBackground};
    min-height: 100vh;
  }

  .de-page--login-mobile {
    justify-content: flex-start;
    align-items: center;
    padding: 24px 16px 32px;
    background: ${Colors.LovableBackground};
    min-height: 100vh;
  }

  .de-login-mobile {
    width: 100%;
    max-width: 358px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .de-login-mobile__logo {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .de-login-card--front {
    width: 100%;
    margin-top: 0;
    background: ${Colors.Blanco};
    border-radius: 12px;
    padding: 24px 16px;
    box-shadow: 0 3px 4.65px rgba(0, 0, 0, 0.12);
    border: none;
    gap: 24px;
  }

  .de-login-social {
    width: 100%;
    max-width: 358px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .de-input--underline {
    border: none;
    border-bottom: 1.5px solid ${Colors.Line};
    border-radius: 0;
    padding: 16px 8px;
    background: transparent;
    box-shadow: none;
  }

  .de-input--underline:focus {
    border-bottom-color: ${Colors.NightBlue_600};
    box-shadow: none;
  }

  .de-password-field {
    position: relative;
  }

  .de-password-field .de-input--underline {
    padding-right: 40px;
  }

  .de-password-toggle {
    position: absolute;
    right: 4px;
    bottom: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: ${Colors.NightBlue_600};
    cursor: pointer;
    padding: 4px;
  }

  .de-btn-pill-primary {
    width: 100%;
    height: 50px;
    border: none;
    border-radius: 50px;
    background: ${Colors.NightBlue_600};
    color: white;
    font-weight: 700;
    font-size: ${FontSizes.medium_19}px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .de-btn-pill-primary:hover:not(:disabled) { background: ${Colors.NightBlue_700}; }
  .de-btn-pill-primary:disabled {
    background: ${Colors.NightBlue_300};
    opacity: 0.7;
    cursor: not-allowed;
  }

  .de-btn-pill-secondary {
    width: 100%;
    height: 50px;
    border: 1px solid ${Colors.NightBlue_600};
    border-radius: 50px;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-weight: 700;
    font-size: ${FontSizes.medium_19}px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .de-btn-pill-secondary:hover { background: ${Colors.NightBlue_200}; }

  .de-login-demo-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    border: none;
    background: none;
    color: ${Colors.NightBlue_600};
    font-size: ${FontSizes.small_14}px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
  }

  .de-login-demo-link:hover { text-decoration: underline; }

  .de-login-demo-sheet {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    background: rgba(1, 14, 21, 0.45);
    padding: 16px;
  }

  .de-login-demo-sheet__panel {
    width: 100%;
    max-width: 420px;
    background: ${Colors.Blanco};
    border-radius: 20px 20px 12px 12px;
    padding: 20px 16px 24px;
    box-shadow: ${Shadows.float};
  }

  .de-login-demo-sheet__title {
    margin: 0 0 4px;
    font-size: ${FontSizes.large}px;
    font-weight: 800;
    color: ${Colors.LovableForeground};
  }

  .de-login-demo-sheet__subtitle {
    margin: 0 0 16px;
    font-size: ${FontSizes.small_14}px;
    color: ${Colors.LovableMuted};
    line-height: 1.45;
  }

  .de-login-demo-sheet__list {
    display: grid;
    gap: 10px;
    margin-bottom: 16px;
  }

  .de-login-demo-sheet__item {
    width: 100%;
    text-align: left;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 12px;
    background: ${Colors.LovableBackground};
    padding: 12px 14px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }

  .de-login-demo-sheet__item:hover {
    border-color: ${Colors.NightBlue_500};
    background: ${Colors.NightBlue_200};
  }

  .de-login-demo-sheet__item strong {
    display: block;
    font-size: ${FontSizes.small_14}px;
    color: ${Colors.LovableForeground};
    margin-bottom: 2px;
  }

  .de-login-demo-sheet__item span {
    font-size: ${FontSizes.small_13}px;
    color: ${Colors.LovableMuted};
  }

  .de-oauth-row--pill {
    margin-top: 0;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    max-width: 100%;
    justify-content: center;
  }

  .de-oauth-btn--pill {
    border-radius: 50px;
    height: 44px;
    flex: 1 1 0;
    min-width: 0;
  }

  .de-divider-row--login {
    margin-top: 0;
    max-width: 358px;
  }

  .de-page--signup {
    min-height: 100vh;
    background: ${Colors.LovableBackground};
    display: flex;
    flex-direction: column;
    padding-bottom: 32px;
  }

  .de-signup-header {
    padding: 24px 20px 0;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
  }

  .de-signup-back {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    border: none;
    background: none;
    color: ${Colors.LovablePrimary};
    font-weight: 600;
    font-size: ${FontSizes.small_14}px;
    cursor: pointer;
    padding: 0;
  }

  .de-signup-progress {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .de-signup-progress__track {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: ${Colors.LovablePrimaryLight};
    overflow: hidden;
  }

  .de-signup-progress__fill {
    height: 100%;
    border-radius: 999px;
    background: ${Colors.LovablePrimary};
    transition: width 0.4s ease;
  }

  .de-signup-progress__label {
    color: ${Colors.LovablePrimary};
    font-weight: 700;
    font-size: ${FontSizes.small_14}px;
    min-width: 36px;
    text-align: right;
  }

  .de-signup-intro {
    padding: 16px 20px 0;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
  }

  .de-signup-intro h1 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    color: ${Colors.LovablePrimary};
    line-height: 1.1;
  }

  .de-signup-intro p {
    margin: 8px 0 0;
    font-size: ${FontSizes.medium}px;
    font-weight: 600;
    color: ${Colors.LovableForeground};
    line-height: 1.35;
  }

  .de-signup-body {
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .de-signup-social {
    margin-top: 12px;
  }

  .de-signup-social .de-oauth-row--pill {
    max-width: none;
  }

  .de-divider-row--signup {
    margin: 20px 0 16px;
    max-width: none;
  }

  .de-divider-row--signup .de-divider-text {
    font-size: ${FontSizes.small_14}px;
    color: ${Colors.LovableForeground};
    font-weight: 600;
    white-space: normal;
    text-align: center;
  }

  .de-signup-card {
    background: ${Colors.Blanco};
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .de-signup-avatar-wrap {
    display: flex;
    justify-content: center;
  }

  .de-signup-avatar-btn {
    position: relative;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    border: none;
    background: ${Colors.Grey_04};
    overflow: hidden;
    cursor: pointer;
    padding: 0;
  }

  .de-signup-avatar-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .de-signup-avatar-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(1, 14, 21, 0.18);
    color: white;
  }

  .de-signup-phone-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    border-bottom: 1.5px solid ${Colors.Line};
    padding-bottom: 2px;
  }

  .de-signup-phone-row:focus-within {
    border-bottom-color: ${Colors.NightBlue_600};
  }

  .de-signup-country-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: none;
    background: none;
    color: ${Colors.LovableForeground};
    font-weight: 600;
    font-size: ${FontSizes.small_14}px;
    cursor: pointer;
    padding: 16px 0 10px;
    white-space: nowrap;
  }

  .de-signup-country-menu {
    position: absolute;
    z-index: 20;
    margin-top: 8px;
    width: min(288px, calc(100vw - 40px));
    background: ${Colors.Blanco};
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 12px;
    box-shadow: ${Shadows.float};
    padding: 12px;
    max-height: 260px;
    overflow: auto;
  }

  .de-signup-country-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    border: none;
    background: none;
    text-align: left;
    padding: 10px;
    border-radius: 10px;
    cursor: pointer;
    color: ${Colors.LovableForeground};
  }

  .de-signup-country-item:hover {
    background: ${Colors.LovableBackground};
  }

  .de-signup-country-wrap {
    position: relative;
  }

  .de-signup-phone-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: 16px 0 10px;
    font-size: ${FontSizes.small_14}px;
    color: ${Colors.LovableForeground};
  }

  .de-signup-phone-input::placeholder {
    color: ${Colors.LovableMuted};
  }

  .de-signup-username-wrap {
    position: relative;
  }

  .de-signup-username-wrap .de-input--underline {
    padding-right: 36px;
  }

  .de-signup-username-check {
    position: absolute;
    right: 0;
    bottom: 12px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid ${Colors.LovablePrimary};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${Colors.LovablePrimary};
  }

  .de-signup-terms {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 0 4px;
  }

  .de-signup-terms input {
    margin-top: 3px;
    width: 18px;
    height: 18px;
    accent-color: ${Colors.LovablePrimary};
  }

  .de-signup-terms span {
    font-size: 15px;
    line-height: 1.35;
    color: ${Colors.LovableForeground};
  }

  .de-signup-terms button {
    border: none;
    background: none;
    padding: 0;
    color: ${Colors.LovablePrimary};
    font-weight: 700;
    text-decoration: underline;
    cursor: pointer;
  }

  .de-signup-submit {
    margin-top: 4px;
  }

  .de-signup-submit .de-btn-pill-primary {
    box-shadow: 0 3px 8px rgba(90, 88, 235, 0.25);
  }

  .de-terms-dialog {
    position: fixed;
    inset: 0;
    z-index: 1300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(1, 14, 21, 0.45);
  }

  .de-terms-dialog__panel {
    width: 100%;
    max-width: 480px;
    max-height: 85vh;
    background: ${Colors.Blanco};
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: ${Shadows.float};
  }

  .de-terms-dialog__header {
    padding: 20px 20px 8px;
    border-bottom: 1px solid ${Colors.LovableBorder};
  }

  .de-terms-dialog__header h3 {
    margin: 0;
    font-size: ${FontSizes.large}px;
    color: ${Colors.LovablePrimary};
  }

  .de-terms-dialog__header p {
    margin: 4px 0 0;
    font-size: ${FontSizes.small}px;
    color: ${Colors.LovableMuted};
  }

  .de-terms-dialog__body {
    padding: 16px 20px;
    overflow: auto;
    font-size: ${FontSizes.small_14}px;
    line-height: 1.5;
    color: ${Colors.LovableForeground};
  }

  .de-terms-dialog__footer {
    padding: 16px 20px 20px;
    border-top: 1px solid ${Colors.LovableBorder};
  }

  .de-page--auth-shell {
    padding-top: 24px;
    padding-bottom: 32px;
  }

  .de-auth-shell {
    width: 100%;
    max-width: 960px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }

  @media (min-width: 860px) {
    .de-auth-shell {
      grid-template-columns: 1fr 1fr;
      align-items: start;
      gap: 32px;
    }
  }

  .de-auth-shell__hero {
    border-radius: 24px;
    padding: 28px 24px;
    background: ${Gradients.brand};
    color: #fff;
    box-shadow: ${Shadows.card};
  }

  .de-auth-shell__hero h1 {
    font-size: 34px;
    font-weight: 800;
    margin: 0 0 12px;
    letter-spacing: -0.03em;
  }

  .de-auth-shell__hero h1 span { opacity: .9; }

  .de-auth-shell__hero p {
    margin: 0;
    line-height: 1.6;
    opacity: .95;
    font-size: 15px;
  }

  .de-auth-shell__badge {
    display: inline-block;
    margin-bottom: 12px;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,.16);
    font-size: 12px;
    font-weight: 700;
  }

  .de-auth-shell__features {
    list-style: none;
    margin: 20px 0 0;
    padding: 0;
    display: grid;
    gap: 10px;
    font-size: 14px;
    font-weight: 600;
  }

  .de-auth-shell__card h2 {
    margin: 0 0 4px;
    font-size: 22px;
    font-weight: 800;
  }

  .de-auth-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .de-auth-phone-row {
    display: grid;
    grid-template-columns: 92px 1fr;
    gap: 8px;
    align-items: end;
  }

  .de-terms-check {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    color: ${Colors.LovableMuted};
    line-height: 1.45;
  }

  .de-terms-check input { margin-top: 3px; }

  .de-login-hero {
    width: 100%;
    max-width: ${Layout.cardMaxWidth}px;
    text-align: center;
    margin-bottom: 24px;
  }

  .de-brand-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: ${Colors.LovableForeground};
    margin-bottom: 16px;
  }

  .de-brand-title span { color: ${Colors.LovablePrimary}; }

  .de-login-welcome {
    font-size: ${FontSizes.extraLarge}px;
    font-weight: 700;
    color: ${Colors.LovableForeground};
    margin-bottom: 8px;
  }

  .de-login-subtitle {
    font-size: ${FontSizes.small_14}px;
    color: ${Colors.LovableMuted};
    line-height: 1.5;
  }

  .de-login-logo {
    width: 218px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px;
  }

  .de-card--lovable {
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid ${Colors.LovableBorder};
    gap: 16px;
    padding: 24px 20px;
  }

  .de-login-card { margin-top: 0; }

  .de-input--bordered {
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 8px;
    padding: 10px 12px;
    background: ${Colors.LovableBackground};
    font-size: ${FontSizes.small_14}px;
  }

  .de-input--bordered:focus {
    border-color: ${Colors.LovablePrimary};
    box-shadow: 0 0 0 2px ${Colors.LovablePrimaryLight};
  }

  .de-btn-primary--lovable {
    height: 44px;
    border-radius: 8px;
    background: ${Colors.LovablePrimary};
    font-weight: 600;
  }

  .de-btn-primary--lovable:hover:not(:disabled) { background: #4A48D4; }

  .de-btn-secondary--lovable {
    height: 44px;
    border-radius: 8px;
    border-color: ${Colors.LovablePrimary};
    color: ${Colors.LovablePrimary};
    font-weight: 600;
  }

  .de-label--lovable {
    font-size: ${FontSizes.small_13}px;
    font-weight: 600;
    color: ${Colors.LovableForeground};
  }

  .de-link-btn { display: block; width: 100%; text-decoration: none; }
  .de-link-btn:hover { text-decoration: none; }

  .de-forgot-wrap {
    display: flex;
    justify-content: center;
    margin: 10px 0;
  }

  .de-divider-text {
    font-weight: 500;
    font-size: ${FontSizes.medium}px;
    line-height: 22px;
    text-align: center;
    color: ${Colors.LovableMuted};
    white-space: nowrap;
    padding: 0 15px;
  }

  .de-full-container {
    width: 100%;
    max-width: ${Layout.maxContentWidth}px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .de-field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .de-label {
    font-weight: 600;
    font-size: ${FontSizes.small_13}px;
    line-height: 17px;
    color: ${Colors.LovableForeground};
  }

  .de-input {
    width: 100%;
    font-weight: 500;
    font-size: ${FontSizes.small_14}px;
    line-height: 22px;
    color: ${Colors.LovableForeground};
    padding: 10px 12px;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 8px;
    background: ${Colors.LovableBackground};
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .de-input:focus {
    border-color: ${Colors.LovablePrimary};
    box-shadow: 0 0 0 2px ${Colors.LovablePrimaryLight};
  }
  .de-input::placeholder { color: ${Colors.LovableMuted}; }

  .de-btn-primary {
    width: 100%;
    height: 44px;
    border: none;
    border-radius: 8px;
    background: ${Colors.LovablePrimary};
    color: white;
    font-weight: 600;
    font-size: ${FontSizes.small_14}px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .de-btn-primary:hover:not(:disabled) { background: #4A48D4; }
  .de-btn-primary:disabled { background: ${Colors.NightBlue_300}; opacity: 0.7; cursor: not-allowed; }

  .de-btn-secondary {
    width: 100%;
    height: 44px;
    border: 1px solid ${Colors.LovablePrimary};
    border-radius: 8px;
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-weight: 600;
    font-size: ${FontSizes.small_14}px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .de-btn-secondary:hover { background: ${Colors.LovablePrimaryLight}; }

  .de-link { color: ${Colors.LovablePrimary}; text-decoration: underline; cursor: pointer; background: none; border: none; font-size: inherit; }

  .de-divider-row {
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    max-width: ${Layout.cardMaxWidth}px;
    margin-top: 24px;
  }

  .de-divider-line { flex: 1; height: 1px; background: ${Colors.Grey_04}; }

  .de-oauth-row {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: ${Layout.cardMaxWidth}px;
    margin-top: 24px;
  }

  .de-oauth-btn {
    flex: 1;
    height: 44px;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 8px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: box-shadow 0.2s;
  }

  .de-oauth-btn:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
  .de-oauth-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
  .de-oauth-row--single { max-width: ${Layout.cardMaxWidth}px; }
  .de-oauth-btn--google { background: ${Colors.Blanco}; border-color: ${Colors.Line}; }
  .de-oauth-btn--facebook { background: ${Colors.Azul_Facebook}; color: white; border-color: ${Colors.Azul_Facebook}; }
  .de-oauth-btn--apple { background: ${Colors.Negro}; color: white; border-color: ${Colors.Negro}; }

  .de-wall {
    min-height: 100vh;
    background: ${Colors.LovableBackground};
  }

  .de-safe-top {
    height: env(safe-area-inset-top, 0px);
    background: ${Colors.Grey_Top};
  }

  .de-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: ${Colors.LovableBackground};
    max-width: ${Layout.mobileFrame}px;
    margin: 0 auto;
    box-shadow: 0 0 0 1px ${Colors.LovableBorder};
  }

  .de-app-main {
    flex: 1;
    padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  }

  .de-page--enrollment {
    justify-content: flex-start;
    padding: 0 0 32px;
    min-height: 100vh;
    background: ${Colors.LovableBackground};
  }

  .de-page--enrollment .de-card {
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid ${Colors.LovableBorder};
  }

  .de-page--enrollment .de-preference-tag {
    border-radius: 999px;
    background: ${Colors.LovableAccent};
    color: ${Colors.LovablePrimary};
  }

  .de-page--enrollment .de-preference-tag--selected {
    background: ${Colors.LovablePrimary};
    color: white;
  }

  .de-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0 24px;
    width: 100%;
  }

  .de-progress__track {
    flex: 1;
    height: 4px;
    border-radius: 20px;
    background: ${Colors.NightBlue_200};
    overflow: hidden;
  }

  .de-progress__fill {
    height: 100%;
    border-radius: 20px;
    background: ${Colors.NightBlue_800};
    transition: width 0.4s ease;
  }

  .de-progress__label {
    font-size: ${FontSizes.medium}px;
    font-weight: 500;
    color: ${Colors.TexColor};
    min-width: 36px;
    text-align: right;
  }

  .de-enrollment-heading {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .de-enrollment-heading h2 {
    font-size: ${FontSizes.extraLarge}px;
    font-weight: 700;
    line-height: 29px;
    letter-spacing: 0.01em;
    color: ${Colors.NightBlue_800};
  }

  .de-enrollment-heading p,
  .de-enrollment-subtitle {
    font-size: ${FontSizes.medium}px;
    font-weight: 600;
    line-height: 24px;
    letter-spacing: 0.0044em;
    color: ${Colors.TexColor};
  }

  .de-card--compact {
    padding: 10px;
    gap: 0;
  }

  .de-preference-tags {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    margin: 10px 5px;
  }

  .de-preference-tag {
    height: 43px;
    border: none;
    border-radius: 50px;
    padding: 0 18px;
    margin: 10px 3px 0;
    font-size: ${FontSizes.medium}px;
    font-weight: 700;
    line-height: 19px;
    cursor: pointer;
    background: ${Colors.NightBlue_200};
    color: ${Colors.NightBlue_600};
    transition: background 0.15s ease, color 0.15s ease;
  }

  .de-preference-tag--selected {
    background: ${Colors.NightBlue_600};
    color: ${Colors.Blanco};
  }

  .de-preference-tag:active {
    opacity: 0.9;
  }

  .de-gustos-tags-card {
    min-height: 120px;
  }

  .de-gustos-questions-card {
    margin-top: 12px;
  }

  .de-gustos-selected-hint {
    font-size: ${FontSizes.small_13}px;
    color: ${Colors.LovablePrimary};
    font-weight: 600;
    margin: 8px 4px 0;
    text-align: center;
  }

  .de-gustos-hint {
    font-size: ${FontSizes.small_13}px;
    color: ${Colors.LovableMuted};
    margin: 8px 4px 0;
    text-align: left;
  }

  .de-gustos-hint--center {
    text-align: center;
    margin-top: 12px;
  }

  .de-gustos-banner {
    border-radius: 12px;
    padding: 12px 16px;
    margin-bottom: 12px;
    font-size: ${FontSizes.small_14}px;
    font-weight: 600;
    text-align: center;
  }

  .de-gustos-banner--info {
    background: #FEF3C7;
    color: #92400E;
    border: 1px solid #FDE68A;
  }

  .de-gustos-banner--success {
    background: #D1FAE5;
    color: #065F46;
    border: 1px solid #A7F3D0;
  }

  .de-btn-primary--lovable:disabled {
    background: ${Colors.NightBlue_300};
    opacity: 0.7;
    cursor: not-allowed;
  }

  .de-enrollment-questions {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 8px;
  }

  .de-enrollment-questions--in-card {
    padding: 4px 0;
    margin-top: 0;
  }

  .de-enrollment-question__label {
    font-size: ${FontSizes.medium}px;
    font-weight: 600;
    line-height: 24px;
    color: ${Colors.TexColor};
    margin-bottom: 8px;
  }

  .de-enrollment-question__options {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .de-enrollment-radio {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding-right: 12px;
  }

  .de-enrollment-radio input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .de-enrollment-radio__control {
    width: 22px;
    height: 22px;
    border: 2px solid ${Colors.NightBlue_600};
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .de-enrollment-radio input:checked + .de-enrollment-radio__control::after {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${Colors.NightBlue_600};
  }

  .de-enrollment-radio__text {
    font-size: ${FontSizes.medium}px;
    font-weight: 500;
    color: ${Colors.TexColor};
  }

  .de-enrollment-actions {
    margin: 30px auto 0;
    width: 100%;
    max-width: 330px;
    min-width: 320px;
  }

  .de-enrollment-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    text-align: center;
    padding: 24px 0 40px;
  }

  .de-enrollment-success h2 {
    font-size: 34px;
    font-weight: 700;
    line-height: 41px;
    letter-spacing: 0.01em;
    color: ${Colors.Negro};
  }

  .de-enrollment-success__lead {
    font-size: ${FontSizes.large}px;
    font-weight: 700;
    line-height: 24px;
    color: ${Colors.NightBlue_800};
  }

  .de-enrollment-success__body {
    font-size: ${FontSizes.large}px;
    font-weight: 700;
    line-height: 24px;
    color: ${Colors.NightBlue_800};
  }

  /* ── Wall hero ── */
  /* ── Feed hero (Lovable gradient header) ── */
  .de-feed-hero {
    position: relative;
    overflow: hidden;
    background: ${Gradients.hero};
    color: #fff;
    padding: 20px 16px 64px;
    border-radius: 0 0 24px 24px;
  }

  .de-feed-hero--compact {
    padding-bottom: 24px;
  }

  .de-feed-hero__blob {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    filter: blur(48px);
    pointer-events: none;
  }

  .de-feed-hero__blob--tr { width: 160px; height: 160px; top: -48px; right: -48px; }
  .de-feed-hero__blob--bl { width: 140px; height: 140px; bottom: -60px; left: -32px; }

  .de-feed-hero__inner { position: relative; z-index: 1; }

  .de-feed-hero__location-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .de-feed-hero__location-main {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  .de-feed-hero__location-text {
    min-width: 0;
    flex: 1;
  }

  .de-feed-hero__pin {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .de-feed-hero__pin svg { width: 16px; height: 16px; }

  .de-feed-hero__location-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }

  .de-feed-hero__location-value {
    margin: 2px 0 0;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-feed-hero__change-btn {
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    flex-shrink: 0;
    font-family: inherit;
  }

  .de-feed-hero__greeting {
    margin-top: 14px;
  }

  .de-feed-hero__greeting h1 {
    font-size: 22px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .de-feed-hero__greeting p {
    margin: 4px 0 0;
    font-size: 13px;
    line-height: 1.35;
    color: rgba(255, 255, 255, 0.85);
  }

  .de-feed-hero__search {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    color: ${Colors.LovableForeground};
    padding: 10px 12px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }

  .de-feed-hero__search span {
    flex: 1;
    font-size: 13px;
    color: ${Colors.LovableMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-feed-hero__stats {
    margin-top: 10px;
    display: none;
  }

  .de-feed-hero__stats--compact {
    display: block;
  }

  .de-feed-hero__stats--compact .de-feed-hero__stat {
    display: inline-block;
    padding: 6px 10px;
  }

  .de-feed-hero__stats--compact .de-feed-hero__stat strong {
    font-size: 14px;
    display: inline;
    margin-right: 6px;
  }

  .de-feed-hero__stats--compact .de-feed-hero__stat span {
    display: inline;
    font-size: 10px;
    margin: 0;
  }

  .de-feed-hero__stat {
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(8px);
    padding: 12px 14px;
  }

  .de-feed-hero__stat strong {
    display: block;
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .de-feed-hero__stat span {
    display: block;
    margin-top: 4px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: rgba(255, 255, 255, 0.7);
  }

  .de-feed-hero__edit {
    margin-top: 12px;
    display: flex;
    gap: 8px;
  }

  .de-feed-hero__edit input {
    flex: 1;
    border: none;
    border-radius: 12px;
    padding: 10px 12px;
    font-family: inherit;
    font-size: 13px;
  }

  .de-feed-hero__edit button {
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    font-weight: 700;
    padding: 10px 14px;
    cursor: pointer;
    font-family: inherit;
  }

  .de-feed-categories-card {
    margin: -16px 16px 0;
    position: relative;
    z-index: 2;
    background: ${Colors.LovableCard};
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 20px;
    padding: 14px 12px 12px;
    box-shadow: ${Shadows.card};
    overflow: hidden;
  }

  .de-feed-categories-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .de-feed-categories-card__header h2 {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
  }

  .de-feed-categories-card__header button {
    border: none;
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  /* ── Categories ── */
  .de-categories {
    padding: 16px 0 8px;
  }

  .de-categories--events {
    padding: 16px 0 4px;
  }

  .de-categories__title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: ${Colors.LovableForeground};
    margin: 0 0 12px 16px;
  }

  .de-categories__scroll {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding: 0 16px 8px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .de-categories__scroll::-webkit-scrollbar { display: none; }

  .de-categories__grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 4px;
    width: 100%;
    overflow: hidden;
  }

  .de-categories__grid .de-category-item {
    flex: none;
    width: 100%;
    min-width: 0;
  }

  .de-category-item {
    flex: 0 0 80px;
    scroll-snap-align: start;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0;
    font-family: inherit;
  }

  .de-category-item:active .de-category-item__avatar { transform: scale(0.95); }

  .de-category-item__avatar {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: ${Shadows.card};
    transition: transform 0.15s;
  }

  .de-categories__grid .de-category-item__avatar {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: none;
    margin: 0 auto;
  }

  .de-categories__grid .de-category-item__label {
    font-size: 10px;
    line-height: 1.1;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-category-item__img { width: 100%; height: 100%; object-fit: cover; }

  .de-category-item__placeholder {
    width: 100%;
    height: 100%;
    background: ${Colors.LovablePrimarySoft};
  }

  .de-category-item__label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(23, 27, 46, 0.8);
    text-align: center;
    line-height: 1.2;
  }

  .de-categories__grid .de-category-item__label {
    font-size: 11px;
    font-weight: 500;
    color: ${Colors.LovableMuted};
  }

  .de-category-item--active .de-category-item__avatar {
    box-shadow: 0 0 0 3px ${Colors.LovablePrimary};
  }

  .de-category-item--active .de-category-item__label {
    color: ${Colors.LovablePrimary};
    font-weight: 700;
  }

  .de-category-item__emoji {
    font-size: 24px;
    line-height: 1;
  }

  .de-categories__grid .de-category-item__emoji { font-size: 20px; }

  /* ── Events tabs (pill style) ── */
  .de-events-tabs-wrap {
    margin-top: 20px;
  }

  .de-events-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 0 16px 4px;
    scrollbar-width: none;
  }

  .de-events-tabs::-webkit-scrollbar { display: none; }

  .de-events-tab {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    border: 1px solid ${Colors.LovableBorder};
    background: ${Colors.LovableCard};
    color: rgba(23, 27, 46, 0.8);
    font-size: 12px;
    font-weight: 600;
    padding: 8px 14px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }

  .de-events-tab--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Gradients.brand};
    color: #fff;
    box-shadow: ${Shadows.card};
  }

  .de-events-tab__count {
    border-radius: 999px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
    background: ${Colors.LovableSurfaceMuted};
    color: rgba(23, 27, 46, 0.7);
  }

  .de-events-tab--active .de-events-tab__count {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .de-events-section-head {
    padding: 20px 16px 0;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  .de-events-section-head h2 {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1.15;
  }

  .de-events-section-head p {
    margin: 4px 0 0;
    font-size: 14px;
    color: ${Colors.LovableMuted};
  }

  .de-events-section-head__action {
    border: none;
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
  }

  .de-events-section-head__create {
    border: none;
    border-radius: 999px;
    background: ${Gradients.brand};
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 12px;
    cursor: pointer;
    box-shadow: ${Shadows.card};
    font-family: inherit;
  }

  .de-empty-state--padded {
    padding: 24px 16px;
  }

  .de-event-list {
    list-style: none;
    padding: 12px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-events-toolbar {
    display: flex;
    gap: 8px;
    padding: 0 16px 12px;
    flex-wrap: wrap;
  }

  .de-events-toolbar__btn {
    border: 1px solid ${Colors.NightBlue_600};
    background: #fff;
    color: ${Colors.NightBlue_600};
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .de-events-toolbar__btn--active {
    background: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-events-toolbar__btn--ghost {
    border-color: ${Colors.LovableBorder};
    color: #6B7280;
  }

  .de-user-avatar {
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    background: ${Colors.NightBlue_200};
    color: ${Colors.NightBlue_800};
    font-weight: 700;
  }

  .de-user-avatar--img {
    object-fit: cover;
    background: #e5e7eb;
  }

  .de-user-avatar--placeholder {
    background: #dfe3e8;
    color: #8a8d91;
  }

  .de-feed-location {
    margin: 0 16px 8px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #EEF2FF;
    color: ${Colors.NightBlue_800};
    font-size: 13px;
  }

  .de-event-card-h--scroll {
    flex: 0 0 min(88vw, 320px);
    width: min(88vw, 320px);
    max-width: min(88vw, 320px);
    scroll-snap-align: start;
    margin-bottom: 0;
  }

  .de-wall-scroll--rows {
    align-items: stretch;
    padding: 0 16px 8px;
  }

  .de-rec-event-card {
    position: relative;
    flex: 0 0 78%;
    width: 78%;
    max-width: 304px;
    height: 288px;
    border: none;
    border-radius: 24px;
    overflow: hidden;
    padding: 0;
    cursor: pointer;
    scroll-snap-align: start;
    background: #111827;
    text-align: left;
    box-shadow: ${Shadows.card};
  }

  .de-rec-event-card__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .de-rec-event-card__img--placeholder {
    background: linear-gradient(135deg, #374151, #111827);
  }

  .de-rec-event-card__badges {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 2;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .de-rec-event-card__badge {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    color: ${Colors.LovableForeground};
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
  }

  .de-rec-event-card__overlay {
    position: absolute;
    inset: 0;
    background: ${Gradients.overlay};
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 16px;
    gap: 6px;
    pointer-events: none;
  }

  .de-rec-event-card__overlay-date {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    opacity: 0.9;
  }

  .de-rec-event-card__overlay strong {
    font-size: 18px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .de-rec-event-card__overlay-location {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    opacity: 0.9;
  }

  .de-rec-event-card--more {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #fff;
    border: 1px solid ${Colors.NightBlue_600};
    color: ${Colors.NightBlue_600};
    font-weight: 700;
  }

  .de-wall-section--carousel .de-wall-scroll {
    padding: 0 16px 12px;
  }

  .de-feed-location-bar {
    margin: 0 16px 12px;
    padding: 12px 14px;
    border-radius: 16px;
    background: #EEF2FF;
    border: 1px solid rgba(88, 86, 235, 0.15);
  }

  .de-feed-location-bar__main {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .de-feed-location-bar__icon {
    width: 22px;
    height: 22px;
    color: ${Colors.NightBlue_600};
    flex-shrink: 0;
  }

  .de-feed-location-bar__copy {
    flex: 1;
    min-width: 0;
  }

  .de-feed-location-bar__main strong {
    display: block;
    font-size: 13px;
    color: ${Colors.NightBlue_800};
  }

  .de-feed-location-bar__main p {
    margin: 2px 0 0;
    font-size: 12px;
    color: #4B5563;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-feed-location-bar__localize {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .de-feed-location-bar__localize:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .de-feed-location-bar__actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  .de-feed-location-bar__btn {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .de-feed-location-bar__btn--ghost {
    background: #fff;
    color: ${Colors.NightBlue_600};
    border: 1px solid ${Colors.NightBlue_600};
  }

  .de-feed-location-bar__edit {
    display: flex;
    gap: 8px;
    margin-top: 10px;
  }

  .de-feed-location-bar__edit input {
    flex: 1;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 12px;
    padding: 8px 10px;
    font-family: inherit;
  }

  .de-feed-location-bar__edit button {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 12px;
    padding: 8px 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-profile-settings {
    background: #fff;
    border-radius: 20px;
    padding: 8px;
    margin-bottom: 16px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  .de-profile-settings__subscription,
  .de-profile-settings__link,
  .de-profile-settings__item {
    width: 100%;
    border: none;
    background: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 12px;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    border-radius: 14px;
  }

  .de-profile-settings__subscription:hover,
  .de-profile-settings__link:hover {
    background: #F9FAFB;
  }

  .de-profile-settings__icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: #EEF2FF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .de-profile-settings__icon--gold {
    background: rgba(245, 179, 1, 0.15);
  }

  .de-profile-settings__text {
    flex: 1;
    min-width: 0;
  }

  .de-profile-settings__text small {
    display: block;
    color: #6B7280;
    font-size: 12px;
  }

  .de-profile-settings__text strong {
    font-size: 15px;
    color: ${Colors.Negro};
  }

  .de-profile-settings__badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .de-profile-settings__badge {
    font-style: normal;
    font-size: 11px;
    font-weight: 700;
    border-radius: 999px;
    padding: 4px 8px;
  }

  .de-profile-settings__badge--plan {
    background: #374151;
    color: #fff;
  }

  .de-profile-settings__badge--active {
    background: #DBEAFE;
    color: ${Colors.NightBlue_600};
  }

  .de-profile-settings__subscription-body {
    padding: 0 12px 12px;
    font-size: 13px;
    color: #4B5563;
    line-height: 1.5;
  }

  .de-profile-settings__subscription-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .de-profile-settings__notice {
    display: flex;
    gap: 10px;
    padding: 12px;
    margin: 4px 0;
    border-radius: 14px;
    background: #F5F3FF;
    color: #4B5563;
    font-size: 12px;
    line-height: 1.5;
  }

  .de-profile-settings__item-text {
    flex: 1;
    min-width: 0;
  }

  .de-profile-settings__item-text strong {
    display: block;
    font-size: 14px;
  }

  .de-profile-settings__item-text span {
    display: block;
    font-size: 12px;
    color: #6B7280;
    margin-top: 2px;
  }

  .de-profile-toggle {
    width: 48px;
    height: 28px;
    border-radius: 999px;
    border: none;
    background: #D1D5DB;
    padding: 3px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .de-profile-toggle span {
    display: block;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
  }

  .de-profile-toggle--on {
    background: ${Colors.NightBlue_600};
  }

  .de-profile-toggle--on span {
    transform: translateX(20px);
  }

  .de-profile-cover__hint {
    display: block;
    position: relative;
    z-index: 2;
    margin-top: 6px;
    font-size: 11px;
    color: rgba(255,255,255,0.88);
    text-align: center;
  }

  .de-form-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid ${Colors.LovableBorder};
  }

  .de-form-section h3 {
    margin: 0;
    font-size: 14px;
    color: ${Colors.NightBlue_800};
  }

  .de-bank-option,
  .de-bank-card {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    border: 1px solid ${Colors.LovableBorder};
    background: #fff;
    border-radius: 16px;
    padding: 14px;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }

  .de-bank-option__icon,
  .de-bank-card__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #EEF2FF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .de-bank-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .de-bank-list__title {
    margin: 12px 0 8px;
    font-size: 14px;
    color: ${Colors.NightBlue_800};
  }

  .de-bank-card {
    position: relative;
    cursor: default;
  }

  .de-bank-card__badge {
    position: absolute;
    top: 10px;
    left: 10px;
    font-size: 10px;
    font-weight: 700;
    background: #DCFCE7;
    color: #166534;
    border-radius: 999px;
    padding: 3px 8px;
  }

  .de-bank-card strong {
    display: block;
    font-size: 14px;
  }

  .de-bank-card span {
    display: block;
    font-size: 12px;
    color: #6B7280;
    margin-top: 2px;
  }

  .de-bank-card__menu {
    margin-left: auto;
    border: none;
    background: transparent;
    font-size: 18px;
    cursor: pointer;
  }

  .de-sheet--bank .de-sheet__subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6B7280;
    line-height: 1.4;
  }

  .de-search-page {
    padding-bottom: 120px;
  }

  .de-search-page__back {
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    padding: 0;
  }

  .de-search-tabs {
    display: flex;
    gap: 8px;
    padding: 0 16px 12px;
  }

  .de-search-tabs__btn {
    flex: 1;
    border: 1px solid ${Colors.NightBlue_600};
    background: #fff;
    color: ${Colors.NightBlue_600};
    border-radius: 999px;
    padding: 10px 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .de-search-tabs__btn--active {
    background: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-search-filters-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 0 16px 16px;
    width: calc(100% - 32px);
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 999px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .de-search-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 12px 16px;
    padding: 12px 14px;
    background: #fff;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 16px;
  }

  .de-search-input-wrap input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 14px;
    min-width: 0;
    font-family: inherit;
  }

  .de-search-user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid ${Colors.LovableBorder};
    cursor: pointer;
    background: #fff;
  }

  .de-search-user-card strong {
    display: block;
    font-size: 14px;
  }

  .de-search-user-card span {
    font-size: 12px;
    color: #6B7280;
  }

  .de-plan-pricing {
    background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%);
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .de-plan-pricing__fee {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 800;
    color: ${Colors.NightBlue_600};
  }

  .de-plan-pricing p {
    margin: 0 0 8px;
    font-size: 13px;
    color: #374151;
    line-height: 1.5;
  }

  .de-plan-pricing ul {
    margin: 0 0 8px;
    padding-left: 18px;
    font-size: 13px;
    color: #374151;
  }

  .de-plan-pricing a {
    color: ${Colors.NightBlue_600};
    font-weight: 700;
    text-decoration: underline;
  }

  /* ── Bottom nav (Lovable BottomNav + CreateFAB) ── */
  .de-bottom-dock {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 0;
    width: 100%;
    max-width: ${Layout.mobileFrame}px;
    z-index: 100;
    pointer-events: none;
  }

  .de-bottom-dock__nav,
  .de-bottom-dock__fab,
  .de-bottom-dock__options,
  .de-bottom-dock__options .de-fab-option {
    pointer-events: auto;
  }

  .de-bottom-dock__options {
    position: fixed;
    right: max(16px, calc(50% - ${Layout.mobileFrame / 2}px + 16px));
    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    z-index: 101;
  }

  .de-bottom-dock__nav {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    width: calc(100% - 88px);
    max-width: 340px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 4px;
    padding: 8px 10px;
    background: ${Colors.LovableNavPill};
    border-radius: 999px;
    box-shadow: ${Shadows.nav};
    z-index: 100;
    transition: opacity 0.3s cubic-bezier(0.55, 0, 1, 0.45), transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .de-bottom-dock__nav--entering {
    animation: de-float-nav-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .de-bottom-dock__nav--leaving {
    animation: de-float-nav-out 0.3s cubic-bezier(0.55, 0, 1, 0.45) forwards;
  }

  .de-bottom-dock__fab {
    position: fixed;
    right: max(16px, calc(50% - ${Layout.mobileFrame / 2}px + 16px));
    bottom: calc(16px + env(safe-area-inset-bottom, 0px));
    width: 56px;
    height: 56px;
    border: none;
    border-radius: 999px;
    background: ${Colors.LovableNavPill};
    color: #fff;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    box-shadow: ${Shadows.nav};
    z-index: 101;
    transition: transform 0.2s, box-shadow 0.2s, opacity 0.3s;
  }

  .de-bottom-dock__fab:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px -8px rgba(105, 121, 248, 0.5);
  }

  .de-bottom-dock__fab--entering {
    animation: de-fab-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.08s forwards;
    opacity: 0;
  }

  .de-bottom-dock__fab--leaving {
    animation: de-fab-out 0.3s cubic-bezier(0.55, 0, 1, 0.45) forwards;
  }

  .de-bottom-nav {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    width: calc(100% - 72px);
    max-width: 300px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    gap: 2px;
    padding: 8px 10px;
    background: linear-gradient(90deg, ${Colors.NightBlue_600} 0%, ${Colors.NightBlue_800} 100%);
    border-radius: 20px;
    border: none;
    box-shadow: 0 8px 24px rgba(81, 94, 192, 0.35);
    z-index: 100;
  }

  .de-bottom-nav__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 6px 12px;
    border-radius: 16px;
    text-decoration: none;
    min-width: 0;
    min-height: 44px;
    transition: background 0.2s, color 0.2s;
    color: rgba(255, 255, 255, 0.8);
  }

  .de-bottom-nav__item--active {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  .de-bottom-nav__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    flex-shrink: 0;
  }

  .de-bottom-nav__label {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    color: inherit;
  }

  /* ── Wall sections ── */
  .de-wall-main {
    max-width: ${Layout.maxContentWidth}px;
    margin: 0 auto;
    padding: 0 0 24px;
  }

  .de-wall-refresh-hint {
    margin: 8px 16px 0;
    font-size: 12px;
    color: ${Colors.Grey_Soft};
    text-align: center;
  }

  .de-wall-section {
    margin-top: 30px;
    padding: 0 16px;
  }

  .de-wall-section__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    gap: 12px;
  }

  .de-wall-section__title {
    font-size: 20px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: ${Colors.LovableForeground};
  }

  .de-wall-section__subtitle {
    margin: 4px 0 0;
    font-size: 14px;
    color: ${Colors.LovableMuted};
    font-weight: 400;
  }

  .de-wall-section__more {
    height: auto;
    padding: 0;
    border: none;
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
  }

  .de-wall-scroll {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 8px;
    scroll-snap-type: x mandatory;
  }

  .de-wall-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* ── Event card vertical (Figma 171×357) ── */
  .de-event-card {
    flex: 0 0 ${Layout.eventCardVerticalWidth}px;
    width: ${Layout.eventCardVerticalWidth}px;
    max-width: ${Layout.eventCardVerticalWidth}px;
    min-height: ${Layout.eventCardVerticalHeight}px;
    scroll-snap-align: start;
    border: none;
    background: #FBFBFB;
    border-radius: 12px;
    box-shadow: 0 3px 4.65px rgba(0,0,0,0.27);
    overflow: hidden;
    text-align: left;
    cursor: pointer;
    padding: 0;
    margin: 0 5px 15px 0;
    transition: transform 0.15s ease;
  }

  .de-event-card:active { background: ${Colors.MidnightDreams_300}; }
  .de-event-card:hover { transform: translateY(-2px); }

  .de-event-card__image-wrap { width: 100%; height: 152px; }

  .de-event-card__image {
    width: 100%;
    height: 152px;
    object-fit: cover;
    display: block;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }

  .de-event-card__image--placeholder { background: ${Colors.NightBlue_200}; }

  .de-event-card__body { padding: 12px 8px 16px; }

  .de-event-card__title {
    font-size: 14px;
    font-weight: 600;
    color: ${Colors.Negro};
    margin-bottom: 8px;
    line-height: 17px;
  }

  .de-event-card__date {
    font-size: 12px;
    font-weight: 500;
    color: ${Colors.Negro};
    margin-bottom: 4px;
    line-height: 15px;
  }

  .de-event-card__location {
    font-size: 10px;
    font-weight: 500;
    color: ${Colors.Grey_Soft};
    margin-bottom: 4px;
    line-height: 14px;
  }

  .de-event-card__desc {
    font-size: 10px;
    font-weight: 500;
    color: ${Colors.Grey_07};
    line-height: 14px;
    letter-spacing: 0.015em;
    margin-top: 8px;
  }

  .de-event-card--lovable {
    background: ${Colors.LovableCard};
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 18px;
    box-shadow: 0 8px 24px rgba(23, 27, 46, 0.08);
  }

  .de-event-card--lovable .de-event-card__image-wrap {
    height: 168px;
    position: relative;
  }

  .de-event-card--lovable .de-event-card__image {
    height: 168px;
    border-radius: 0;
  }

  .de-event-card__badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(105, 121, 248, 0.9);
    backdrop-filter: blur(4px);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
  }

  /* ── Event card horizontal (Figma 358×155) ── */
  .de-event-card-h {
    display: flex;
    width: 100%;
    gap: 12px;
    border: none;
    background: ${Colors.LovableCard};
    border-radius: 24px;
    box-shadow: ${Shadows.card};
    overflow: hidden;
    text-align: left;
    cursor: pointer;
    padding: 12px;
    margin-bottom: 0;
    font-family: inherit;
  }

  .de-event-card-h:active { opacity: 0.92; }

  .de-event-card-h--scroll {
    flex: 0 0 min(88vw, 320px);
    width: min(88vw, 320px);
    max-width: min(88vw, 320px);
  }

  .de-event-card-h__image-wrap {
    position: relative;
    flex: 0 0 96px;
    width: 96px;
    height: 96px;
  }

  .de-event-card-h__image {
    width: 96px;
    height: 96px;
    object-fit: cover;
    border-radius: 16px;
  }

  .de-event-card-h__image--placeholder { background: ${Colors.NightBlue_200}; height: 100%; }

  .de-event-card-h__body {
    flex: 1;
    padding: 16px;
    min-width: 0;
  }

  .de-event-card-h__organizer,
  .de-event-card__organizer,
  .de-rec-event-card__organizer {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    min-width: 0;
  }

  .de-event-card-h__organizer span,
  .de-event-card__organizer span,
  .de-rec-event-card__organizer span {
    font-size: 11px;
    font-weight: 600;
    color: ${Colors.Grey_Soft};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-rec-event-card__organizer {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 2;
    margin: 0;
    padding: 4px 8px 4px 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
  }

  .de-event-card-h__title {
    font-size: 15px;
    font-weight: 800;
    color: ${Colors.LovableForeground};
    margin-bottom: 4px;
    line-height: 1.2;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-event-card-h__date {
    font-size: 12px;
    font-weight: 600;
    color: ${Colors.LovablePrimary};
    margin-bottom: 4px;
  }

  .de-event-card-h__location {
    font-size: 12px;
    color: ${Colors.LovableMuted};
    margin-bottom: 4px;
  }

  .de-event-card-h__desc {
    font-size: 12px;
    color: rgba(23, 27, 46, 0.7);
    line-height: 1.35;
    margin-top: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ── Profile page (Lovable ProfileView) ── */
  .de-profile-page,
  .de-tickets-page,
  .de-notifications-page,
  .de-chat-page {
    min-height: 100vh;
    background: ${Colors.LovableBackground};
  }

  .de-profile-lovable {
    max-width: ${Layout.maxContentWidth}px;
    margin: 0 auto;
    padding: 16px 16px 120px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-profile-hero-card {
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    background: ${Colors.LovableCard};
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid ${Colors.LovableBorder};
  }

  .de-profile-cover {
    min-height: 180px;
    height: 200px;
    background: #e4e6eb;
    background-size: cover;
    background-position: center;
    position: relative;
  }

  .de-profile-cover__camera {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 2;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    color: #050505;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  }

  .de-profile-cover__camera:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .de-profile-cover__camera svg {
    display: block;
  }

  .de-profile-avatar__camera {
    position: absolute;
    right: 2px;
    bottom: 2px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: ${Colors.NightBlue_600};
    color: #fff;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
  }

  .de-profile-name__edit {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
  }

  .de-profile-hero-body { padding: 0 20px 20px; }

  .de-profile-avatar-wrap {
    position: relative;
    display: inline-block;
    margin-top: -48px;
    margin-bottom: 12px;
  }

  .de-profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid ${Colors.LovableCard};
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
    font-size: 28px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  }

  .de-profile-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .de-profile-header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .de-profile-name {
    font-size: 18px;
    font-weight: 700;
    color: ${Colors.LovableForeground};
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .de-profile-username {
    font-size: ${FontSizes.small_14}px;
    color: ${Colors.LovableMuted};
    margin-top: 2px;
  }

  .de-profile-edit-btn {
    flex-shrink: 0;
    height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(88, 86, 235, 0.3);
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-size: ${FontSizes.small_13}px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-profile-bio {
    margin-top: 8px;
    font-size: ${FontSizes.small_14}px;
    line-height: 1.5;
    color: ${Colors.LovableMuted};
  }

  .de-profile-stats-row {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 16px;
  }

  .de-profile-stat-btn {
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }

  .de-profile-stat-btn strong {
    display: block;
    font-size: 16px;
    font-weight: 700;
    color: ${Colors.LovableForeground};
    line-height: 1;
  }

  .de-profile-stat-btn span {
    font-size: 11px;
    color: ${Colors.LovableMuted};
    margin-top: 2px;
    display: block;
  }

  .de-profile-quick-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
  }

  .de-profile-pill-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 999px;
    padding: 10px 16px;
    font-size: ${FontSizes.small_14}px;
    font-weight: 600;
    border: none;
    cursor: pointer;
  }

  .de-profile-pill-btn--primary {
    background: linear-gradient(90deg, ${Colors.LovablePrimary}, #8B5CF6);
    color: white;
    box-shadow: 0 1px 3px rgba(88, 86, 235, 0.3);
  }

  .de-profile-pill-btn--outline {
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
    border: 1px solid rgba(88, 86, 235, 0.3);
  }

  .de-profile-section-card {
    border-radius: 16px;
    background: ${Colors.LovableCard};
    padding: 16px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid ${Colors.LovableBorder};
  }

  .de-profile-section-card h3 {
    font-size: ${FontSizes.small_14}px;
    font-weight: 700;
    color: ${Colors.LovableForeground};
    margin-bottom: 12px;
  }

  .de-profile-plan-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .de-profile-plan-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: ${Colors.LovablePrimaryLight};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .de-profile-actions-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .de-profile-action-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    border-radius: 16px;
    background: ${Colors.LovableCard};
    padding: 16px 8px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid ${Colors.LovableBorder};
    cursor: pointer;
    text-align: center;
  }

  .de-profile-action-card__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .de-profile-action-card span {
    font-size: 12px;
    font-weight: 500;
    color: ${Colors.LovableForeground};
  }

  .de-profile-action-card strong {
    font-size: 18px;
    font-weight: 700;
    color: ${Colors.LovableForeground};
  }

  .de-profile-menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .de-profile-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    border-radius: 16px;
    background: ${Colors.LovableCard};
    padding: 16px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid ${Colors.LovableBorder};
    cursor: pointer;
    text-align: left;
  }

  .de-profile-menu-item__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .de-profile-menu-item p {
    font-size: 12px;
    color: ${Colors.LovableMuted};
    margin: 0;
  }

  .de-profile-menu-item strong {
    font-size: 18px;
    font-weight: 700;
    color: ${Colors.LovableForeground};
    display: block;
  }

  .de-profile-logout {
    display: block;
    width: 100%;
    height: 44px;
    margin-top: 8px;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 8px;
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-size: ${FontSizes.small_14}px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-profile-topbar,
  .de-page-topbar {
    background: transparent;
    color: ${Colors.Blanco};
    padding: 20px 16px 0;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .de-profile-topbar h1,
  .de-page-topbar h1 {
    font-size: ${FontSizes.large}px;
    font-weight: 700;
    color: ${Colors.Blanco};
  }

  .de-profile-body,
  .de-page-body {
    padding: 16px;
    max-width: ${Layout.maxContentWidth}px;
    margin: 0 auto;
  }

  /* ── Tickets & notifications ── */
  .de-empty-state {
    text-align: center;
    color: ${Colors.MidnightDreams_500};
    padding: 40px 16px;
    font-size: 16px;
  }

  .de-ticket-list,
  .de-notification-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-ticket-card,
  .de-notification-card {
    background: ${Colors.LovableCard};
    border-radius: 16px;
    padding: 16px;
    box-shadow: ${Shadows.card};
    border: 1px solid ${Colors.LovableBorder};
  }

  .de-ticket-card h3 {
    font-size: 16px;
    font-weight: 700;
    color: ${Colors.TexColor};
    margin-bottom: 8px;
  }

  .de-ticket-card__ref,
  .de-ticket-card__count {
    font-size: 12px;
    color: ${Colors.Grey_Soft};
    margin-bottom: 4px;
  }

  .de-ticket-card__amount {
    font-size: 18px;
    font-weight: 700;
    color: ${Colors.NightBlue_600};
    margin: 8px 0;
  }

  .de-notification-card__channel {
    font-size: 12px;
    font-weight: 600;
    color: ${Colors.NightBlue_600};
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .de-notification-card__text {
    font-size: 14px;
    color: ${Colors.TexColor};
    margin-bottom: 6px;
  }

  .de-notification-card__status {
    font-size: 12px;
    color: ${Colors.Grey_Soft};
  }

  .de-page-content {
    padding: 16px;
    max-width: 960px;
    margin: 0 auto;
  }

  .de-page-title {
    font-size: ${FontSizes.large}px;
    color: ${Colors.NightBlue_600};
    margin-bottom: 8px;
  }

  .de-link-btn {
    background: none;
    border: none;
    color: ${Colors.NightBlue_600};
    cursor: pointer;
    padding: 0;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .de-detail-back { display: inline-block; }

  /* ── Event detail ── */
  .de-event-detail {
    min-height: 100vh;
    background: ${Colors.Primary};
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  }

  .de-event-detail__back-row {
    padding: 12px 16px;
    max-width: ${Layout.maxContentWidth}px;
    margin: 0 auto;
  }

  .de-event-detail__back {
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    padding: 8px 0;
  }

  .de-event-detail__hero {
    width: 100%;
    max-width: ${Layout.maxContentWidth}px;
    margin: 0 auto;
    padding: 0 16px;
  }

  .de-event-detail__hero-img {
    width: 100%;
    height: 220px;
    object-fit: cover;
    border-radius: 12px;
    display: block;
  }

  .de-event-detail__hero-img--placeholder {
    background: ${Colors.NightBlue_200};
  }

  .de-event-detail__content {
    max-width: ${Layout.maxContentWidth}px;
    margin: 0 auto;
    padding: 20px 16px 32px;
  }

  .de-event-detail__title {
    font-size: 22px;
    font-weight: 700;
    color: ${Colors.TexColor};
    margin-bottom: 16px;
    line-height: 1.25;
  }

  .de-event-detail__meta {
    font-size: 14px;
    color: ${Colors.Negro};
    margin-bottom: 10px;
    line-height: 1.4;
  }

  .de-event-detail__meta-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: ${Colors.Grey_Soft};
    margin-bottom: 2px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .de-event-detail__section {
    margin-top: 24px;
  }

  .de-event-detail__section-title {
    font-size: 18px;
    font-weight: 700;
    color: ${Colors.TexColor};
    margin-bottom: 10px;
  }

  .de-event-detail__description {
    font-size: 14px;
    line-height: 1.5;
    color: ${Colors.Grey_07};
  }

  .de-event-detail__cta {
    display: block;
    width: 100%;
    max-width: 320px;
    height: 45px;
    margin: 32px auto 0;
    border: none;
    border-radius: 50px;
    color: white;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-toast-container {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 360px;
  }

  .de-toast {
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-size: ${FontSizes.small_14}px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: de-slide-in 0.3s ease;
  }

  .de-toast--success { background: ${Colors.WellDoneGreen}; }
  .de-toast--error { background: ${Colors.Red_400}; }

  @keyframes de-slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .de-loader {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .de-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid ${Colors.NightBlue_200};
    border-top-color: ${Colors.NightBlue_600};
    border-radius: 50%;
    animation: de-spin 0.8s linear infinite;
  }

  @keyframes de-spin { to { transform: rotate(360deg); } }

  .de-otp-inputs {
    display: flex;
    gap: 8px;
    justify-content: center;
  }

  .de-otp-input {
    width: 44px;
    height: 48px;
    text-align: center;
    font-size: ${FontSizes.large}px;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 8px;
    background: ${Colors.LovableBackground};
    outline: none;
  }

  .de-otp-input:focus {
    border-color: ${Colors.LovablePrimary};
    box-shadow: 0 0 0 2px ${Colors.LovablePrimaryLight};
  }

  @media (max-width: 480px) {
    .de-page { padding: 16px 12px; }
    .de-card { padding: 20px 12px; }
  }

  .de-fab-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    border: none;
    background: rgba(15, 23, 42, 0.35);
    backdrop-filter: blur(2px);
    cursor: pointer;
  }

  .de-fab-wrap {
    position: fixed;
    right: 12px;
    bottom: calc(18px + env(safe-area-inset-bottom, 0px));
    z-index: 99;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .de-fab-main,
  .de-fab-option {
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  .de-fab-main {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    background: ${Colors.NightBlue_800};
    color: #fff;
    font-size: 28px;
    line-height: 1;
    box-shadow: 0 10px 24px rgba(81, 94, 192, 0.45);
  }

  .de-fab-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px 10px 20px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.95);
    color: ${Colors.LovableForeground};
    border: 1px solid ${Colors.LovableBorder};
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    font-size: 14px;
    font-weight: 600;
    backdrop-filter: blur(8px);
  }

  .de-form-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .de-field { display: flex; flex-direction: column; gap: 6px; }
  .de-field__label { font-size: 13px; font-weight: 600; color: ${Colors.LovableForeground}; }
  .de-field__input {
    width: 100%;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 8px;
    padding: 10px 12px;
    font: inherit;
    background: ${Colors.LovableBackground};
    color: ${Colors.LovableForeground};
  }

  .de-field__input:focus {
    outline: none;
    border-color: ${Colors.LovablePrimary};
    box-shadow: 0 0 0 2px ${Colors.LovablePrimaryLight};
  }

  .de-search-bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .de-search-bar__btn {
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    background: ${Colors.LovablePrimary};
    color: #fff;
    font-weight: 600;
    cursor: pointer;
  }

  .de-page-topbar--split {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .de-notification-card {
    display: flex;
    align-items: stretch;
    gap: 8px;
    background: ${Colors.LovableCard};
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 16px;
    overflow: hidden;
  }

  .de-notification-card--unread {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-notification-card__main {
    flex: 1;
    border: none;
    background: transparent;
    text-align: left;
    padding: 14px 16px;
    cursor: pointer;
  }

  .de-notification-card__delete {
    width: 44px;
    border: none;
    background: transparent;
    color: ${Colors.TexColor};
    font-size: 22px;
    cursor: pointer;
  }

  .de-notification-card__event {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: ${Colors.LovablePrimary};
    font-weight: 600;
  }

  .de-event-detail__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  .de-event-detail__cta--secondary {
    background: #fff !important;
    color: ${Colors.LovablePrimary} !important;
    border: 1px solid ${Colors.LovablePrimary};
  }

  .de-wall-tabs {
    display: flex;
    gap: 8px;
    padding: 0 16px 12px;
  }

  .de-wall-tab {
    flex: 1;
    border: 1px solid ${Colors.LovableBorder};
    background: ${Colors.LovableCard};
    border-radius: 999px;
    padding: 10px 12px;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    color: ${Colors.LovableMuted};
  }

  .de-wall-tab--active {
    background: ${Colors.LovablePrimary};
    border-color: ${Colors.LovablePrimary};
    color: #fff;
  }

  .de-wall--feed {
    padding-top: 4px;
  }

  .de-wall-main--feed {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ── Feed stories ── */
  .de-feed-stories {
    margin-top: 24px;
    padding: 0 16px;
  }

  .de-feed-stories__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .de-feed-stories__header h2 {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .de-feed-stories__live {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #f43f5e;
  }

  .de-feed-stories__live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f43f5e;
    animation: de-pulse 1.5s ease-in-out infinite;
  }

  @keyframes de-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .de-feed-stories__scroll {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .de-feed-stories__scroll::-webkit-scrollbar { display: none; }

  .de-feed-stories__item {
    flex: 0 0 64px;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
  }

  .de-feed-stories__ring {
    position: relative;
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(135deg, ${Colors.LovablePrimary}, #a78bfa);
  }

  .de-feed-stories__ring--live {
    background: ${Gradients.brand};
  }

  .de-feed-stories__ring--own-idle {
    background: ${Colors.LovablePrimary};
  }

  .de-feed-stories__img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid ${Colors.LovableBackground};
  }

  .de-feed-stories__ring .de-user-avatar {
    border: 2px solid ${Colors.LovableBackground};
  }

  .de-feed-stories__badge {
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    background: #f43f5e;
    color: #fff;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 5px;
    border-radius: 999px;
  }

  .de-feed-stories__add {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${Colors.LovablePrimary};
    color: #fff;
    font-size: 14px;
    line-height: 20px;
    font-weight: 700;
    border: 2px solid #fff;
  }

  .de-feed-stories__label {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    font-weight: 500;
    color: ${Colors.LovableMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }

  .de-feed-stories__count {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 18px;
    height: 18px;
    border-radius: 999px;
    background: ${Colors.LovablePrimary};
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
    border: 2px solid #fff;
  }

  .de-feed-stories__loading {
    font-size: 12px;
    color: ${Colors.LovableMuted};
    margin: 0;
  }

  .de-story-mode-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .de-story-mode-tab {
    border: 1px solid ${Colors.NightBlue_600};
    background: #fff;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-story-mode-tab--active {
    background: ${Colors.LovablePrimary};
    color: #fff;
    border-color: ${Colors.LovablePrimary};
  }

  .de-story-preview {
    border-radius: 16px;
    overflow: hidden;
    background: #111827;
  }

  .de-story-preview__media {
    width: 100%;
    max-height: 240px;
    object-fit: cover;
    display: block;
  }

  .de-story-live-hint {
    font-size: 12px;
    color: ${Colors.LovableMuted};
    margin: 0;
  }

  .de-story-live-preview {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: #111827;
    min-height: 180px;
  }

  .de-story-live-preview__badge {
    position: absolute;
    top: 12px;
    left: 12px;
  }

  .de-story-viewer {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: #000;
    display: flex;
    flex-direction: column;
  }

  .de-story-viewer__header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .de-story-viewer__header-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    position: relative;
    z-index: 12;
  }

  .de-story-viewer__menu-btn {
    border: none;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    padding-bottom: 6px;
    position: relative;
    z-index: 12;
    pointer-events: auto;
  }

  .de-story-viewer__menu-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .de-story-viewer__close {
    position: static;
    border: none;
    background: rgba(0, 0, 0, 0.45);
    color: #fff;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 22px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .de-story-viewer__menu-overlay {
    position: fixed;
    inset: 0;
    z-index: 1300;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px;
    background: rgba(0, 0, 0, 0.55);
    pointer-events: auto;
  }

  .de-story-viewer__menu-sheet {
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    color: #111;
  }

  .de-story-viewer__menu-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid #ececec;
    font-size: 12px;
    color: #6b7280;
  }

  .de-story-viewer__menu-head button {
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }

  .de-story-viewer__menu-item {
    display: block;
    width: 100%;
    border: none;
    border-bottom: 1px solid #ececec;
    background: #fff;
    color: #111;
    padding: 16px;
    text-align: center;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
  }

  .de-story-viewer__menu-item--danger {
    color: #dc2626;
    font-weight: 600;
  }

  .de-story-viewer__menu-item--disabled,
  .de-story-viewer__menu-item:disabled {
    color: #cbd5e1;
    cursor: not-allowed;
  }

  .de-story-viewer__menu-cancel {
    width: 100%;
    border: none;
    background: #fff;
    color: #111;
    border-radius: 18px;
    padding: 16px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-story-viewer__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: 16px;
    background: linear-gradient(180deg, rgba(0,0,0,0.65), transparent);
    pointer-events: none;
  }

  .de-story-viewer__header-row,
  .de-story-viewer__header-actions,
  .de-story-viewer__menu-btn,
  .de-story-viewer__close,
  .de-story-viewer__author {
    pointer-events: auto;
  }

  .de-story-viewer__author {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 10px;
  }

  .de-story-viewer__progress {
    display: flex;
    gap: 4px;
  }

  .de-story-viewer__seg {
    flex: 1;
    height: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.35);
  }

  .de-story-viewer__seg--active {
    background: #fff;
  }

  .de-story-viewer__tap {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 35%;
    border: none;
    background: transparent;
    cursor: pointer;
    z-index: 2;
    padding: 0;
  }

  .de-story-viewer__tap--prev {
    left: 0;
  }

  .de-story-viewer__tap--next {
    right: 0;
  }

  .de-story-viewer__body {
    flex: 1;
    display: grid;
    place-items: center;
    position: relative;
  }

  .de-story-viewer__media {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }

  .de-story-viewer__text-only {
    width: min(90%, 420px);
    padding: 24px;
    border-radius: 24px;
    background: linear-gradient(135deg, ${Colors.LovablePrimary}, #a78bfa);
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    text-align: center;
  }

  .de-story-viewer__caption {
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 24px;
    color: #fff;
    font-size: 14px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  }

  .de-story-viewer__empty {
    margin: auto;
    color: #fff;
    text-align: center;
  }

  .de-trending-card__organizer {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: transparent;
    padding: 0;
    margin-bottom: 4px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    color: ${Colors.Grey_Soft};
  }

  .de-post__avatar-btn {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    flex-shrink: 0;
  }

  .de-post__avatar-btn:disabled,
  .de-post__author--link:disabled {
    cursor: default;
  }

  .de-post__author--link {
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }

  .de-back-btn {
    border: none;
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-weight: 600;
    margin-bottom: 12px;
    cursor: pointer;
    padding: 0;
  }

  .de-public-profile-events {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .de-public-profile-events button {
    width: 100%;
    border: 1px solid ${Colors.NightBlue_600};
    border-radius: 12px;
    background: #fff;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .de-public-profile-events strong {
    font-size: 14px;
    color: ${Colors.LovableForeground};
  }

  .de-public-profile-events span {
    font-size: 12px;
    color: ${Colors.LovableMuted};
  }

  /* ── Trending section ── */
  .de-trending-section {
    margin-top: 28px;
    padding: 0 16px;
  }

  .de-trending-section__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .de-trending-section__icon {
    width: 32px;
    height: 32px;
    border-radius: 12px;
    background: rgba(244, 63, 94, 0.1);
    display: grid;
    place-items: center;
    font-size: 16px;
  }

  .de-trending-section__header h2 {
    font-size: 18px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .de-trending-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0;
    margin: 0;
  }

  .de-trending-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    border: none;
    background: ${Colors.LovableCard};
    border-radius: 16px;
    padding: 12px;
    box-shadow: ${Shadows.card};
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .de-trending-card__thumb {
    position: relative;
    flex: 0 0 64px;
    width: 64px;
    height: 64px;
  }

  .de-trending-card__img {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    object-fit: cover;
  }

  .de-trending-card__img--placeholder {
    background: ${Colors.LovablePrimarySoft};
  }

  .de-trending-card__rank {
    position: absolute;
    top: 4px;
    left: 4px;
    background: rgba(255, 255, 255, 0.92);
    color: ${Colors.LovablePrimary};
    font-size: 10px;
    font-weight: 800;
    padding: 2px 5px;
    border-radius: 6px;
  }

  .de-trending-card__body {
    flex: 1;
    min-width: 0;
  }

  .de-trending-card__date {
    margin: 0;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: ${Colors.LovableMuted};
  }

  .de-trending-card__body h3 {
    margin: 2px 0 0;
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-trending-card__attendees {
    margin: 4px 0 0;
    font-size: 12px;
    color: ${Colors.LovableMuted};
  }

  .de-trending-card__chev {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: ${Colors.LovablePrimarySoft};
    color: ${Colors.LovablePrimary};
    display: grid;
    place-items: center;
    font-size: 18px;
    font-weight: 700;
  }

  .de-rec-event-card--no-img {
    background: linear-gradient(135deg, ${Colors.LovablePrimarySoft}, #e0e7ff);
  }

  .de-rec-event-card__img--empty {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, ${Colors.LovablePrimarySoft}, #c7d2fe);
  }

  .de-event-person__avatar.de-user-avatar {
    margin: 0 auto 8px;
    display: flex;
  }

  .de-wall--feed .de-wall-section--carousel {
    margin-top: 24px;
    margin-bottom: 4px;
    padding: 0 20px;
  }

  .de-wall--feed .de-wall-section--carousel .de-wall-scroll {
    padding: 0 0 12px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }

  .de-wall--feed .de-wall-section--carousel .de-wall-scroll::-webkit-scrollbar { display: none; }

  .de-wall--feed .de-wall-section--community {
    margin-top: 36px;
    padding: 0 20px;
  }

  .de-wall--feed .de-wall-section--community .de-wall-section__header {
    margin-bottom: 16px;
  }

  .de-wall--feed .de-wall-section--community .de-wall-main--feed {
    padding: 0;
  }

  .de-post {
    margin: 0 0 20px;
    border-radius: 24px;
    background: ${Colors.LovableCard};
    box-shadow: ${Shadows.card};
    overflow: hidden;
  }

  .de-post__header {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    margin-bottom: 12px;
  }

  .de-post__avatar {
    flex-shrink: 0;
  }

  .de-post__author-wrap {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
  }

  .de-post__author {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: ${Colors.Negro};
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-post__time {
    margin: 0;
    font-size: 12px;
    color: #9CA3AF;
    line-height: 1.2;
  }

  .de-post__header-end {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .de-post__follow {
    border: 1px solid ${Colors.NightBlue_600};
    background: #fff;
    color: ${Colors.NightBlue_600};
    border-radius: 999px;
    height: 32px;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }

  .de-post__menu-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .de-post__menu-btn {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    color: #6B7280;
    width: 36px;
    height: 36px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .de-post__menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    min-width: 160px;
    background: #fff;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.15);
    z-index: 20;
    overflow: hidden;
  }

  .de-post__menu button {
    display: block;
    width: 100%;
    border: none;
    background: #fff;
    text-align: left;
    padding: 10px 14px;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
  }

  .de-post__menu button:hover {
    background: #F3F4F6;
  }

  .de-post__delete {
    border: none;
    background: transparent;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    color: ${Colors.TexColor};
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .de-post-card {
    background: ${Colors.LovableCard};
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: ${Shadows.card};
    display: flex;
    flex-direction: column;
  }

  .de-post-card__type-badge {
    display: inline-block;
    align-self: flex-start;
    margin: 16px 16px 0;
    padding: 4px 12px;
    border-radius: 999px;
    background: ${Colors.LovableBackground};
    color: ${Colors.LovablePrimary};
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
  }

  .de-post-carousel {
    margin-top: 12px;
    width: 100%;
  }

  .de-post-carousel__frame {
    position: relative;
    margin: 0 16px;
    border-radius: 14px;
    overflow: hidden;
    background: #F3F4F6;
  }

  .de-post-carousel__img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    max-height: 340px;
    object-fit: cover;
  }

  .de-post-carousel__counter {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(17, 24, 39, 0.72);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
  }

  .de-post-carousel__dots {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    min-height: 22px;
    padding: 10px 16px 0;
  }

  .de-post-carousel__dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    border: none;
    padding: 0;
    background: #D1D5DB;
    cursor: pointer;
    flex-shrink: 0;
  }

  .de-post-carousel__dot--active {
    background: ${Colors.NightBlue_600};
    width: 8px;
    height: 8px;
  }

  .de-post-card__title {
    margin: 14px 16px 0;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.25;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: ${Colors.Negro};
  }

  .de-post-card__text {
    margin: 8px 16px 0;
    color: #374151;
    line-height: 1.45;
    font-size: 14px;
    white-space: pre-wrap;
  }

  .de-post-card__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    margin: 10px 16px 0;
    font-size: 12px;
    color: ${Colors.NightBlue_600};
    font-weight: 600;
    line-height: 1.3;
  }

  .de-post-card__actions {
    display: flex;
    align-items: center;
    justify-content: space-around;
    gap: 4px;
    padding: 14px 12px 16px;
    margin-top: 12px;
  }

  .de-post-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: none;
    background: transparent;
    padding: 0;
    min-width: 56px;
    cursor: pointer;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    color: ${Colors.NightBlue_600};
    line-height: 1;
  }

  .de-post-action__icon {
    font-size: 18px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
  }

  .de-post-action--active {
    color: ${Colors.NightBlue_800};
  }

  .de-post-action--active .de-post-action__icon {
    color: #E11D48;
  }

  .de-post-card__mentions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 16px 0;
  }

  .de-post-card__event-mention {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
  }

  .de-post-card--clickable {
    cursor: pointer;
  }

  .de-social-create-btn {
    position: fixed;
    right: 16px;
    bottom: 88px;
    z-index: 45;
    border: none;
    border-radius: 999px;
    padding: 14px 18px;
    background: ${Colors.LovablePrimary};
    color: #fff;
    font-weight: 700;
    box-shadow: 0 10px 24px rgba(88, 86, 235, 0.35);
    cursor: pointer;
  }

  .de-sheet-overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .de-sheet-overlay--above-dock {
    z-index: 120;
  }

  .de-sheet {
    width: min(100%, 480px);
    max-height: 85vh;
    overflow: auto;
    background: #fff;
    border-radius: 20px 20px 0 0;
    padding-bottom: 24px;
    display: flex;
    flex-direction: column;
  }

  .de-sheet--with-footer {
    padding-bottom: 0;
    max-height: min(85vh, calc(100vh - 24px));
  }

  .de-sheet--tall { max-height: 90vh; }

  .de-sheet__footer {
    position: sticky;
    bottom: 0;
    padding: 12px 20px calc(16px + env(safe-area-inset-bottom, 0px));
    background: #fff;
    border-top: 1px solid ${Colors.LovableBorder};
    box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
  }

  .de-sheet__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid ${Colors.LovableBorder};
  }

  .de-sheet__header h2 {
    margin: 0;
    font-size: 18px;
  }

  .de-sheet__close {
    border: none;
    background: transparent;
    font-size: 28px;
    cursor: pointer;
  }

  .de-sheet__body {
    padding: 16px 20px;
  }

  .de-comments-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .de-comment-item {
    padding: 12px;
    border-radius: 12px;
    background: ${Colors.Primary};
  }

  .de-comment-item__author {
    margin: 0 0 4px;
    font-weight: 700;
    font-size: 13px;
  }

  .de-comment-item__text {
    margin: 0;
    font-size: 14px;
  }

  .de-comment-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-wall-load-more {
    display: flex;
    justify-content: center;
    padding: 4px 16px 28px;
    margin-top: 4px;
  }

  .de-wall-load-more button {
    min-width: 220px;
    border: 1px solid ${Colors.LovableBorder};
    background: #fff;
    border-radius: 999px;
    padding: 10px 18px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    color: ${Colors.NightBlue_600};
    cursor: pointer;
  }

  .de-seat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
    margin-top: 12px;
  }

  .de-seat-chip {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid ${Colors.Line};
    border-radius: 12px;
    padding: 10px;
    background: #fff;
    cursor: pointer;
    text-align: left;
  }

  .de-seat-chip--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-checkout-summary,
  .de-checkout-category,
  .de-checkout-map-section {
    margin-bottom: 16px;
  }

  .de-checkout-map-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .de-checkout-map-view-toggle {
    display: inline-flex;
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    overflow: hidden;
  }

  .de-checkout-map-view-toggle__btn {
    border: 0;
    background: transparent;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
  }

  .de-checkout-map-view-toggle__btn--active {
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
    font-weight: 600;
  }

  .de-checkout-map-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .de-checkout-map-filter select {
    border: 1px solid ${Colors.Line};
    border-radius: 8px;
    padding: 6px 10px;
    background: #fff;
  }

  .de-checkout-pro {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 900px) {
    .de-checkout-pro {
      grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
      align-items: start;
    }
  }

  .de-checkout-pro__map-panel {
    position: relative;
  }

  .de-checkout-pro__sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-checkout-page--map {
    padding-bottom: calc(220px + env(safe-area-inset-bottom));
  }

  .de-checkout-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: ${Colors.TexColor};
  }

  .de-checkout-header__sub {
    margin: 4px 0 0;
    font-size: 13px;
    color: ${Colors.Placeholder};
    line-height: 1.4;
  }

  .de-checkout-map-shell {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .de-checkout-category-chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none;
  }

  .de-checkout-category-chips::-webkit-scrollbar {
    display: none;
  }

  .de-checkout-category-chip {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    padding: 8px 14px;
    background: #fff;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
  }

  .de-checkout-category-chip--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
  }

  .de-checkout-category-chip__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .de-checkout-bottom-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 350;
    padding: 10px 16px calc(12px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.98);
    border-top: 1px solid ${Colors.Line};
    box-shadow: 0 -12px 32px rgba(15, 23, 42, 0.1);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .de-checkout-bottom-bar--open {
    max-height: 70vh;
    overflow-y: auto;
  }

  .de-checkout-bottom-bar__handle {
    display: flex;
    align-self: center;
    border: none;
    background: none;
    padding: 4px 0 2px;
    cursor: pointer;
  }

  .de-checkout-bottom-bar--collapsed {
    padding-top: 6px;
    gap: 8px;
  }

  .de-checkout-bottom-bar--collapsed .de-checkout-bottom-bar__summary {
    margin-bottom: 0;
  }

  .de-checkout-page--selection-minimized {
    padding-bottom: calc(120px + env(safe-area-inset-bottom));
  }

  .de-checkout-header__coverage {
    color: ${Colors.NightBlue_600};
    font-weight: 600;
  }

  .de-checkout-bottom-bar__handle span {
    display: block;
    width: 42px;
    height: 5px;
    border-radius: 999px;
    background: #cbd5e1;
  }

  .de-checkout-bottom-bar__summary {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .de-checkout-bottom-bar__preview {
    margin: 4px 0 0;
    font-size: 12px;
    color: ${Colors.Placeholder};
    line-height: 1.35;
  }

  .de-checkout-bottom-bar__total {
    text-align: right;
    flex-shrink: 0;
  }

  .de-checkout-bottom-bar__total small {
    display: block;
    font-size: 11px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-bottom-bar__total strong {
    font-size: 18px;
    color: ${Colors.TexColor};
  }

  .de-checkout-bottom-bar__hint {
    margin: 0;
    font-size: 12px;
    color: ${Colors.Placeholder};
    line-height: 1.35;
  }

  .de-checkout-selection-list--drawer {
    max-height: 180px;
    overflow-y: auto;
    border: 1px solid ${Colors.Line};
    border-radius: 12px;
    padding: 8px;
    background: #f8fafc;
  }

  .de-checkout-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin: 0 auto 10px;
    max-width: 78%;
    min-height: 40px;
    border-radius: 10px;
    background: linear-gradient(180deg, #334155 0%, #1e293b 100%);
    color: #f8fafc;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.2);
  }

  .de-checkout-stage small {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: none;
    opacity: 0.85;
  }

  .de-checkout-price-ranges {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .de-checkout-price-range {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid ${Colors.Line};
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    text-align: left;
  }

  .de-checkout-price-range--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-checkout-price-range__dot {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .de-checkout-price-range__meta {
    flex: 1;
    min-width: 0;
  }

  .de-checkout-price-range__meta strong {
    display: block;
    font-size: 13px;
    color: #0f172a;
  }

  .de-checkout-price-range__meta span {
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-hint {
    padding: 12px;
    border-radius: 12px;
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
    font-size: 13px;
    line-height: 1.45;
  }

  .de-checkout-seating-map {
    width: 100%;
  }

  .de-checkout-seating-map__floor-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
    align-items: center;
  }

  .de-checkout-seating-map__floor-tabs button {
    border: 1px solid ${Colors.Line};
    background: #fff;
    color: ${Colors.Placeholder};
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .de-checkout-seating-map__floor-tabs button.is-active {
    background: ${Colors.LovablePrimary};
    border-color: ${Colors.LovablePrimary};
    color: #fff;
  }

  .de-checkout-seating-map__viewport {
    position: relative;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-x pan-y;
    border: 1px solid ${Colors.Line};
    border-radius: 16px;
    background: #fff;
    max-height: min(62vh, 520px);
  }

  .de-checkout-seating-map--interactive .de-checkout-seating-map__viewport {
    touch-action: none;
  }

  .de-checkout-seating-map--compact .de-checkout-seating-map__viewport {
    max-height: min(58vh, 480px);
  }

  .de-checkout-seating-map__zoom-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    padding: 8px 12px;
    border-radius: 14px;
    border: 1px solid ${Colors.Line};
    background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  }

  .de-checkout-seating-map__zoom-toolbar-label {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    letter-spacing: 0.02em;
    margin-right: 2px;
  }

  .de-checkout-seating-map__zoom-toolbar-btn {
    width: 36px;
    height: 36px;
    border: 1px solid ${Colors.Line};
    border-radius: 10px;
    background: #fff;
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: ${Colors.NightBlue_600};
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .de-checkout-seating-map__zoom-toolbar-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .de-checkout-seating-map__zoom-toolbar-value {
    min-width: 52px;
    text-align: center;
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    padding: 6px 8px;
    border-radius: 8px;
    background: #eef2ff;
  }

  .de-checkout-seating-map__zoom-toolbar-reset {
    margin-left: auto;
    height: 36px;
    padding: 0 14px;
    border: 1px solid ${Colors.Line};
    border-radius: 10px;
    background: #fff;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .de-checkout-seating-map__zoom-toolbar-reset:hover {
    background: #f8fafc;
    color: ${Colors.NightBlue_600};
  }

  .de-checkout-seating-map__canvas {
    min-height: 420px;
    position: relative;
    margin-bottom: 0;
    width: 100%;
  }

  .de-checkout-seating-map--interactive .de-checkout-seating-map__viewport {
    max-height: min(68vh, 640px);
    min-height: 360px;
  }

  .de-checkout-seating-map--interactive .de-checkout-seating-map__canvas {
    min-height: 720px;
    min-width: 100%;
  }

  .de-checkout-seating-map__hint {
    margin: 0 0 8px;
    font-size: 12px;
    color: ${Colors.Placeholder};
    line-height: 1.4;
  }

  .de-checkout-seating-map__hint-zoom {
    color: ${Colors.LovablePrimary};
    font-weight: 600;
  }

  .de-checkout-seating-map__seat-layout {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    overflow: hidden;
    padding: 2px 4px 6px;
  }

  .de-checkout-seating-map__seat-layout--interactive {
    gap: 2px;
    padding: 6%;
    overflow: hidden;
    min-height: 0;
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
  }

  .de-checkout-seating-map__seat-row {
    display: flex;
    align-items: stretch;
    gap: 2px;
    min-width: 0;
    flex: 1;
    min-height: 0;
  }

  .de-checkout-seating-map--interactive .de-checkout-seating-map__seat-row {
    gap: 2px;
    min-height: 0;
    flex: 1;
    overflow: hidden;
    display: flex;
    align-items: stretch;
    width: 100%;
  }

  .de-checkout-seating-map__row-label {
    flex: 0 0 10px;
    font-size: 7px;
    font-weight: 800;
    color: #475569;
    text-align: center;
  }


  .de-checkout-seating-map--interactive[data-zoom-level="low"] .de-checkout-seat--interactive:not(:disabled)::before {
    content: '';
    position: absolute;
    inset: -3px;
    z-index: 1;
  }

  .de-checkout-seating-map__zone--stage {
    z-index: 2;
  }

  .de-checkout-seating-map__zone--stage .de-checkout-seating-map__zone-label {
    color: #fff;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .de-checkout-seat__label {
    display: block;
    font-size: inherit;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .de-checkout-seat-focus {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 10px;
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-checkout-seat-focus__main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;
    color: ${Colors.TexColor};
  }

  .de-checkout-seat-focus__main strong {
    font-size: 15px;
  }

  .de-checkout-seat-focus__zone {
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-seat-focus__price {
    text-align: right;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-checkout-seat-focus__price strong {
    font-size: 17px;
    color: ${Colors.LovablePrimary};
  }

  .de-checkout-seat-focus__price small {
    font-size: 11px;
    color: ${Colors.LovablePrimary};
    font-weight: 700;
  }

  .de-checkout-purchase-detail {
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 10px;
    background: #f8fafc;
  }

  .de-checkout-purchase-detail__title {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    color: ${Colors.Placeholder};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .de-checkout-purchase-detail__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .de-checkout-purchase-detail__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid ${Colors.Line};
  }

  .de-checkout-purchase-detail__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .de-checkout-purchase-detail__info strong {
    font-size: 14px;
    color: ${Colors.TexColor};
  }

  .de-checkout-purchase-detail__info span {
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-purchase-detail__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .de-checkout-purchase-detail__actions strong {
    font-size: 15px;
    color: ${Colors.LovablePrimary};
  }

  .de-checkout-purchase-detail__remove {
    width: 28px;
    height: 28px;
    border: 1px solid ${Colors.Line};
    border-radius: 8px;
    background: #fff;
    color: #64748b;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }

  .de-checkout-bottom-bar__mini-preview {
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    padding: 10px;
    background: #f8fafc;
  }

  .de-checkout-bottom-bar__mini-label {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
  }

  .de-seat-preview__stage-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px;
    max-width: 70%;
    min-height: 28px;
    border-radius: 8px;
    background: linear-gradient(180deg, #334155, #1e293b);
    color: #f8fafc;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .de-seat-preview__canvas-wrap {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid ${Colors.Line};
    background: #fff;
  }

  .de-seat-preview__canvas {
    min-height: 200px;
    position: relative;
  }

  .de-seat-preview--expanded .de-seat-preview__canvas {
    min-height: 280px;
  }

  .de-seat-preview__zone {
    position: absolute;
    display: flex;
    flex-direction: column;
    overflow: visible;
    box-sizing: border-box;
  }

  .de-seat-preview__zone-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .de-seat-preview__seat-layout {
    position: relative;
    z-index: 1;
    flex: 1;
    display: grid;
    min-height: 0;
    min-width: 0;
    gap: 1px;
  }

  .de-seat-preview__seat-layout--shaped {
    padding: 18% 14%;
    box-sizing: border-box;
  }

  .de-seat-preview__seat-row {
    display: flex;
    min-height: 0;
    min-width: 0;
  }

  .de-seat-preview__zone--dense .de-seat-preview__seat,
  .de-seat-preview__zone--ultra-dense .de-seat-preview__seat {
    min-height: 6px;
    font-size: 5px;
    border-radius: 1px;
  }

  .de-seat-preview__zone--active {
    z-index: 3;
    box-shadow: 0 0 0 3px rgba(88, 86, 235, 0.35);
  }

  .de-seat-preview__zone-label {
    font-size: 9px;
    font-weight: 700;
    text-align: center;
    padding: 3px;
    z-index: 1;
  }

  .de-seat-preview__zone--stage .de-seat-preview__zone-label {
    color: #fff;
    font-weight: 800;
  }

  .de-seat-preview__seats {
    display: grid;
    gap: 2px;
    padding: 3px;
    flex: 1;
  }

  .de-seat-preview__seat {
    border-radius: 3px;
    min-height: 10px;
    font-size: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e2e8f0;
    color: transparent;
  }

  .de-seat-preview__seat--muted {
    opacity: 0.25;
  }

  .de-seat-preview__seat--selected {
    background: ${Colors.LovablePrimaryLight};
    border: 1px solid ${Colors.LovablePrimary};
    color: ${Colors.LovablePrimary};
    font-weight: 700;
    opacity: 1;
  }

  .de-seat-preview__seat--highlight {
    background: ${Colors.LovablePrimary};
    color: #fff;
    border: 2px solid #fff;
    box-shadow: 0 0 0 3px ${Colors.LovablePrimary}, 0 0 16px rgba(88, 86, 235, 0.55);
    transform: scale(1.15);
    z-index: 2;
    animation: de-seat-pulse 1.4s ease-in-out infinite;
  }

  @keyframes de-seat-pulse {
    0%, 100% { box-shadow: 0 0 0 3px ${Colors.LovablePrimary}, 0 0 10px rgba(88, 86, 235, 0.4); }
    50% { box-shadow: 0 0 0 5px ${Colors.LovablePrimary}, 0 0 18px rgba(88, 86, 235, 0.65); }
  }

  .de-checkout-selection-item--tap {
    width: 100%;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  .de-checkout-selection-item--active {
    background: ${Colors.LovablePrimaryLight};
    border-radius: 8px;
  }

  .de-checkout-confirm-overlay {
    z-index: 420;
    align-items: flex-end;
  }

  .de-checkout-page--confirming {
    padding-bottom: 0 !important;
  }

  .de-checkout-confirm-sheet {
    width: 100%;
    max-width: 520px;
    max-height: 92vh;
    border-radius: 20px 20px 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  @media (min-width: 640px) {
    .de-checkout-confirm-overlay {
      align-items: center;
    }

    .de-checkout-confirm-sheet {
      border-radius: 20px;
      max-height: 88vh;
    }
  }

  .de-checkout-confirm-sheet__sub {
    margin: 4px 0 0;
    font-size: 13px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-confirm-sheet__body {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-checkout-confirm-sheet__intro {
    margin: 0;
    font-size: 13px;
    color: ${Colors.Placeholder};
    line-height: 1.45;
  }

  .de-checkout-confirm-sheet__focus-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    background: ${Colors.LovablePrimaryLight};
    border: 1px solid ${Colors.LovablePrimary};
  }

  .de-checkout-confirm-sheet__focus-card div {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-checkout-confirm-sheet__focus-price {
    font-size: 18px;
    color: ${Colors.LovablePrimary};
  }

  .de-checkout-confirm-sheet__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .de-checkout-confirm-sheet__item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px;
    border: 1px solid ${Colors.Line};
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    text-align: left;
  }

  .de-checkout-confirm-sheet__item--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-checkout-confirm-sheet__item-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .de-checkout-confirm-sheet__item-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-checkout-confirm-sheet__item-meta small {
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-confirm-sheet__item-price {
    font-weight: 700;
    color: ${Colors.TexColor};
  }

  .de-checkout-confirm-sheet__footer {
    padding: 16px;
    border-top: 1px solid ${Colors.Line};
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #fff;
  }

  .de-checkout-confirm-sheet__total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
  }

  .de-checkout-confirm-sheet__total strong {
    font-size: 20px;
    color: ${Colors.TexColor};
  }

  .de-checkout-confirm-sheet__reserve-note {
    margin: 0;
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-confirm-sheet__cancel {
    border: none;
    background: none;
    color: ${Colors.Placeholder};
    font-weight: 600;
    cursor: pointer;
    padding: 8px;
  }

  .de-checkout-page--map.de-checkout-page--has-selection {
    padding-bottom: calc(340px + env(safe-area-inset-bottom));
  }

  .de-edit-profile-settings .de-profile-settings {
    margin: 0;
    box-shadow: none;
    border: 1px solid ${Colors.Line};
  }

  .de-checkout-seating-map__zone {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    overflow: visible;
    box-sizing: border-box;
  }

  .de-checkout-seating-map__zone-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .de-checkout-seating-map--interactive .de-checkout-seating-map__zone {
    overflow: visible;
    padding: 0;
    box-sizing: border-box;
    min-height: 0;
    min-width: 0;
  }

  .de-checkout-seating-map__seat-layout--shaped {
    padding: 14%;
    box-sizing: border-box;
  }

  .de-checkout-seating-map__seat-layout {
    position: relative;
    z-index: 1;
    flex: 1;
    min-height: 0;
    min-width: 0;
  }

  .de-checkout-seating-map__zone--shaped .de-checkout-seating-map__zone-label {
    position: relative;
    z-index: 2;
  }

  .de-checkout-seating-map--interactive .de-checkout-seating-map__zone:not(.de-checkout-seating-map__zone--element) {
    border-width: 1px !important;
  }

  .de-checkout-seating-map--interactive .de-checkout-seating-map__seats {
    flex: 1;
    min-height: 0;
    min-width: 0;
    gap: 2px;
    padding: 0;
    width: 100%;
    align-content: stretch;
    justify-items: stretch;
  }

  .de-checkout-seating-map__zone-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex-shrink: 0;
    min-height: 0;
  }

  .de-checkout-seating-map__zone-zoom-btn {
    width: 16px;
    height: 16px;
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.95);
    color: ${Colors.LovablePrimary};
    font-size: 10px;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }

  .de-checkout-seating-map__zone--focused {
    z-index: 4;
    box-shadow: 0 0 0 3px rgba(105, 121, 248, 0.35);
  }

  .de-checkout-seating-map__focus-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin: 0 0 8px;
    padding: 8px 12px;
    border-radius: 10px;
    background: ${Colors.LovablePrimaryLight};
    border: 1px solid rgba(105, 121, 248, 0.2);
    font-size: 12px;
  }

  .de-checkout-seating-map__focus-bar button {
    border: none;
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-weight: 700;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  }

  .de-full-venue-map {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .de-full-venue-map__tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
  }

  .de-full-venue-map__tab {
    flex-shrink: 0;
    border: 1px solid ${Colors.Line};
    background: #fff;
    color: #64748b;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .de-full-venue-map__tab--active {
    background: ${Colors.NightBlue_600};
    border-color: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-full-venue-map__canvas-wrap {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid ${Colors.Line};
    background: #f8fafc;
  }

  .de-full-venue-map__legend {
    margin: 0;
    text-align: center;
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
  }

  .de-checkout-seating-map--confirm-preview .de-checkout-seating-map__viewport {
    max-height: min(52vh, 420px);
    min-height: 280px;
  }

  .de-checkout-seating-map--confirm-preview .de-checkout-seat--preview-selected {
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px ${Colors.LovablePrimary}, 0 0 14px rgba(88, 86, 235, 0.55);
    z-index: 2;
    position: relative;
    opacity: 1 !important;
    cursor: default;
  }

  .de-checkout-seating-map--confirm-preview .de-checkout-seat--preview-selected:disabled {
    opacity: 1 !important;
  }

  .de-checkout-seating-map--confirm-preview .de-checkout-seat__label {
    display: block;
    font-size: 7px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }

  .de-checkout-seating-map__zone-label {
    font-size: 9px;
    font-weight: 700;
    text-align: center;
    padding: 2px 4px;
    color: #0f172a;
    z-index: 1;
    flex-shrink: 0;
  }

  .de-checkout-seating-map--interactive .de-checkout-seating-map__zone-label {
    font-size: 6px;
    padding: 1px 2px 0;
    line-height: 1;
    max-height: 9px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex-shrink: 0;
  }

  .de-checkout-seating-map__zone--ultra-dense .de-checkout-seating-map__zone-label {
    font-size: 5px;
    max-height: 8px;
    padding: 0 1px;
  }

  .de-checkout-seating-map__seats {
    display: grid;
    gap: 1px;
    padding: 1px 2px;
    flex: 1;
    align-content: stretch;
    min-width: 0;
    min-height: 0;
  }

  .de-checkout-seat {
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 9px;
    line-height: 1;
    padding: 2px 1px;
    min-height: 20px;
    min-width: 0;
    width: 100%;
    aspect-ratio: 1;
    cursor: pointer;
    background: #e2e8f0;
    color: #334155;
    touch-action: manipulation;
  }

  .de-checkout-seating-map--interactive .de-checkout-seat.de-checkout-seat--interactive {
    min-height: 0;
    min-width: 0;
    width: 100%;
    height: auto;
    max-width: none;
    max-height: none;
    padding: 0;
    margin: 0;
    border-radius: 3px;
    border-width: 1px;
    font-size: 0;
    line-height: 0;
    display: block;
    aspect-ratio: 1;
    box-sizing: border-box;
    position: relative;
  }

  @media (min-width: 768px) {
    .de-checkout-seat:not(.de-checkout-seat--interactive) {
      min-height: 18px;
      font-size: 8px;
    }

    .de-checkout-bottom-bar {
      position: static;
      border-radius: 16px;
      border: 1px solid ${Colors.Line};
      box-shadow: none;
      margin-top: 12px;
    }

    .de-checkout-page--map {
      padding-bottom: 88px;
    }

    .de-checkout-bottom-bar__handle {
      display: none;
    }
  }

  .de-checkout-seat--available {
    background: #dcfce7;
    border-color: #22c55e;
    color: #166534;
  }

  .de-checkout-seat--reserved {
    background: #facc15;
    border-color: #ca8a04;
    color: #713f12;
    cursor: not-allowed;
  }

  .de-checkout-seat--sold {
    background: #ef4444;
    border-color: #b91c1c;
    color: #fff;
    cursor: not-allowed;
    opacity: 1;
  }

  .de-checkout-seat--selected {
    background: ${Colors.LovablePrimary};
    border-color: ${Colors.LovablePrimary};
    color: #fff;
    font-weight: 700;
  }

  .de-checkout-seat:disabled {
    cursor: not-allowed;
  }

  .de-checkout-overview {
    width: 100%;
  }

  .de-checkout-overview__hint {
    margin: 0 0 10px;
    font-size: 13px;
    color: ${Colors.Placeholder};
    line-height: 1.45;
  }

  .de-checkout-overview__viewport {
    overflow: hidden;
    border: 1px solid ${Colors.Line};
    border-radius: 16px;
    background: #fff;
    max-height: min(52vh, 420px);
    padding: 8px;
  }

  .de-checkout-overview__canvas {
    min-height: 400px;
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 12px;
  }

  .de-checkout-overview__zone {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 4px;
    text-align: center;
    overflow: hidden;
  }

  .de-checkout-overview__zone--category {
    border: none;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .de-checkout-overview__zone--category:not(:disabled):active {
    transform: scale(1.02);
    box-shadow: 0 0 0 2px ${Colors.LovablePrimary};
  }

  .de-checkout-overview__zone--category:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .de-checkout-overview__zone--stage .de-checkout-overview__zone-label {
    color: #fff;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .de-checkout-overview__zone-label {
    font-size: clamp(9px, 2.4vw, 12px);
    font-weight: 800;
    color: ${Colors.TexColor};
    line-height: 1.1;
  }

  .de-checkout-overview__zone-meta,
  .de-checkout-overview__zone-price {
    font-size: clamp(8px, 2vw, 10px);
    font-weight: 600;
    color: ${Colors.TexColor};
  }

  .de-checkout-overview__zone-cta {
    font-size: 9px;
    font-weight: 700;
    color: ${Colors.LovablePrimary};
  }

  .de-checkout-overview__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
  }

  .de-checkout-overview__card {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #fff;
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
  }

  .de-checkout-overview__card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .de-checkout-overview__card-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .de-checkout-overview__card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-checkout-overview__card-body strong {
    font-size: 14px;
    color: ${Colors.TexColor};
  }

  .de-checkout-overview__card-body small {
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-overview__card-arrow {
    font-size: 18px;
    color: ${Colors.LovablePrimary};
    font-weight: 700;
  }

  .de-checkout-category-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    padding: calc(8px + env(safe-area-inset-top)) 12px calc(88px + env(safe-area-inset-bottom));
    overflow: hidden;
  }

  .de-cat-picker {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .de-cat-picker__toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  .de-cat-picker__back {
    border: none;
    background: #fff;
    color: ${Colors.LovablePrimary};
    font-size: 13px;
    font-weight: 700;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid ${Colors.Line};
    cursor: pointer;
    flex-shrink: 0;
  }

  .de-cat-picker__toolbar-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .de-cat-picker__toolbar-meta strong {
    display: block;
    font-size: 15px;
    color: ${Colors.TexColor};
  }

  .de-cat-picker__toolbar-meta small {
    display: block;
    font-size: 11px;
    color: ${Colors.Placeholder};
  }

  .de-cat-picker__header-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .de-cat-picker__stage-banner {
    text-align: center;
    background: #334155;
    color: #fff;
    border-radius: 10px;
    padding: 8px 12px;
    margin-bottom: 8px;
    flex-shrink: 0;
  }

  .de-cat-picker__stage-banner span {
    display: block;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .de-cat-picker__stage-banner small {
    font-size: 10px;
    opacity: 0.85;
  }

  .de-cat-picker__map-viewport {
    flex: 1;
    min-height: 0;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #fff;
    padding: 8px;
  }

  .de-cat-picker__map-canvas {
    min-height: 480px;
    position: relative;
    width: 100%;
  }

  .de-cat-map__zone {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4px;
    overflow: hidden;
  }

  .de-cat-map__zone--stage {
    z-index: 3;
  }

  .de-cat-map__zone--stage .de-cat-map__zone-label {
    color: #fff;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .de-cat-map__zone--active {
    z-index: 2;
  }

  .de-cat-map__zone-label {
    font-size: clamp(8px, 2vw, 11px);
    font-weight: 800;
    color: ${Colors.TexColor};
    line-height: 1.1;
    text-align: center;
  }

  .de-cat-map__zone-label--active {
    color: ${Colors.LovablePrimary};
  }

  .de-cat-map__seats {
    display: grid;
    gap: 3px;
    width: 100%;
    height: 100%;
    padding: 4px;
    align-content: center;
  }

  .de-cat-map-seat {
    min-height: 28px;
    border-radius: 6px;
    border: 1px solid ${Colors.Line};
    background: #fff;
    font-size: clamp(8px, 2.2vw, 11px);
    font-weight: 800;
    cursor: pointer;
    padding: 2px;
    line-height: 1.1;
  }

  @media (min-width: 480px) {
    .de-cat-map-seat {
      min-height: 34px;
      font-size: 11px;
    }
  }

  .de-cat-map-seat--available {
    border-color: #86EFAC;
    background: #F0FDF4;
    color: #166534;
  }

  .de-cat-map-seat--reserved {
    border-color: #FCD34D;
    background: #FFFBEB;
    color: #92400E;
  }

  .de-cat-map-seat--sold {
    border-color: #E2E8F0;
    background: #F8FAFC;
    color: #94A3B8;
    cursor: not-allowed;
  }

  .de-cat-map-seat--selected {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimary};
    color: #fff;
    box-shadow: 0 0 0 2px ${Colors.LovablePrimaryLight};
  }

  .de-cat-map-seat:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .de-cat-picker__focus-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
    flex-shrink: 0;
  }

  .de-cat-picker__focus-card strong {
    display: block;
    font-size: 14px;
  }

  .de-cat-picker__focus-card span {
    display: block;
    font-size: 13px;
  }

  .de-cat-picker__focus-card small {
    display: block;
    font-size: 11px;
    color: ${Colors.Placeholder};
    margin-top: 2px;
  }

  .de-cat-picker__focus-price {
    text-align: right;
  }

  .de-cat-picker__focus-price strong {
    font-size: 17px;
    color: ${Colors.LovablePrimary};
  }

  .de-cat-picker__legend {
    margin-top: 8px;
    flex-shrink: 0;
  }

  .de-reservation-clock {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 12px 0;
    padding: 14px 16px;
    border-radius: 16px;
    border: 2px solid ${Colors.LovablePrimary};
    background: linear-gradient(135deg, ${Colors.LovablePrimaryLight}, #fff);
    box-shadow: 0 8px 24px rgba(88, 86, 235, 0.12);
  }

  .de-reservation-clock--urgent {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2, #fff);
    animation: de-pulse-urgent 1.2s ease-in-out infinite;
  }

  @keyframes de-pulse-urgent {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.2); }
    50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  }

  .de-reservation-clock__ring {
    flex-shrink: 0;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: 3px solid ${Colors.LovablePrimary};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fff;
  }

  .de-reservation-clock--urgent .de-reservation-clock__ring {
    border-color: #ef4444;
  }

  .de-reservation-clock__icon {
    font-size: 16px;
    line-height: 1;
  }

  .de-reservation-clock__time {
    font-size: 15px;
    font-weight: 800;
    color: ${Colors.LovablePrimary};
    line-height: 1.1;
  }

  .de-reservation-clock--urgent .de-reservation-clock__time {
    color: #ef4444;
  }

  .de-reservation-clock__body strong {
    display: block;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .de-reservation-clock__body p {
    margin: 0;
    font-size: 12px;
    color: ${Colors.Placeholder};
    line-height: 1.4;
  }

  .de-reservation-clock__action {
    margin-top: 8px;
    border: none;
    background: ${Colors.LovablePrimary};
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    padding: 8px 14px;
    border-radius: 999px;
    cursor: pointer;
  }

  .de-checkout-bottom-bar__reserve-note {
    margin: 0 0 8px;
    font-size: 12px;
    color: ${Colors.Placeholder};
    text-align: center;
  }

  .de-checkout-seating-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-checkout-seating-legend__dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 3px;
    margin-right: 4px;
    vertical-align: middle;
  }

  .de-seat-chip--sold {
    opacity: 0.55;
    background: #fee2e2;
    border-color: #fca5a5;
    color: #991b1b;
    cursor: not-allowed;
  }

  .de-seat-chip--reserved {
    background: #fef9c3;
    border-color: #fde047;
    color: #854d0e;
    cursor: not-allowed;
  }

  .de-fp-tool--danger:not(:disabled) {
    color: #dc2626;
  }

  .de-ticket-preview {
    padding: 12px 0;
    border-bottom: 1px solid ${Colors.Line};
  }

  .de-ticket-preview__qr {
    width: 160px;
    height: 160px;
    margin-top: 10px;
    object-fit: contain;
  }

  .de-integration-notice {
    display: flex;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    margin-bottom: 16px;
    border: 1px solid transparent;
  }

  .de-integration-notice--warning {
    background: #fff7ed;
    border-color: #fdba74;
    color: #9a3412;
  }

  .de-integration-notice--info {
    background: #eff6ff;
    border-color: #93c5fd;
    color: #1e3a8a;
  }

  .de-integration-notice__icon {
    font-size: 18px;
    line-height: 1.2;
  }

  .de-integration-notice__title {
    margin: 0 0 4px;
    font-weight: 700;
    font-size: 14px;
  }

  .de-integration-notice__message {
    margin: 0;
    font-size: 13px;
    line-height: 1.45;
  }

  .de-simulated-gateway__panel {
    margin-top: 12px;
    padding: 16px;
    border-radius: 16px;
    border: 1px dashed ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-simulated-gateway__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .de-simulated-gateway__brand {
    font-weight: 800;
    color: ${Colors.LovablePrimary};
  }

  .de-simulated-gateway__badge {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
  }

  .de-simulated-gateway__amount {
    font-size: 28px;
    font-weight: 800;
    margin: 8px 0;
  }

  .de-simulated-gateway__amount span {
    font-size: 14px;
    font-weight: 600;
  }

  .de-form-file {
    display: block;
    font-size: 13px;
    color: ${Colors.LovableMuted};
  }

  .de-form-file input {
    display: block;
    margin-top: 6px;
    width: 100%;
  }

  .de-chat-layout {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .de-chat-room-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .de-chat-room-item {
    width: 100%;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    border: none;
    border-bottom: 1px solid ${Colors.Line};
    background: #fff;
    text-align: left;
    cursor: pointer;
  }

  .de-chat-room-item__avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .de-chat-room-item__body {
    flex: 1;
    min-width: 0;
  }

  .de-chat-room-item__title {
    margin: 0;
    font-weight: 700;
  }

  .de-chat-room-item__preview {
    margin: 4px 0 0;
    font-size: 13px;
    color: ${Colors.LovableMuted};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-chat-room-item__time {
    font-size: 11px;
    color: ${Colors.LovableMuted};
  }

  .de-chat-thread {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 320px;
  }

  .de-chat-bubble {
    max-width: 85%;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f3f4f6;
  }

  .de-chat-bubble--own {
    align-self: flex-end;
    background: ${Colors.LovablePrimaryLight};
  }

  .de-chat-bubble__author {
    margin: 0 0 4px;
    font-size: 12px;
    font-weight: 700;
  }

  .de-chat-bubble__time {
    display: block;
    margin-top: 4px;
    font-size: 11px;
    color: ${Colors.LovableMuted};
  }

  .de-chat-compose {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 12px;
  }

  .de-chat-compose input {
    flex: 1;
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    padding: 10px 14px;
  }

  .de-chat-compose button {
    border: none;
    border-radius: 999px;
    padding: 10px 16px;
    background: ${Colors.LovablePrimary};
    color: #fff;
    font-weight: 700;
  }

  .de-chat-compose--disabled input,
  .de-chat-compose--disabled button {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .de-ticket-card__header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }

  .de-ticket-card__toggle {
    color: ${Colors.LovableMuted};
  }

  .de-ticket-card__detail {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid ${Colors.Line};
  }

  .de-profile-edit-avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
  }

  .de-profile-avatar--button {
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .de-follow-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .de-follow-list__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid ${Colors.Line};
  }

  .de-follow-list__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .de-follow-list__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .de-gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .de-gallery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .de-gallery-grid__item {
    aspect-ratio: 1;
    border: none;
    padding: 0;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
  }

  .de-gallery-grid__item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .de-gallery-viewer {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1200;
    padding: 24px;
  }

  .de-gallery-viewer__content {
    max-width: 420px;
    width: 100%;
    text-align: center;
  }

  .de-gallery-viewer__content img {
    width: 100%;
    border-radius: 16px;
    margin-bottom: 12px;
  }

  .de-gallery-viewer__delete {
    border: none;
    background: #ef4444;
    color: #fff;
    padding: 10px 16px;
    border-radius: 999px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-chat-room-item__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  /* ── App header (Lovable glass TopBar) ── */
  .de-app-header {
    background: ${Colors.LovableBackground};
    position: sticky;
    top: 0;
    z-index: 900;
  }

  .de-app-header .de-safe-top { background: ${Colors.Blanco}; height: 0; }

  .de-app-header__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px 12px;
    gap: 8px;
  }

  .de-app-header__menu {
    position: relative;
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 12px;
    background: ${Colors.LovableCard};
    box-shadow: ${Shadows.card};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .de-app-header__menu:hover {
    background: ${Colors.LovableAccent};
  }

  .de-app-header__menu-lines {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .de-app-header__menu-lines span {
    display: block;
    width: 16px;
    height: 2px;
    background: ${Colors.LovablePrimary};
    border-radius: 2px;
  }

  .de-app-header__logo-text {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0 0 6px;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: baseline;
    gap: 0;
    font-size: 24px;
    letter-spacing: -0.02em;
    color: ${Colors.LovableForeground};
    position: relative;
  }

  .de-app-header__logo-do {
    font-weight: 800;
    color: ${Colors.LovablePrimary};
  }

  .de-app-header__logo-dot {
    font-weight: 300;
    color: ${Colors.LovableForeground};
    margin: 0 1px;
  }

  .de-app-header__logo-events {
    font-weight: 300;
    color: ${Colors.LovableForeground};
  }

  .de-app-header__logo-underline {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 2px;
    background: ${Colors.LovableForeground};
    border-radius: 1px;
  }

  .de-app-header__actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .de-app-header__menu-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${Colors.Red_400};
  }

  .de-app-header__icon-btn {
    position: relative;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .de-app-header__icon-btn:hover {
    opacity: 0.8;
  }

  .de-app-header__badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 20px;
    height: 20px;
    padding: 0 4px;
    border-radius: 999px;
    background: ${Colors.LovableDestructive};
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Side drawer ── */
  .de-drawer-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    border: none;
    background: rgba(23, 27, 46, 0.4);
    backdrop-filter: blur(4px);
    cursor: pointer;
  }

  .de-drawer {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(320px, 84vw);
    z-index: 1101;
    background: ${Colors.LovableDrawer};
    color: #fff;
    transform: translateX(-105%);
    transition: transform 0.3s ease;
    padding: calc(24px + env(safe-area-inset-top, 0px)) 20px 28px;
    overflow-y: auto;
    box-shadow: ${Shadows.float};
  }

  .de-drawer--open { transform: translateX(0); }

  .de-drawer__profile {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    position: relative;
    padding-right: 28px;
  }

  .de-drawer__profile-trigger {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
    padding: 0;
  }

  .de-drawer__profile-chevron {
    margin-left: auto;
    font-size: 12px;
    color: rgba(255,255,255,0.65);
    flex-shrink: 0;
  }

  .de-drawer-user-menu {
    background: rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 16px 12px 8px;
    margin-bottom: 16px;
  }

  .de-drawer-user-menu__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 4px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
    margin-bottom: 8px;
  }

  .de-drawer-user-menu__hero strong {
    font-size: 16px;
    margin-top: 8px;
  }

  .de-drawer-user-menu__hero span {
    font-size: 12px;
    color: rgba(255,255,255,0.72);
  }

  .de-drawer-user-menu__nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-drawer-user-menu__link {
    display: flex;
    align-items: center;
    width: 100%;
    border: none;
    background: transparent;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 8px;
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
  }

  .de-drawer-user-menu__link:hover {
    background: rgba(255,255,255,0.08);
  }

  .de-drawer__profile-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .de-drawer__profile-text strong {
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-drawer__profile-text span {
    font-size: 12px;
    color: rgba(255,255,255,0.72);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-drawer__profile .de-drawer__close {
    position: absolute;
    top: 0;
    right: 0;
  }

  .de-drawer__link-icon {
    display: inline-grid;
    place-items: center;
    width: 36px;
    height: 36px;
    margin-right: 12px;
    border-radius: 12px;
    font-size: 16px;
    flex-shrink: 0;
  }

  .de-drawer__link-icon--rose { background: rgba(244, 63, 94, 0.9); }
  .de-drawer__link-icon--sky { background: rgba(56, 189, 248, 0.9); }
  .de-drawer__link-icon--amber { background: rgba(251, 191, 36, 0.9); }
  .de-drawer__link-icon--emerald { background: rgba(52, 211, 153, 0.9); }
  .de-drawer__link-icon--fuchsia { background: rgba(232, 121, 249, 0.9); }
  .de-drawer__link-icon--slate { background: rgba(148, 163, 184, 0.9); }
  .de-drawer__link-icon--blue { background: rgba(96, 165, 250, 0.9); }
  .de-drawer__link-icon--indigo { background: rgba(129, 140, 248, 0.9); }

  .de-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .de-drawer__guest { font-size: 18px; font-weight: 700; }

  .de-drawer__close {
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    line-height: 1;
    width: 36px;
    height: 36px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    transition: background 0.15s;
  }

  .de-drawer__close:hover { background: rgba(255, 255, 255, 0.2); }

  .de-drawer__login {
    border: none;
    background: transparent;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 24px;
    padding: 0;
  }

  .de-drawer__section {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    margin: 24px 0 8px;
    padding: 0 4px;
  }

  .de-drawer__nav { display: flex; flex-direction: column; gap: 2px; }

  .de-drawer__link {
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.95);
    text-align: left;
    padding: 10px 6px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 12px;
    font-family: inherit;
    transition: background 0.15s;
  }

  .de-drawer__link:hover { background: rgba(255, 255, 255, 0.1); }

  .de-drawer__logout {
    margin-top: auto;
    border: 1px solid rgba(255,255,255,0.25);
    background: transparent;
    color: #fff;
    border-radius: 999px;
    padding: 12px 16px;
    cursor: pointer;
    width: 100%;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: inherit;
  }

  /* ── Profile extras ── */
  .de-profile-experience__bar {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin: 12px 0 8px;
    height: 10px;
  }

  .de-profile-experience__seg { border-radius: 999px; }
  .de-profile-experience__seg--1 { background: #f9c5d1; }
  .de-profile-experience__seg--2 { background: #f6c89a; }
  .de-profile-experience__seg--3 { background: #f3e6a5; }
  .de-profile-experience__seg--4 { background: #b8e6c8; }
  .de-profile-experience__seg--inactive { opacity: 0.35; }
  .de-profile-experience__bar { position: relative; }
  .de-profile-experience__marker {
    position: absolute;
    top: -12px;
    transform: translateX(-50%);
  }

  .de-profile-experience__marker {
    position: absolute;
    right: 8%;
    top: -14px;
    font-size: 10px;
    color: ${Colors.Negro};
  }

  .de-profile-experience__label {
    text-align: center;
    font-size: 13px;
    color: ${Colors.Grey_Soft};
    margin-bottom: 12px;
  }

  .de-profile-experience__stats { margin-top: 8px; }

  .de-profile-plan-detail {
    border: 1px solid ${Colors.NightBlue_600};
    background: transparent;
    color: ${Colors.NightBlue_600};
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-profile-quick-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .de-profile-quick-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    border-radius: 16px;
    background: ${Colors.LovableCard};
    padding: 16px 10px;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    border: 1px solid ${Colors.LovableBorder};
    cursor: pointer;
    text-align: center;
    font-family: inherit;
  }

  .de-profile-quick-stat__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .de-profile-quick-stat__icon--heart { background: rgba(239, 68, 68, 0.12); }
  .de-profile-quick-stat__icon--users { background: rgba(14, 165, 233, 0.12); }
  .de-profile-quick-stat__icon--posts { background: rgba(88, 86, 235, 0.12); }

  .de-profile-quick-stat span {
    font-size: 12px;
    color: ${Colors.LovableMuted};
  }

  .de-profile-quick-stat strong {
    font-size: 18px;
    font-weight: 700;
    color: ${Colors.LovableForeground};
  }

  .de-profile-favorites__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    font-size: 14px;
    color: ${Colors.TexColor};
    margin-top: 8px;
  }

  .de-profile-name { color: ${Colors.NightBlue_800}; }

  /* ── Notifications (app store) ── */
  .de-notifications-header {
    padding: 8px 16px 12px;
    background: ${Colors.Blanco};
  }

  .de-notifications-header__back {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: ${Colors.NightBlue_200};
    color: ${Colors.NightBlue_800};
    font-size: 22px;
    cursor: pointer;
    margin-bottom: 8px;
  }

  .de-notifications-header h1 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .de-notifications-header__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .de-notifications-header__action {
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .de-notifications-header__action--danger { color: ${Colors.Red_400}; }

  .de-notification-list--app { gap: 0; }

  .de-notification-app-item {
    display: flex;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid ${Colors.LovableBorder};
  }

  .de-notification-app-item__icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${Colors.NightBlue_200};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .de-notification-app-item__body { flex: 1; min-width: 0; }

  .de-notification-app-item__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  .de-notification-app-item__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${Colors.NightBlue_600};
    flex-shrink: 0;
  }

  .de-notification-app-item__body p {
    font-size: 14px;
    color: ${Colors.Grey_Soft};
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .de-notification-app-item__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: ${Colors.Grey_Soft};
    margin-bottom: 4px;
  }

  .de-notification-app-item__time {
    font-size: 12px;
    color: ${Colors.Grey_Soft};
  }

  .de-notification-app-item__link {
    margin-top: 8px;
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  /* ── Chat list (app store) ── */
  .de-chat-hero {
    background: linear-gradient(180deg, ${Colors.NightBlue_600} 0%, ${Colors.NightBlue_700} 100%);
    border-radius: 0 0 40px 40px;
    padding: 0 16px 48px;
    position: relative;
  }

  .de-chat-hero .de-safe-top { background: transparent; height: 0; }

  .de-chat-hero__back {
    border: none;
    background: transparent;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    padding: 12px 0;
  }

  .de-chat-hero__icon {
    width: 72px;
    height: 72px;
    margin: 8px auto 0;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
  }

  .de-chat-list-panel {
    margin-top: -24px;
    padding: 0 16px 24px;
  }

  .de-chat-list-panel h1 {
    font-size: 22px;
    font-weight: 700;
    color: ${Colors.NightBlue_800};
    margin-bottom: 12px;
  }

  .de-chat-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .de-chat-tabs__btn {
    flex: 1;
    border: none;
    border-radius: 999px;
    padding: 10px 12px;
    background: ${Colors.NightBlue_200};
    color: ${Colors.NightBlue_800};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-chat-tabs__btn--active {
    background: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-chat-room-list--app { list-style: none; padding: 0; margin: 0; }

  .de-chat-room-item--app {
    width: 100%;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(15,23,42,0.06);
    margin-bottom: 10px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .de-chat-room-item__side {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .de-chat-room-item__badge {
    min-width: 20px;
    height: 20px;
    border-radius: 999px;
    background: ${Colors.NightBlue_600};
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
  }

  .de-chat-room-item__chevron {
    color: ${Colors.NightBlue_600};
    font-size: 18px;
  }

  /* ── Messenger chat ── */
  .de-messenger-list {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: #fff;
  }

  .de-messenger-list__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
    border-bottom: 1px solid ${Colors.LovableBorder};
    background: #fff;
  }

  .de-messenger-list__header h1 {
    margin: 0;
    font-size: 22px;
    color: ${Colors.Negro};
  }

  .de-messenger-list__header span {
    font-size: 12px;
    color: #6B7280;
  }

  .de-messenger-list__back {
    border: none;
    background: transparent;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    color: ${Colors.NightBlue_600};
    padding: 0 4px;
  }

  .de-messenger-list--fb {
    background: #fff;
  }

  .de-messenger-list__header--fb {
    border-bottom: none;
    padding-bottom: 8px;
  }

  .de-messenger-list__brand {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .de-messenger-list__header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .de-messenger-list__icon-btn {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: #F0F2F5;
    color: ${Colors.NightBlue_600};
    font-size: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .de-messenger-list__icon-btn:hover {
    background: #E4E6EB;
  }

  .de-messenger-list__search-box--fb {
    margin: 0 16px 10px;
  }

  .de-messenger-list__search-box--fb input {
    border: none;
    background: #F0F2F5;
    border-radius: 999px;
    padding: 10px 14px 10px 40px;
    font-size: 15px;
  }

  .de-messenger-list__search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    opacity: 0.55;
    pointer-events: none;
  }

  .de-messenger-list__search-results-wrap {
    margin: 0 16px 8px;
  }

  .de-messenger-active-users {
    padding: 4px 0 12px;
    border-bottom: 1px solid #F0F2F5;
  }

  .de-messenger-active-users__strip {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding: 0 16px 4px;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .de-messenger-active-users__strip::-webkit-scrollbar {
    display: none;
  }

  .de-messenger-active-users__self,
  .de-messenger-active-users__item {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    width: 72px;
    padding: 0;
    font-family: inherit;
    font-size: 12px;
    color: #050505;
    scroll-snap-align: start;
  }

  .de-messenger-active-users__avatar-wrap {
    position: relative;
    display: inline-flex;
  }

  .de-messenger-active-users__dot {
    position: absolute;
    right: 2px;
    bottom: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: #31A24C;
  }

  .de-messenger-filter-chips {
    display: flex;
    gap: 8px;
    padding: 10px 16px 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .de-messenger-filter-chips::-webkit-scrollbar {
    display: none;
  }

  .de-messenger-filter-chips__chip {
    flex: 0 0 auto;
    border: none;
    border-radius: 999px;
    background: #F0F2F5;
    color: #050505;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .de-messenger-filter-chips__chip--active {
    background: #E7F3FF;
    color: ${Colors.NightBlue_600};
  }

  .de-messenger-tabs {
    padding: 8px 16px 0;
  }

  .de-messenger-list__body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0 24px;
  }

  .de-messenger-room-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .de-messenger-room {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    border: none;
    background: transparent;
    padding: 12px 16px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .de-messenger-room:hover {
    background: #F3F4F6;
  }

  .de-messenger-room__body {
    flex: 1;
    min-width: 0;
  }

  .de-messenger-room__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .de-messenger-room__top strong {
    font-size: 15px;
    color: ${Colors.Negro};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-messenger-room__top time {
    font-size: 11px;
    color: #9CA3AF;
    flex-shrink: 0;
  }

  .de-messenger-room__body p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6B7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-messenger-room__badge {
    min-width: 20px;
    height: 20px;
    border-radius: 999px;
    background: ${Colors.NightBlue_600};
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
  }

  .de-chat-page--thread {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    background: #F0F2F5;
  }

  .de-messenger-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px;
    background: ${Colors.LovableBackground};
    border-bottom: 1px solid ${Colors.LovableBorder};
  }

  .de-messenger-header__back {
    border: none;
    background: transparent;
    font-size: 22px;
    cursor: pointer;
    color: ${Colors.NightBlue_600};
    padding: 4px;
  }

  .de-messenger-header__meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .de-messenger-header__meta strong {
    font-size: 15px;
    color: ${Colors.Negro};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-messenger-header__meta span {
    font-size: 12px;
    color: #65676B;
  }

  .de-messenger-header__meta--clickable {
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }

  .de-messenger-header__meta--clickable:disabled {
    cursor: default;
  }

  .de-messenger-header__status--online {
    color: #31A24C !important;
  }

  .de-messenger-header__avatar-btn {
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
  }

  .de-messenger-header__avatar-btn:disabled {
    cursor: default;
  }

  .de-messenger-header__action {
    margin-left: auto;
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    padding: 6px;
    border-radius: 10px;
  }

  .de-messenger-header__action:hover {
    background: rgba(15, 23, 42, 0.06);
  }

  .de-messenger-header--event .de-messenger-header__meta strong {
    font-size: 16px;
  }

  .de-messenger-header__event-image {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid ${Colors.Line};
    background: #E2E8F0;
  }

  .de-messenger-room__event-image {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid ${Colors.Line};
    background: #E2E8F0;
  }

  .de-chat-members {
    flex: 1;
    overflow-y: auto;
    background: #fff;
  }

  .de-chat-members__hero {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border-bottom: 1px solid ${Colors.Line};
    background: #F8FAFC;
  }

  .de-chat-members__hero-image {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    object-fit: cover;
    border: 1px solid ${Colors.Line};
    background: #E2E8F0;
  }

  .de-chat-members__hero strong {
    display: block;
    font-size: 16px;
    color: #0F172A;
    margin-bottom: 4px;
  }

  .de-chat-members__hero p {
    margin: 0;
    font-size: 13px;
    color: #64748B;
  }

  .de-chat-members__list {
    list-style: none;
    margin: 0;
    padding: 8px 0;
  }

  .de-chat-members__item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #F1F5F9;
  }

  .de-chat-members__profile {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    min-width: 0;
  }

  .de-chat-members__profile:disabled {
    cursor: default;
  }

  .de-chat-members__profile:not(:disabled):hover .de-chat-members__meta strong {
    color: ${Colors.NightBlue_600};
  }

  .de-chat-members__meta {
    flex: 1;
    min-width: 0;
  }

  .de-chat-members__meta strong {
    display: block;
    font-size: 15px;
    color: #0F172A;
  }

  .de-chat-members__meta span {
    display: block;
    font-size: 12px;
    color: #94A3B8;
    margin-top: 2px;
  }

  .de-chat-members__actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .de-chat-members__dm,
  .de-chat-members__kick {
    border: 1px solid ${Colors.Line};
    background: #fff;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-chat-members__dm {
    color: ${Colors.NightBlue_600};
    border-color: rgba(37, 99, 235, 0.25);
    background: ${Colors.LovablePrimaryLight};
  }

  .de-chat-members__kick {
    color: #B91C1C;
    border-color: #FECACA;
    background: #FEF2F2;
  }

  .de-chat-subtabs {
    display: flex;
    gap: 8px;
    padding: 0 16px 10px;
    align-items: center;
  }

  .de-chat-subtabs__btn {
    border: none;
    background: #eef2ff;
    color: #475569;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-chat-subtabs__btn--active {
    background: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-chat-subtabs__create {
    margin-left: auto;
    border: none;
    background: #dbeafe;
    color: ${Colors.NightBlue_600};
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-messenger-room__restore {
    margin: 0 16px 8px;
    width: calc(100% - 32px);
    border: 1px dashed ${Colors.Line};
    background: #f8fafc;
    border-radius: 10px;
    padding: 8px;
    font-size: 12px;
    font-weight: 600;
    color: ${Colors.NightBlue_600};
    cursor: pointer;
  }

  .de-chat-group-panel__body {
    padding: 12px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .de-chat-group-panel__body input {
    width: 100%;
    border: 1px solid ${Colors.Line};
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 14px;
  }

  .de-chat-group-panel__hint {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }

  .de-chat-group-panel__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .de-chat-group-panel__chips button {
    border: none;
    background: #eef2ff;
    color: #334155;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    cursor: pointer;
  }

  .de-chat-group-panel__users {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 220px;
    overflow-y: auto;
  }

  .de-chat-group-panel__users li button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    border: none;
    background: transparent;
    padding: 8px;
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
  }

  .de-chat-group-panel__users li button.is-selected {
    background: #eef2ff;
  }

  .de-chat-group-panel__create {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 12px;
    padding: 12px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-chat-group-panel__create:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .de-messenger-thread {
    flex: 1;
    overflow-y: auto;
    padding: 16px 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .de-messenger-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    max-width: 88%;
  }

  .de-messenger-row--own {
    align-self: flex-end;
    flex-direction: row-reverse;
    max-width: 78%;
  }

  .de-messenger-row__avatar {
    flex-shrink: 0;
  }

  .de-messenger-bubble {
    background: #fff;
    border-radius: 18px;
    padding: 8px 12px;
    box-shadow: 0 1px 1px rgba(15, 23, 42, 0.08);
  }

  .de-messenger-bubble--own {
    background: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-messenger-bubble__author {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: ${Colors.NightBlue_600};
    margin-bottom: 2px;
  }

  .de-messenger-bubble p {
    margin: 0;
    font-size: 14px;
    line-height: 1.45;
    word-break: break-word;
  }

  .de-messenger-bubble time {
    display: block;
    margin-top: 4px;
    font-size: 10px;
    opacity: 0.72;
    text-align: right;
  }

  .de-messenger-compose--event {
    background: #F4F5FE;
    border-top: 1px solid ${Colors.Line};
  }

  .de-messenger-compose--event input {
    background: #FFFFFF;
    border: 1px solid #DDDDDD;
    border-radius: 4px;
  }

  .de-messenger-compose--event .de-messenger-compose__icon,
  .de-messenger-compose--event .de-messenger-compose__send {
    color: ${Colors.NightBlue_600};
    background: transparent;
  }

  .de-messenger-compose {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
    background: #fff;
    border-top: 1px solid ${Colors.LovableBorder};
  }

  .de-messenger-compose input {
    flex: 1;
    border: none;
    background: #F0F2F5;
    border-radius: 999px;
    padding: 10px 14px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
  }

  .de-messenger-compose__send {
    border: none;
    width: 38px;
    height: 38px;
    border-radius: 999px;
    background: ${Colors.NightBlue_600};
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .de-messenger-compose__send:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .de-messenger-compose__icon {
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
  }

  .de-messenger-emoji-bar {
    display: flex;
    gap: 8px;
    padding: 8px 16px 12px;
    overflow-x: auto;
    background: #fff;
    border-top: 1px solid ${Colors.Line};
  }

  .de-messenger-emoji-bar button {
    border: none;
    background: #F8FAFC;
    border-radius: 10px;
    font-size: 22px;
    padding: 6px 10px;
    cursor: pointer;
  }

  .de-messenger-bubble__image {
    max-width: 220px;
    border-radius: 12px;
    display: block;
  }

  .de-messenger-bubble__video {
    max-width: 240px;
    border-radius: 12px;
    display: block;
    background: #0f172a;
  }

  .de-messenger-bubble__file {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.06);
    color: inherit;
    text-decoration: none;
    max-width: 240px;
  }

  .de-messenger-bubble__file-icon {
    font-size: 22px;
    line-height: 1;
  }

  .de-messenger-bubble__file-name {
    font-size: 14px;
    font-weight: 600;
    word-break: break-word;
  }

  .de-messenger-bubble__location {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(37, 99, 235, 0.08);
    color: inherit;
    text-decoration: none;
    max-width: 240px;
  }

  .de-messenger-bubble__location strong {
    display: block;
    font-size: 14px;
  }

  .de-messenger-bubble__location small {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: #64748b;
  }

  .de-messenger-bubble__location-pin {
    font-size: 24px;
    line-height: 1;
  }

  .de-messenger-bubble__event {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 12px;
    background: #fff;
    cursor: pointer;
    text-align: left;
    max-width: 260px;
    width: 100%;
  }

  .de-messenger-bubble__event-img,
  .de-messenger-bubble__event-fallback {
    width: 52px;
    height: 52px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }

  .de-messenger-bubble__event-meta {
    min-width: 0;
  }

  .de-messenger-bubble__event-meta strong {
    display: block;
    font-size: 14px;
    line-height: 1.3;
  }

  .de-messenger-bubble__event-meta span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: #64748b;
  }

  .de-messenger-compose__attach-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .de-messenger-attach-menu {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    min-width: 180px;
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
    border: 1px solid ${Colors.Line};
    padding: 6px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-messenger-attach-menu button {
    display: flex;
    align-items: center;
    gap: 10px;
    border: none;
    background: transparent;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    text-align: left;
  }

  .de-messenger-attach-menu button:hover {
    background: #f1f5f9;
  }

  .de-chat-modal-overlay,
  .de-chat-event-picker {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 300;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 16px;
  }

  .de-chat-blocked-panel {
    width: min(100%, 480px);
    max-height: 70vh;
    background: #fff;
    border-radius: 18px 18px 12px 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .de-chat-blocked-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid ${Colors.Line};
  }

  .de-chat-blocked-panel__header h2 {
    margin: 0;
    font-size: 17px;
    color: #050505;
  }

  .de-chat-blocked-panel__header button {
    border: none;
    background: transparent;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    color: #65676B;
  }

  .de-chat-blocked-panel__body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0 16px;
  }

  .de-chat-blocked-panel__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .de-chat-blocked-panel__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid #F0F2F5;
  }

  .de-chat-blocked-panel__profile {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    min-width: 0;
  }

  .de-chat-blocked-panel__profile strong {
    display: block;
    font-size: 15px;
    color: #050505;
  }

  .de-chat-blocked-panel__profile span {
    display: block;
    font-size: 12px;
    color: #65676B;
    margin-top: 2px;
  }

  .de-chat-blocked-panel__unblock {
    border: 1px solid ${Colors.Line};
    background: #fff;
    border-radius: 999px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 600;
    color: ${Colors.NightBlue_600};
    cursor: pointer;
    flex-shrink: 0;
  }

  .de-chat-event-picker__panel {
    width: min(100%, 480px);
    max-height: 70vh;
    background: #fff;
    border-radius: 18px 18px 12px 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .de-chat-event-picker__panel header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid ${Colors.Line};
  }

  .de-chat-event-picker__panel header button {
    border: none;
    background: transparent;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    color: #64748b;
  }

  .de-chat-event-picker__body {
    overflow-y: auto;
    padding: 8px;
  }

  .de-chat-event-picker__body ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .de-chat-event-picker__body li button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    border: none;
    background: transparent;
    padding: 10px;
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
  }

  .de-chat-event-picker__body li button:hover {
    background: #f8fafc;
  }

  .de-chat-event-picker__body li img,
  .de-chat-event-picker__fallback {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
  }

  .de-chat-event-picker__body li strong {
    display: block;
    font-size: 14px;
  }

  .de-chat-event-picker__body li span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: #64748b;
  }

  .de-chat-media-grid__item video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #0f172a;
  }

  .de-chat-page--event {
    background: #F4F5FE;
  }

  .de-chat-event-tabs {
    display: flex;
    gap: 8px;
    padding: 12px 16px 0;
    background: #F4F5FE;
  }

  .de-chat-event-tabs__btn {
    flex: 1;
    border: none;
    border-radius: 12px 12px 0 0;
    padding: 10px 12px;
    font-weight: 600;
    font-size: 14px;
    background: rgba(255, 255, 255, 0.6);
    color: #64748B;
    cursor: pointer;
  }

  .de-chat-event-tabs__btn--active {
    background: #FFFFFF;
    color: ${Colors.NightBlue_600};
    box-shadow: 0 -2px 8px rgba(15, 23, 42, 0.06);
    border-bottom: 3px solid ${Colors.NightBlue_600};
  }

  .de-chat-assistants {
    padding: 12px 16px;
    background: #F4F5FE;
    border-bottom: 1px solid ${Colors.Line};
  }

  .de-chat-assistants h2 {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
    color: #334155;
  }

  .de-chat-assistants__strip {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }

  .de-chat-assistants__item {
    flex: 0 0 auto;
    width: 72px;
    text-align: center;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
  }

  .de-chat-assistants__item:disabled {
    cursor: default;
    opacity: 0.85;
  }

  .de-chat-assistants__item:not(:disabled):hover span {
    color: ${Colors.NightBlue_600};
  }

  .de-chat-assistants__item span {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.2;
    color: #475569;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .de-chat-assistants__empty {
    margin: 0;
    font-size: 13px;
    color: #94A3B8;
  }

  .de-chat-media-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    padding: 16px;
    overflow-y: auto;
    background: #FFFFFF;
  }

  .de-chat-media-grid__item {
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    background: #E2E8F0;
  }

  .de-chat-media-grid__item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .de-boleteria-page--split {
    min-height: 100vh;
  }

  .de-boleteria-split {
    display: grid;
    grid-template-columns: minmax(280px, 360px) 1fr;
    gap: 0;
    min-height: calc(100vh - 140px);
  }

  @media (max-width: 900px) {
    .de-boleteria-split {
      grid-template-columns: 1fr;
    }
    .de-boleteria-split__detail {
      border-top: 1px solid ${Colors.Line};
    }
  }

  .de-boleteria-split__list {
    border-right: 1px solid ${Colors.Line};
    overflow-y: auto;
    max-height: calc(100vh - 140px);
  }

  .de-boleteria-split__detail {
    padding: 16px;
    overflow-y: auto;
    background: #F8FAFC;
  }

  .de-boleteria-item--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-boleteria-ticket-card--panel {
    max-width: 420px;
    margin: 0 auto;
  }

  .de-boleteria-ticket-card__desc {
    margin: 8px 0 12px;
    color: ${Colors.Placeholder};
    font-size: 14px;
  }

  /* ── Gallery (app store) ── */
  .de-gallery-page {
    min-height: 100%;
    background: ${Colors.Primary};
    padding-bottom: 120px;
  }

  .de-gallery-topbar {
    padding: 8px 16px 16px;
  }

  .de-gallery-topbar__back {
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_800};
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-bottom: 8px;
  }

  .de-gallery-topbar__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .de-gallery-topbar h1 {
    font-size: 24px;
    font-weight: 700;
    color: ${Colors.NightBlue_800};
  }

  .de-gallery-topbar__actions {
    display: flex;
    gap: 8px;
  }

  .de-gallery-topbar__select {
    border: 1px solid ${Colors.NightBlue_600};
    background: transparent;
    color: ${Colors.NightBlue_600};
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-gallery-topbar__add {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-gallery-body { padding: 0 16px; }

  .de-gallery-grid--app {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .de-gallery-grid--app .de-gallery-grid__item {
    aspect-ratio: 1;
    border-radius: 12px;
    overflow: hidden;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .de-gallery-grid__item--selected {
    outline: 3px solid ${Colors.NightBlue_600};
  }

  .de-gallery-selection-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: ${Colors.NightBlue_200};
    margin-bottom: 8px;
  }

  .de-gallery-selection-bar button {
    border: none;
    background: ${Colors.Red_400};
    color: #fff;
    border-radius: 999px;
    padding: 6px 12px;
    cursor: pointer;
  }

  /* ── Map page ── */
  .de-map-page {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    background: #e8f4ea;
  }

  .de-map-stage {
    position: relative;
    flex-shrink: 0;
    height: min(58vh, 520px);
    min-height: 280px;
  }

  .de-map-float-bar {
    position: absolute;
    top: calc(8px + env(safe-area-inset-top, 0px));
    left: 8px;
    right: 8px;
    z-index: 650;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 100%;
    box-sizing: border-box;
    pointer-events: none;
  }

  .de-map-float-bar__row {
    display: flex;
    gap: 6px;
    width: 100%;
    pointer-events: auto;
  }

  .de-map-float-bar--hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .de-map-quick-nav {
    display: flex;
    gap: 8px;
    padding: 8px 12px 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .de-map-quick-nav::-webkit-scrollbar { display: none; }

  .de-map-quick-nav__btn {
    flex: 0 0 auto;
    border: 1px solid ${Colors.LovableBorder};
    background: #fff;
    color: ${Colors.NightBlue_800};
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  }

  .de-map-quick-nav__btn--active {
    background: ${Colors.NightBlue_600};
    border-color: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-map-float-bar__row--main {
    align-items: stretch;
    gap: 8px;
  }

  .de-map-radius-select {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #fff;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 16px;
    padding: 0 10px;
    min-height: 48px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    pointer-events: auto;
  }

  .de-map-radius-select select {
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 700;
    color: ${Colors.LovableForeground};
    min-width: 64px;
    max-width: 88px;
    padding: 8px 0;
    outline: none;
  }

  .de-map-radius-select__icon {
    font-size: 14px;
    flex-shrink: 0;
  }

  .de-map-toolbar {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    background: ${Colors.Blanco};
  }

  .de-map-search {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 16px;
    padding: 10px 12px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  }

  .de-map-search__icon {
    font-size: 14px;
    opacity: 0.55;
  }

  .de-map-search input {
    border: none;
    outline: none;
    flex: 1;
    background: transparent;
    font-size: 14px;
    min-width: 0;
  }

  .de-map-search__locate {
    border: none;
    background: #EEF2FF;
    color: ${Colors.NightBlue_600};
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .de-map-search__locate:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .de-map-radius {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid ${Colors.LovableBorder};
    background: #fff;
    border-radius: 16px;
    padding: 8px 12px;
    font-size: 12px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    white-space: nowrap;
  }

  .de-map-radius__label {
    color: ${Colors.Grey_Soft};
    font-weight: 600;
  }

  .de-map-radius select {
    border: none;
    background: transparent;
    font-size: 11px;
    font-weight: 700;
    outline: none;
    cursor: pointer;
    max-width: 56px;
  }

  .de-map-list-toggle {
    border: none;
    background: #EEF2FF;
    color: ${Colors.NightBlue_600};
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    margin-left: auto;
    flex-shrink: 0;
  }

  .de-map-nearby-list {
    position: relative;
    flex: 1;
    min-height: 0;
    background: #fff;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 20;
  }

  .de-map-nearby-list__head {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 12px 14px 8px;
    border-bottom: 1px solid ${Colors.LovableBorder};
  }

  .de-map-nearby-list__head strong {
    font-size: 14px;
    color: ${Colors.Negro};
  }

  .de-map-nearby-list__head span {
    font-size: 12px;
    color: #6B7280;
  }

  .de-map-nearby-list__scroll {
    overflow-y: auto;
    padding: 6px;
    max-height: min(36vh, 320px);
  }

  .de-map-nearby-list__empty {
    padding: 16px;
    text-align: center;
    color: #6B7280;
    font-size: 13px;
    margin: 0;
  }

  .de-map-nearby-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    border: none;
    background: transparent;
    border-radius: 14px;
    padding: 8px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .de-map-nearby-item--active,
  .de-map-nearby-item:hover {
    background: #EEF2FF;
  }

  .de-map-nearby-item__thumb {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background-size: cover;
    background-position: center;
    flex-shrink: 0;
    background-color: #e5e7eb;
  }

  .de-map-nearby-item__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .de-map-nearby-item__body strong {
    font-size: 13px;
    color: ${Colors.Negro};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-map-nearby-item__body span {
    font-size: 11px;
    color: #6B7280;
  }

  .de-map-nearby-item__body em {
    font-style: normal;
    font-size: 11px;
    color: ${Colors.NightBlue_600};
    font-weight: 700;
  }

  .de-map-loading {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    z-index: 400;
  }

  .de-map-marker-icon {
    background: transparent;
    border: none;
  }

  .de-map-marker {
    position: relative;
    width: 44px;
    height: 52px;
  }

  .de-map-marker__img,
  .de-map-marker__img-el {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 3px solid #fff;
    background-size: cover;
    background-position: center;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
    z-index: 2;
    display: block;
    object-fit: cover;
    background-color: #f1f5f9;
  }

  .de-google-map-marker {
    position: absolute;
    transform: translate(-50%, -100%);
    cursor: pointer;
    z-index: 2;
    pointer-events: auto;
  }

  .de-map-marker__pin {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 16px solid ${Colors.NightBlue_600};
  }

  .de-map-canvas {
    flex: 1;
    min-height: 320px;
    background: linear-gradient(180deg, #d8efd8 0%, #c5e3c5 100%);
    position: relative;
  }

  .de-map-canvas__hint {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
    padding: 24px;
  }

  .de-map-canvas__hint button {
    margin-top: 8px;
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 999px;
    padding: 10px 16px;
    cursor: pointer;
  }

  .de-map-preview {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(92px + env(safe-area-inset-bottom, 0px));
    margin: 0 auto;
    max-width: 420px;
    background: #fff;
    border-radius: 20px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
    z-index: 90;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .de-map-preview__thumb {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${Colors.NightBlue_200};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .de-map-preview__thumb-img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .de-map-preview__body {
    flex: 1;
    min-width: 0;
  }

  .de-map-preview__body strong {
    display: block;
    font-size: 15px;
    color: ${Colors.Negro};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .de-map-preview__body p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6B7280;
  }

  .de-map-preview__distance {
    display: inline-block;
    margin-top: 4px;
    font-size: 12px;
    color: ${Colors.NightBlue_600};
    font-weight: 600;
  }

  .de-map-preview__chevron {
    font-size: 18px;
    color: #9CA3AF;
    flex-shrink: 0;
  }

  .de-map-detail {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(92px + env(safe-area-inset-bottom, 0px));
    max-width: 420px;
    margin: 0 auto;
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
    z-index: 1200;
    max-height: calc(100vh - 180px);
    overflow-y: auto;
  }

  .de-map-detail--overlay {
    z-index: 1200;
  }

  .de-feed-error-banner {
    margin: 0 16px 12px;
    padding: 12px 14px;
    border-radius: 12px;
    background: #FEF2F2;
    border: 1px solid #FECACA;
    color: #991B1B;
    font-size: 13px;
  }

  .de-feed-error-banner strong {
    display: block;
    margin-bottom: 4px;
  }

  .de-feed-error-banner p {
    margin: 0;
    line-height: 1.4;
  }

  .de-search-user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    border-bottom: 1px solid ${Colors.LovableBorder};
    background: #fff;
    text-align: left;
    cursor: pointer;
  }

  .de-search-user-card__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-search-user-card__info strong {
    font-size: 14px;
    color: ${Colors.Negro};
  }

  .de-search-user-card__info span {
    font-size: 12px;
    color: ${Colors.Grey_Soft};
  }

  .de-search-user-card__follow {
    flex-shrink: 0;
    border: 1px solid ${Colors.NightBlue_600};
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-search-user-card__follow--pending {
    background: #fff;
    color: ${Colors.NightBlue_600};
  }

  .de-search-user-card__profile {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    padding: 0;
    text-align: left;
    cursor: pointer;
  }

  .de-search-user-card__actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .de-search-user-card__message {
    border: 1px solid ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-chat-invitation-banner {
    margin: 12px 16px 0;
    padding: 14px;
    border-radius: 16px;
    background: ${Colors.LovablePrimaryLight};
    border: 1px solid rgba(37, 99, 235, 0.2);
  }

  .de-chat-invitation-banner__header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  .de-chat-invitation-banner__header p {
    margin: 0;
    flex: 1;
  }

  .de-chat-invitation-banner p {
    margin: 0 0 12px;
    font-size: 14px;
    line-height: 1.45;
  }

  .de-chat-invitation-banner__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .de-chat-invitation-banner__actions button {
    border: 1px solid ${Colors.Line};
    background: #fff;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
  }

  .de-chat-invitation-banner__accept {
    border-color: ${Colors.LovablePrimary} !important;
    background: ${Colors.LovablePrimary} !important;
    color: #fff !important;
    font-weight: 700;
  }

  .de-chat-invitation-banner--pending {
    background: #F8FAFC;
    border-color: ${Colors.Line};
  }

  .de-chat-invitation-banner--event {
    background: #FFFBEB;
    border-color: rgba(245, 158, 11, 0.35);
  }

  .de-chat-event-admin {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 16px 0;
  }

  .de-chat-event-admin__btn {
    border: 1px solid ${Colors.Line};
    background: #fff;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-chat-event-admin__btn--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
  }

  .de-chat-event-invite {
    margin: 8px 16px 0;
    padding: 12px;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #fff;
  }

  .de-chat-event-invite input {
    width: 100%;
    border: 1px solid ${Colors.Line};
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 14px;
  }

  .de-chat-event-invite__hint {
    margin: 8px 0 0;
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-chat-event-invite__hint--error {
    color: #B91C1C;
  }

  .de-chat-event-invite__results {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
  }

  .de-chat-event-invite__results li button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    border: none;
    background: transparent;
    padding: 8px 4px;
    text-align: left;
    cursor: pointer;
    border-radius: 10px;
  }

  .de-chat-event-invite__results li button:hover {
    background: #F8FAFC;
  }

  .de-chat-event-invite__results li button span {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-chat-event-invite__results li button small {
    color: ${Colors.Placeholder};
    font-size: 12px;
  }

  .de-chat-assistants__item-wrap {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
  }

  .de-chat-assistants__kick {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid #FECACA;
    background: #FEF2F2;
    color: #B91C1C;
    font-size: 11px;
    line-height: 1;
    cursor: pointer;
  }

  .de-messenger-row--announcement {
    justify-content: center;
  }

  .de-messenger-bubble--announcement {
    width: min(92%, 520px);
    background: #FFFBEB !important;
    border: 1px solid rgba(245, 158, 11, 0.35);
    color: #78350F;
  }

  .de-messenger-bubble__announcement-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: #B45309;
    margin-bottom: 6px;
  }

  .de-messenger-bubble__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;
  }

  .de-messenger-bubble__actions {
    position: relative;
  }

  .de-messenger-bubble__actions-toggle {
    border: none;
    background: transparent;
    color: inherit;
    opacity: 0.65;
    cursor: pointer;
    padding: 0 4px;
    font-size: 14px;
    line-height: 1;
  }

  .de-messenger-bubble__actions-menu {
    position: absolute;
    right: 0;
    bottom: calc(100% + 4px);
    min-width: 120px;
    background: #fff;
    border: 1px solid ${Colors.Line};
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    z-index: 5;
    overflow: hidden;
  }

  .de-messenger-bubble__actions-menu button {
    display: block;
    width: 100%;
    border: none;
    background: #fff;
    text-align: left;
    padding: 10px 12px;
    font-size: 13px;
    cursor: pointer;
  }

  .de-messenger-bubble__actions-menu button:hover {
    background: #F8FAFC;
  }

  .de-chat-announcement-hint {
    margin: 8px 16px 0;
    padding: 8px 12px;
    border-radius: 10px;
    background: #FFFBEB;
    border: 1px solid rgba(245, 158, 11, 0.25);
    color: #92400E;
    font-size: 13px;
  }

  .de-messenger-compose--announcement input {
    border-color: rgba(245, 158, 11, 0.45);
    background: #FFFBEB;
  }

  .de-messenger-list__search-box {
    margin: 0 16px 12px;
    position: relative;
  }

  .de-messenger-list__search-box input {
    width: 100%;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 15px;
    background: #fff;
  }

  .de-messenger-list__search-hint {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-messenger-list__search-results {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #fff;
    overflow: hidden;
  }

  .de-messenger-list__search-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-bottom: 1px solid ${Colors.Line};
    background: #fff;
    text-align: left;
    cursor: pointer;
  }

  .de-messenger-list__search-item:last-child {
    border-bottom: none;
  }

  .de-messenger-list__search-item strong {
    display: block;
    font-size: 14px;
  }

  .de-messenger-list__search-item small {
    display: block;
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-messenger-list__search-action {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: ${Colors.LovablePrimary};
  }

  .de-messenger-list__search {
    margin: 0 16px 12px;
    width: calc(100% - 32px);
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    background: #fff;
    padding: 12px 16px;
    text-align: left;
    font-size: 14px;
    cursor: pointer;
  }

  .de-messenger-bubble__image--gif {
    max-height: 220px;
    object-fit: contain;
  }

  .de-map-detail__close {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 2;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.92);
    cursor: pointer;
    font-size: 14px;
  }

  .de-map-detail__hero img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    display: block;
  }

  .de-map-detail__content {
    padding: 16px;
  }

  .de-map-detail__content h3 {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 700;
    color: ${Colors.Negro};
  }

  .de-map-detail__meta {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .de-map-detail__meta li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: #374151;
    line-height: 1.4;
  }

  .de-map-detail__meta span:first-child {
    flex-shrink: 0;
  }

  .de-map-detail__divider {
    border: none;
    border-top: 1px solid ${Colors.LovableBorder};
    margin: 14px 0;
  }

  .de-map-detail__desc {
    margin: 0;
    font-size: 13px;
    color: #6B7280;
    line-height: 1.5;
  }

  .de-map-detail__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }

  .de-map-detail__btn {
    border-radius: 999px;
    padding: 12px 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .de-map-detail__btn--outline {
    border: 1px solid ${Colors.NightBlue_600};
    background: #fff;
    color: ${Colors.NightBlue_600};
  }

  .de-map-detail__btn--primary {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-map-detail__btn--ghost {
    border: none;
    background: #F3F4F6;
    color: ${Colors.NightBlue_800};
  }

  @media (max-width: 380px) {
    .de-map-search input {
      font-size: 13px;
    }

    .de-map-radius-select {
      padding: 0 8px;
      min-height: 44px;
    }

    .de-map-radius-select select {
      min-width: 56px;
      max-width: 72px;
      font-size: 12px;
    }

    .de-map-radius {
      padding: 8px 8px;
      max-width: 78px;
    }

    .de-map-detail {
      left: 8px;
      right: 8px;
    }
  }

  .de-notifications-page,
  .de-chat-page--list {
    padding-bottom: 24px;
  }

  .de-notifications-page .de-page-body,
  .de-chat-page--list .de-page-body {
    padding: 0 16px;
  }

  /* ── Plan pages ── */
  .de-plan-page {
    padding: 16px 16px 120px;
    max-width: 520px;
    margin: 0 auto;
  }

  .de-plan-hero {
    background: #fff;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    margin-bottom: 16px;
  }

  .de-plan-feature {
    background: #fff;
    border: 1px solid ${Colors.LovableBorder};
    border-radius: 16px;
    margin-bottom: 10px;
    overflow: hidden;
  }

  .de-plan-feature__head {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .de-plan-feature__icon {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: ${Colors.NightBlue_600};
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 14px;
  }

  .de-plan-feature__body {
    padding: 0 16px 14px 56px;
    color: #6B7280;
    font-size: 13px;
    line-height: 1.5;
  }

  .de-plan-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
  }

  .de-plan-btn {
    width: 100%;
    border-radius: 16px;
    padding: 14px 16px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .de-plan-btn--primary {
    border: none;
    background: linear-gradient(90deg, ${Colors.NightBlue_600}, ${Colors.NightBlue_800});
    color: #fff;
  }

  .de-plan-btn--pro {
    border: none;
    background: #F5B301;
    color: #fff;
  }

  .de-plan-btn--danger {
    border: 1px solid ${Colors.Red_400};
    background: #fff;
    color: ${Colors.Red_400};
  }

  .de-plan-btn--outline {
    border: 1px solid ${Colors.NightBlue_600};
    background: #fff;
    color: ${Colors.NightBlue_600};
  }

  .de-plan-terms {
    margin-top: 20px;
    font-size: 12px;
    color: #6B7280;
    line-height: 1.6;
  }

  .de-plan-terms h4 {
    margin: 0 0 8px;
    font-size: 13px;
    color: ${Colors.Negro};
  }

  .de-plan-terms ul {
    margin: 0;
    padding-left: 18px;
  }

  .de-profile-cover--editable {
    cursor: pointer;
    position: relative;
    overflow: hidden;
    background-size: cover;
    background-position: center;
  }

  .de-profile-cover__input {
    display: none;
  }

  .de-service-comments {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-service-comment {
    padding: 12px;
    border-radius: 12px;
    background: #F9FAFB;
  }

  .de-map-leaflet {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .de-map-locate-btn {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .de-map-event-sheet {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: calc(92px + env(safe-area-inset-bottom, 0px));
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.18);
    display: flex;
    gap: 12px;
    padding: 14px;
    z-index: 90;
    max-width: 420px;
    margin: 0 auto;
    cursor: pointer;
  }

  .de-map-event-sheet img {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    object-fit: cover;
  }

  .de-post-card--clickable {
    cursor: pointer;
  }

  .de-event-detail-v2 {
    min-height: 100%;
    background: #f3f4fb;
    padding-bottom: 96px;
  }

  .de-event-detail-v2__header {
    padding: 12px 16px 0;
  }

  .de-event-detail-v2__back {
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .de-event-detail-v2__gallery {
    padding: 12px 16px 0;
  }

  .de-event-detail-v2__hero-img {
    width: 100%;
    height: 180px;
    object-fit: cover;
    border-radius: 16px;
    background: #e5e7eb;
  }

  .de-event-detail-v2__hero-video {
    background: #0f172a;
  }

  .de-event-media-editor {
    margin: 16px 0;
    padding: 16px;
    border: 1px solid ${Colors.Line};
    border-radius: 16px;
    background: #f8fafc;
  }

  .de-event-media-editor__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .de-event-media-editor__header h3 {
    margin: 0 0 4px;
    font-size: 16px;
    color: #0f172a;
  }

  .de-event-media-editor__header p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
    max-width: 420px;
    line-height: 1.45;
  }

  .de-event-media-editor__upload-btn {
    border: none;
    border-radius: 12px;
    padding: 10px 14px;
    background: ${Colors.NightBlue_600};
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-event-media-editor__upload-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .de-event-media-editor__hint {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }

  .de-event-media-editor__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .de-event-media-editor__card {
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    border: 1px solid ${Colors.Line};
    display: flex;
    flex-direction: column;
  }

  .de-event-media-editor__media {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
    background: #e2e8f0;
  }

  .de-event-media-editor__card-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
  }

  .de-event-media-editor__card-actions button {
    border: 1px solid ${Colors.Line};
    border-radius: 8px;
    background: #fff;
    font-size: 11px;
    font-weight: 700;
    color: #334155;
    padding: 6px 8px;
    cursor: pointer;
  }

  .de-event-media-editor__badge {
    font-size: 11px;
    font-weight: 800;
    color: ${Colors.NightBlue_600};
    background: #eef2ff;
    border-radius: 8px;
    padding: 6px 8px;
    text-align: center;
  }

  .de-event-detail-v2__hero-img--placeholder {
    background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  }

  .de-event-detail-v2__gallery-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 8px;
  }

  .de-event-detail-v2__gallery-dots button {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    border: none;
    background: #cbd5e1;
    padding: 0;
  }

  .de-event-detail-v2__gallery-dots button.is-active {
    background: ${Colors.NightBlue_600};
    width: 18px;
  }

  .de-event-detail-v2__body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .de-event-detail-v2__title {
    margin: 0;
    font-size: 24px;
    color: ${Colors.NightBlue_800};
  }

  .de-event-detail-v2__status {
    display: inline-block;
    margin-top: 8px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(81, 94, 192, 0.12);
    color: ${Colors.NightBlue_600};
    font-size: 12px;
    font-weight: 600;
  }

  .de-event-detail-v2__actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .de-event-detail-v2__icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 1px solid rgba(81, 94, 192, 0.25);
    background: #fff;
    color: ${Colors.NightBlue_600};
    font-size: 18px;
    cursor: pointer;
  }

  .de-event-detail-v2__card {
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  .de-event-detail-v2__grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .de-event-detail-v2__align-right {
    text-align: right;
  }

  .de-event-detail-v2__card-label {
    font-weight: 700;
    margin-bottom: 8px;
  }

  .de-event-detail-v2__divider {
    border: none;
    border-top: 1px solid ${Colors.LovableBorder};
    margin: 16px 0;
  }

  .de-event-detail-v2__meta-list p {
    margin: 0 0 14px;
    font-size: 13px;
    color: #6B7280;
  }

  .de-event-detail-v2__meta-list strong {
    color: ${Colors.Negro};
    font-size: 14px;
  }

  .de-event-detail-v2__more-link {
    width: 100%;
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    font-size: 15px;
  }

  .de-event-detail-v2__description h3 {
    margin: 12px 0 6px;
    font-size: 14px;
  }

  .de-event-detail-v2__description p {
    margin: 0;
    color: #4B5563;
    line-height: 1.5;
  }

  .de-event-detail-v2__section-title,
  .de-event-detail-v2__section-heading {
    margin: 0 0 10px;
    font-size: 15px;
    font-weight: 700;
  }

  .de-event-detail-v2__address {
    margin: 8px 0 12px;
    color: #6B7280;
    font-size: 13px;
    line-height: 1.5;
  }

  .de-event-detail-v2__map-link {
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    text-decoration: none;
    display: inline-block;
  }

  .de-event-person {
    display: flex;
    gap: 12px;
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  .de-event-person__left {
    width: 30%;
    text-align: center;
  }

  .de-event-person__avatar {
    width: 68px;
    height: 68px;
    border-radius: 999px;
    overflow: hidden;
    margin: 0 auto 8px;
    background: #e5e7eb;
    display: grid;
    place-items: center;
    font-weight: 700;
    color: ${Colors.NightBlue_600};
  }

  .de-event-person__avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .de-event-person__name {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
  }

  .de-event-person__right {
    flex: 1;
    text-align: right;
  }

  .de-event-person__label {
    margin: 0 0 4px;
    font-size: 12px;
    color: #6B7280;
  }

  .de-event-person__stars {
    color: #cbd5e1;
    letter-spacing: 2px;
    margin-bottom: 12px;
  }

  .de-event-person__star--on {
    color: ${Colors.NightBlue_600};
  }

  .de-event-person__stats {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
  }

  .de-event-person__stats div {
    text-align: center;
  }

  .de-event-person__stats strong {
    display: block;
    font-size: 18px;
  }

  .de-event-person__stats span {
    font-size: 11px;
    color: #6B7280;
  }

  .de-event-detail-v2__faq-row {
    width: 100%;
    border: none;
    background: #fff;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  .de-event-detail-v2__faq-item {
    margin-bottom: 12px;
  }

  .de-event-detail-v2__refund {
    display: flex;
    gap: 12px;
    background: rgba(81, 94, 192, 0.08);
    border-radius: 16px;
    padding: 16px;
  }

  .de-event-detail-v2__refund-icon {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: ${Colors.NightBlue_600};
    color: #fff;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .de-event-detail-v2__refund h3 {
    margin: 0 0 6px;
    font-size: 15px;
  }

  .de-event-detail-v2__refund p {
    margin: 0 0 8px;
    font-size: 13px;
    color: #4B5563;
    line-height: 1.5;
  }

  .de-event-detail-v2__refund-btn,
  .de-event-detail-v2__policy-link {
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }

  .de-event-detail-v2__secondary-cta {
    border: 1px solid ${Colors.NightBlue_600};
    background: #fff;
    color: ${Colors.NightBlue_600};
    border-radius: 16px;
    padding: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-event-detail-v2__footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
    background: rgba(243, 244, 251, 0.95);
    backdrop-filter: blur(8px);
    z-index: 90;
  }

  .de-event-detail-v2__buy {
    width: 100%;
    border: none;
    border-radius: 999px;
    padding: 14px 20px;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  /* ── Guests, access, refunds ── */
  .de-page-topbar__back {
    position: absolute;
    left: 8px;
    top: 16px;
    border: none;
    background: transparent;
    color: ${Colors.Blanco};
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    padding: 4px 12px;
  }

  .de-pro-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  }

  .de-pro-card__title {
    font-size: 16px;
    font-weight: 700;
    color: ${Colors.TexColor};
    margin: 0 0 12px;
  }

  .de-pro-card__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .de-pro-card__row .de-pro-card__title {
    margin: 0;
  }

  .de-pro-card__btn {
    width: 100%;
    margin-top: 12px;
  }

  .de-pro-card__link-btn {
    border: none;
    background: transparent;
    color: ${Colors.LovablePrimary};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 4px 0;
  }

  .de-pro-card--stats {
    padding: 12px 8px;
  }

  .de-pro-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    text-align: center;
  }

  .de-pro-stats strong {
    display: block;
    font-size: 18px;
    color: ${Colors.TexColor};
  }

  .de-pro-stats span {
    font-size: 11px;
    color: ${Colors.Grey_Soft};
  }

  .de-form-input {
    width: 100%;
    border: 1px solid ${Colors.Line};
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 14px;
    margin-bottom: 10px;
    font-family: inherit;
    background: ${Colors.Blanco};
    color: ${Colors.TexColor};
  }

  .de-form-input:focus {
    outline: none;
    border-color: ${Colors.LovablePrimary};
  }

  .de-guest-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .de-guest-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid ${Colors.Line};
  }

  .de-guest-row:last-child {
    border-bottom: none;
  }

  .de-access-result {
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    margin-top: 8px;
  }

  .de-access-result--ok {
    background: rgba(16, 185, 129, 0.12);
    color: #047857;
  }

  .de-access-result--fail {
    background: rgba(239, 68, 68, 0.12);
    color: #b91c1c;
  }

  .de-invite-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
  }

  .de-invite-card__img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 12px 12px 0 0;
    margin: -16px -16px 12px;
    width: calc(100% + 32px);
  }

  .de-tickets-quick-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .de-tickets-quick-links button {
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.12);
    color: ${Colors.Blanco};
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  /* ── Access control ── */
  .de-access-page {
    min-height: 100%;
    background: #EEF2F7;
  }

  .de-access-hero {
    background: linear-gradient(135deg, ${Colors.NightBlue_800}, ${Colors.NightBlue_600});
    color: #fff;
    padding: calc(16px + env(safe-area-inset-top, 0px)) 16px 20px;
    position: relative;
  }

  .de-access-hero__back {
    border: none;
    background: transparent;
    color: #fff;
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    margin-bottom: 8px;
  }

  .de-access-hero__brand span {
    font-size: 28px;
    font-weight: 800;
  }

  .de-access-hero__brand p {
    margin: 4px 0 0;
    opacity: 0.92;
    font-size: 14px;
  }

  .de-access-body {
    padding: 16px 16px 120px;
  }

  .de-access-intro {
    color: #6B7280;
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 16px;
  }

  .de-access-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 16px;
  }

  .de-access-tabs__btn {
    border: none;
    background: #fff;
    color: #6B7280;
    border-radius: 999px;
    padding: 12px 10px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  }

  .de-access-tabs__btn--active {
    color: ${Colors.NightBlue_600};
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.15);
  }

  .de-access-card {
    background: #fff;
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 14px;
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
  }

  .de-access-card__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .de-access-card__head h3 {
    margin: 0;
    font-size: 22px;
    line-height: 1.2;
  }

  .de-access-badge {
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .de-access-badge--active { background: #DCFCE7; color: #166534; }
  .de-access-badge--upcoming { background: #FEF3C7; color: #92400E; }
  .de-access-badge--default { background: #E5E7EB; color: #374151; }

  .de-access-card__meta {
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    color: ${Colors.NightBlue_600};
    font-size: 14px;
    line-height: 1.5;
  }

  .de-access-card__meta li + li { margin-top: 8px; }

  .de-access-card__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 14px;
  }

  .de-access-card__stats div {
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    padding: 12px;
    text-align: center;
  }

  .de-access-card__stats strong {
    display: block;
    font-size: 24px;
    color: ${Colors.NightBlue_800};
  }

  .de-access-card__stats span {
    font-size: 12px;
    color: #6B7280;
  }

  .de-access-btn {
    width: 100%;
    border-radius: 16px;
    padding: 14px 16px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    margin-top: 8px;
  }

  .de-access-btn--primary {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-access-btn--ghost,
  .de-access-btn--outline {
    border: none;
    background: transparent;
    color: ${Colors.NightBlue_600};
  }

  .de-access-card__organizer {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 12px;
    align-items: center;
    margin-bottom: 14px;
  }

  .de-access-card__organizer-avatar {
    width: 48px;
    height: 48px;
    border-radius: 999px;
    overflow: hidden;
    background: #E5E7EB;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .de-access-card__organizer-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .de-access-card__organizer-label {
    margin: 0;
    font-size: 12px;
    color: #6B7280;
  }

  .de-access-card__gate {
    display: flex;
    gap: 12px;
    align-items: center;
    background: #EFF6FF;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 12px;
  }

  .de-access-card__gate p {
    margin: 0 0 4px;
    font-size: 12px;
    color: #6B7280;
  }

  .de-qr-scanner {
    position: fixed;
    inset: 0;
    z-index: 1300;
    background: rgba(15, 23, 42, 0.72);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 16px;
  }

  .de-qr-scanner__panel {
    width: min(480px, 100%);
    background: #fff;
    border-radius: 20px 20px 0 0;
    padding: 16px;
  }

  .de-qr-scanner__video-wrap {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    background: #111827;
    min-height: 220px;
  }

  .de-qr-scanner__video {
    width: 100%;
    min-height: 220px;
    object-fit: cover;
  }

  .de-qr-scanner__frame {
    position: absolute;
    inset: 20% 18%;
    border: 2px solid rgba(255,255,255,0.85);
    border-radius: 16px;
    pointer-events: none;
  }

  /* ── Boletería ── */
  .de-boleteria-page {
    min-height: 100%;
    background: #F3F4F6;
    padding-bottom: 120px;
  }

  .de-boleteria-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
    background: #fff;
    border-bottom: 1px solid ${Colors.LovableBorder};
  }

  .de-boleteria-topbar h1 {
    margin: 0;
    font-size: 18px;
  }

  .de-boleteria-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    padding: 12px 12px 0;
    background: #fff;
    border-bottom: 1px solid ${Colors.LovableBorder};
  }

  .de-boleteria-tabs__btn {
    border: none;
    background: transparent;
    padding: 10px 4px 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    color: #6B7280;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }

  .de-boleteria-tabs__btn--active {
    color: ${Colors.NightBlue_600};
    border-bottom-color: ${Colors.NightBlue_600};
  }

  .de-boleteria-tabs__badge {
    min-width: 22px;
    height: 22px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-style: normal;
    font-size: 11px;
    color: #fff;
  }

  .de-boleteria-tabs__badge--green { background: #22C55E; }
  .de-boleteria-tabs__badge--yellow { background: #EAB308; }
  .de-boleteria-tabs__badge--red { background: #EF4444; }
  .de-boleteria-tabs__badge--gray { background: #374151; }

  .de-boleteria-body { padding: 12px 16px; }

  .de-boleteria-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    border: none;
    background: #fff;
    border-radius: 16px;
    padding: 12px;
    margin-bottom: 10px;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
  }

  .de-boleteria-item__thumb {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    overflow: hidden;
    background: #E5E7EB;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .de-boleteria-item__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .de-boleteria-item__content {
    flex: 1;
    display: grid;
    gap: 4px;
  }

  .de-boleteria-item__content strong { font-size: 15px; }
  .de-boleteria-item__content span { color: #6B7280; font-size: 13px; }
  .de-boleteria-item__content small { color: #9CA3AF; font-size: 12px; }
  .de-boleteria-item__chev { color: ${Colors.NightBlue_600}; font-size: 24px; }

  .de-boleteria-detail { padding: 16px; }

  .de-boleteria-ticket-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
  }

  .de-boleteria-ticket-card__hero {
    width: 100%;
    height: 160px;
    object-fit: cover;
  }

  .de-boleteria-ticket-card__body { padding: 18px; }

  .de-boleteria-ticket-card__label {
    margin: 0 0 6px;
    font-size: 12px;
    color: #6B7280;
  }

  .de-boleteria-ticket-card__category {
    display: inline-block;
    background: #FB923C;
    color: #fff;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .de-boleteria-ticket-card__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .de-boleteria-ticket-card__grid p {
    margin: 0 0 4px;
    font-size: 12px;
    color: #6B7280;
  }

  .de-boleteria-ticket-card__qr {
    width: min(100%, 280px);
    display: block;
    margin: 0 auto 12px;
  }

  .de-boleteria-ticket-card__code {
    text-align: center;
    font-size: 12px;
    color: #6B7280;
    word-break: break-all;
  }

  .de-boleteria-split__ticket-panel {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-boleteria-event-header {
    padding: 4px 2px 8px;
    border-bottom: 1px solid ${Colors.Line};
    margin-bottom: 4px;
  }

  .de-boleteria-event-header h2 {
    margin: 0 0 4px;
    font-size: 18px;
    color: #0f172a;
  }

  .de-boleteria-event-header p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }

  .de-boleteria-event-header span {
    display: inline-block;
    margin-top: 6px;
    font-size: 12px;
    font-weight: 700;
    color: ${Colors.NightBlue_600};
    background: #eef2ff;
    border-radius: 999px;
    padding: 4px 10px;
  }

  .de-boleteria-tickets-stack {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    padding-right: 4px;
  }

  .de-boleteria-ticket-entry {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 18px;
    border-bottom: 1px dashed ${Colors.Line};
  }

  .de-boleteria-ticket-entry:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .de-boleteria-ticket-entry__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .de-boleteria-ticket-entry__actions .de-boleteria-detail__cta {
    flex: 1 1 180px;
    width: auto;
    min-width: 0;
    margin-top: 0;
  }

  .de-boleteria-ticket-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .de-boleteria-ticket-picker__btn {
    border: 1px solid ${Colors.Line};
    background: #fff;
    color: #334155;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }

  .de-boleteria-ticket-picker__btn:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  .de-boleteria-ticket-picker__btn--active {
    background: ${Colors.NightBlue_600};
    border-color: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-boleteria-detail__cta--ghost {
    background: #fff;
    color: ${Colors.NightBlue_600};
    border: 1px solid ${Colors.Line};
  }

  .de-tuboleta-card {
    border-radius: 24px;
    overflow: hidden;
    background: ${Colors.NightBlue_600};
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
  }

  .de-tuboleta-card__header {
    padding: 14px 18px 10px;
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-tuboleta-card__header span {
    font-size: 18px;
    font-weight: 800;
  }

  .de-tuboleta-card__header small {
    font-size: 12px;
    opacity: 0.85;
  }

  .de-tuboleta-card__body {
    margin: 0 12px 12px;
    background: #fff;
    border-radius: 20px;
    padding: 18px 16px 16px;
  }

  .de-tuboleta-card__qr-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 14px;
  }

  .de-tuboleta-card__qr-note {
    margin: 10px 0 0;
    padding: 10px 12px;
    border-radius: 10px;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    font-size: 12px;
    line-height: 1.45;
    color: #9a3412;
    text-align: center;
    max-width: 280px;
  }

  .de-tuboleta-card__qr {
    width: min(100%, 240px);
    height: auto;
    display: block;
    border-radius: 12px;
    background: #fff;
  }

  .de-tuboleta-card__qr-placeholder {
    width: min(100%, 240px);
    aspect-ratio: 1;
    border-radius: 16px;
    border: 2px dashed #CBD5E1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #64748B;
    background: #F8FAFC;
  }

  .de-tuboleta-card__qr-placeholder span {
    font-size: 28px;
    font-weight: 800;
    color: #94A3B8;
  }

  .de-tuboleta-card__qr-placeholder small {
    font-size: 12px;
    text-align: center;
    padding: 0 12px;
  }

  .de-tuboleta-card__brand {
    text-align: center;
    margin-bottom: 16px;
  }

  .de-tuboleta-card__brand strong {
    display: block;
    font-size: 22px;
    color: ${Colors.NightBlue_600};
    letter-spacing: -0.02em;
  }

  .de-tuboleta-card__brand span {
    font-size: 11px;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .de-tuboleta-card__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px 16px;
    margin-bottom: 14px;
  }

  .de-tuboleta-card__grid p {
    margin: 0 0 4px;
    font-size: 11px;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .de-tuboleta-card__grid strong {
    font-size: 15px;
    color: #0F172A;
    line-height: 1.2;
  }

  .de-tuboleta-card__code {
    text-align: center;
    font-size: 12px;
    color: #64748B;
    word-break: break-all;
    margin: 0 0 12px;
  }

  .de-tuboleta-card__share {
    width: 100%;
    border: none;
    border-radius: 999px;
    padding: 14px 16px;
    background: ${Colors.NightBlue_600};
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
  }

  .de-boleteria-detail__cta,
  .de-boleteria-detail__share {
    width: 100%;
    border-radius: 999px;
    padding: 14px 16px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    margin-top: 12px;
  }

  .de-boleteria-detail__cta {
    border: none;
    background: ${Colors.NightBlue_600};
    color: #fff;
  }

  .de-boleteria-detail__share {
    border: 1px solid ${Colors.NightBlue_600};
    background: #fff;
    color: ${Colors.NightBlue_600};
  }

  .de-profile-account-type {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 12px;
  }

  .de-profile-account-type button {
    border: 1px solid ${Colors.LovableBorder};
    background: #fff;
    border-radius: 14px;
    padding: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-profile-account-type button.de-profile-account-type__active {
    border-color: ${Colors.NightBlue_600};
    color: ${Colors.NightBlue_600};
    background: #EFF6FF;
  }

  .de-create-event-wizard {
    padding-bottom: 120px;
  }

  .de-wizard-stepper {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding: 0 16px 16px;
    scrollbar-width: none;
  }

  .de-wizard-stepper::-webkit-scrollbar {
    display: none;
  }

  .de-wizard-stepper__item {
    flex: 0 0 auto;
    min-width: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    opacity: 0.55;
  }

  .de-wizard-stepper__item span {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    border: 2px solid ${Colors.Line};
    background: #fff;
  }

  .de-wizard-stepper__item small {
    font-size: 10px;
    font-weight: 600;
    color: ${Colors.Placeholder};
  }

  .de-wizard-stepper__item--active span {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
  }

  .de-wizard-stepper__item--active {
    opacity: 1;
  }

  .de-wizard-stepper__item--done span {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimary};
    color: #fff;
  }

  .de-wizard-intro {
    margin: 0 0 12px;
    font-size: 14px;
    color: ${Colors.Placeholder};
    line-height: 1.45;
  }

  .de-wizard-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .de-wizard-toggle-row {
    display: grid;
    gap: 10px;
  }

  .de-wizard-toggle {
    border: 2px solid ${Colors.LovableBorder};
    border-radius: 16px;
    padding: 14px;
    background: #fff;
    text-align: left;
    cursor: pointer;
  }

  .de-wizard-toggle strong {
    display: block;
    font-size: 15px;
    margin-bottom: 4px;
  }

  .de-wizard-toggle span {
    font-size: 13px;
    color: ${Colors.Placeholder};
  }

  .de-wizard-toggle--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-wizard-floor-card__head,
  .de-wizard-ticket-head {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: space-between;
  }

  .de-wizard-floor-card__head h3,
  .de-wizard-ticket-head h3 {
    margin: 0;
    font-size: 16px;
  }

  .de-wizard-link-btn {
    border: none;
    background: none;
    color: #DC2626;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-wizard-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .de-wizard-tabs__btn {
    border: 1px solid ${Colors.Line};
    background: #fff;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-wizard-tabs__btn--active {
    border-color: ${Colors.LovablePrimary};
    color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-seating-map {
    border-radius: 20px;
    border: 1px solid ${Colors.Line};
    background: linear-gradient(180deg, #F8FAFC 0%, #fff 100%);
    padding: 16px;
  }

  .de-seating-map__stage {
    margin: 0 auto 16px;
    max-width: 220px;
    border: 2px dashed ${Colors.Line};
    border-radius: 12px;
    padding: 12px;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${Colors.Placeholder};
  }

  .de-seating-map__canvas {
    position: relative;
    min-height: 280px;
    border-radius: 16px;
    background:
      linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
      linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .de-seating-zone {
    position: absolute;
    border: 2px solid;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 6px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .de-seating-zone strong {
    font-size: 12px;
  }

  .de-seating-zone span {
    font-size: 10px;
    opacity: 0.85;
  }

  .de-seating-zone--active {
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.18);
    transform: scale(1.02);
  }

  .de-seating-zone--readonly {
    cursor: default;
  }

  .de-seating-preview-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 180px;
    overflow-y: auto;
  }

  .de-seating-preview-seat {
    border: 1px solid;
    border-radius: 6px;
    padding: 4px 6px;
    font-size: 10px;
    font-weight: 600;
    background: #fff;
  }

  .de-seating-preview-more {
    font-size: 12px;
    color: ${Colors.Placeholder};
    align-self: center;
  }

  /* Floor plan editor */
  .de-fp-editor {
    border-radius: 20px;
    border: 1px solid ${Colors.Line};
    background: #fff;
    overflow: hidden;
  }

  .de-fp-editor__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 16px 8px;
  }

  .de-fp-editor__header small {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${Colors.LovablePrimary};
  }

  .de-fp-editor__header h3 {
    margin: 4px 0 0;
    font-size: 22px;
    font-weight: 800;
    color: ${Colors.TexColor};
  }

  .de-fp-autosave {
    font-size: 11px;
    color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
    border-radius: 999px;
    padding: 6px 10px;
    white-space: nowrap;
  }

  .de-fp-toolbar,
  .de-fp-statusbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .de-fp-toolbar::-webkit-scrollbar {
    display: none;
  }

  .de-fp-statusbar {
    border-top: 1px solid ${Colors.Line};
    border-bottom: 1px solid ${Colors.Line};
    background: #F8FAFC;
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-fp-statusbar button {
    margin-left: auto;
    border: 1px solid ${Colors.Line};
    background: #fff;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 11px;
    cursor: pointer;
  }

  .de-fp-tool {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid ${Colors.Line};
    background: #fff;
    cursor: pointer;
    font-size: 14px;
    flex-shrink: 0;
  }

  .de-fp-tool--icon {
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 17px;
    line-height: 1;
  }

  .de-fp-tool--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
  }

  .de-fp-tool:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .de-fp-canvas-wrap {
    position: relative;
    padding: 56px 16px 24px;
    overflow: auto;
    max-height: none;
    min-height: 560px;
    max-width: 100%;
  }

  .de-fp-canvas {
    position: relative;
    min-height: 1400px;
    min-width: 100%;
    width: 100%;
    border-radius: 16px;
    background: #fff;
    transform-origin: top center;
    touch-action: none;
    user-select: none;
  }

  .de-fp-canvas--grid {
    background:
      linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
      linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .de-fp-canvas__bounds {
    position: absolute;
    inset: 1.5% 2%;
    border: 2px dashed rgba(148, 163, 184, 0.55);
    border-radius: 12px;
    pointer-events: none;
  }

  .de-wizard-combined-step > .de-card,
  .de-wizard-combined-step > .de-form-stack {
    margin-bottom: 12px;
  }

  .de-fp-shape {
    position: absolute;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    overflow: hidden;
    transition: box-shadow 0.15s ease;
  }

  .de-fp-shape--selected {
    box-shadow: 0 0 0 2px ${Colors.LovablePrimary}, 0 12px 28px rgba(37, 99, 235, 0.18);
    z-index: 20;
    overflow: visible;
  }

  .de-fp-shape--draft {
    border: 2px dashed ${Colors.LovablePrimary};
    background: rgba(37, 99, 235, 0.08);
    pointer-events: none;
  }

  .de-fp-shape--element {
    color: #475569;
  }

  .de-fp-shape__label {
    position: relative;
    z-index: 2;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #DC2626;
    text-align: center;
    padding: 4px;
    pointer-events: none;
  }

  .de-fp-shape__seats {
    position: absolute;
    inset: 8%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(4px, 1fr));
    gap: 2px;
    opacity: 0.85;
    pointer-events: none;
  }

  .de-fp-shape__seats--grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    padding: 4px;
    background: rgba(255, 255, 255, 0.72);
    border-radius: 8px;
  }

  .de-fp-seat-row {
    display: flex;
    align-items: center;
    gap: 3px;
    min-height: 0;
  }

  .de-fp-seat-row__label {
    width: 12px;
    font-size: 7px;
    font-weight: 700;
    color: #334155;
    flex-shrink: 0;
  }

  .de-fp-seat-row__cells {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .de-fp-seat-chip {
    min-width: 12px;
    height: 12px;
    padding: 0 2px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--zone-color, #94A3B8) 55%, white);
    border: 1px solid color-mix(in srgb, var(--zone-color, #64748B) 70%, #334155);
    color: #0f172a;
    font-size: 6px;
    font-weight: 700;
    line-height: 10px;
    text-align: center;
  }

  .de-fp-seat-dot {
    width: 100%;
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 1px;
  }

  .de-fp-shape__handles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
  }

  .de-fp-shape__outline {
    position: absolute;
    inset: -2px;
    border: 1px dashed rgba(37, 99, 235, 0.45);
    border-radius: inherit;
    pointer-events: none;
  }

  .de-fp-shape__handle {
    position: absolute;
    pointer-events: auto;
    touch-action: none;
    z-index: 4;
  }

  .de-fp-shape__handle--resize {
    width: 10px;
    height: 10px;
    background: #fff;
    border: 2px solid ${Colors.LovablePrimary};
    border-radius: 2px;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.18);
  }

  .de-fp-shape__handle--nw { top: -6px; left: -6px; cursor: nwse-resize; }
  .de-fp-shape__handle--n { top: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
  .de-fp-shape__handle--ne { top: -6px; right: -6px; cursor: nesw-resize; }
  .de-fp-shape__handle--e { top: 50%; right: -6px; transform: translateY(-50%); cursor: ew-resize; }
  .de-fp-shape__handle--se { bottom: -6px; right: -6px; cursor: nwse-resize; }
  .de-fp-shape__handle--s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
  .de-fp-shape__handle--sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
  .de-fp-shape__handle--w { top: 50%; left: -6px; transform: translateY(-50%); cursor: ew-resize; }

  .de-fp-shape__rotate-stem {
    position: absolute;
    top: -34px;
    left: 50%;
    width: 1px;
    height: 22px;
    background: ${Colors.LovablePrimary};
    transform: translateX(-50%);
    pointer-events: none;
  }

  .de-fp-shape__handle--rotate {
    top: -52px;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: ${Colors.LovablePrimary};
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    cursor: grab;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
  }

  .de-fp-shape__handle--rotate:active {
    cursor: grabbing;
  }

  .de-fp-zoom {
    position: absolute;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #fff;
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    padding: 6px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  }

  .de-fp-zoom button {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 999px;
    background: #F1F5F9;
    cursor: pointer;
    font-size: 16px;
  }

  .de-fp-shape-bar {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 12px 16px 16px;
    border-top: 1px solid ${Colors.Line};
  }

  .de-fp-shape-btn {
    flex: 0 0 auto;
    min-width: 72px;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #fff;
    padding: 8px 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .de-fp-shape-btn--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-fp-shape-btn span {
    font-size: 18px;
  }

  .de-fp-shape-btn small {
    font-size: 10px;
    font-weight: 600;
  }

  .de-fp-ring-slider {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px 16px;
    font-size: 13px;
    font-weight: 600;
  }

  .de-fp-ring-slider input {
    flex: 1;
  }

  .de-fp-preview {
    border-radius: 20px;
    border: 1px solid ${Colors.Line};
    padding: 16px;
    background: #fff;
  }

  .de-fp-preview small {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${Colors.Placeholder};
  }

  .de-fp-preview h4 {
    margin: 4px 0 12px;
    font-size: 18px;
  }

  .de-fp-canvas--preview {
    min-height: 320px;
  }

  .de-fp-preview-zoom {
    margin-top: 8px;
    text-align: right;
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-fp-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }

  .de-fp-modal {
    width: min(100%, 520px);
    max-height: 90vh;
    overflow-y: auto;
    background: #fff;
    border-radius: 20px 20px 12px 12px;
    padding: 20px;
    box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18);
  }

  .de-fp-modal__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .de-fp-modal__head h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
  }

  .de-fp-modal__close {
    border: none;
    background: transparent;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
  }

  .de-fp-modal__hint {
    color: ${Colors.Placeholder};
    font-size: 14px;
    margin: 0 0 16px;
  }

  .de-fp-picker-cards {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }

  .de-fp-picker-card {
    border: 1px solid ${Colors.Line};
    border-radius: 16px;
    padding: 16px;
    text-align: left;
    background: #fff;
    cursor: pointer;
    display: grid;
    gap: 6px;
  }

  .de-fp-picker-card--primary {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-fp-picker-card strong {
    font-size: 16px;
  }

  .de-fp-picker-card span:last-child {
    font-size: 13px;
    color: ${Colors.Placeholder};
  }

  .de-fp-modal__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }

  .de-fp-modal__actions--split {
    justify-content: space-between;
  }

  .de-fp-color-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .de-fp-color-swatch {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    border: 2px solid transparent;
    cursor: pointer;
  }

  .de-fp-color-swatch--active {
    border-color: ${Colors.LovablePrimary};
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px ${Colors.LovablePrimary};
  }

  .de-fp-capacity-card {
    border-radius: 14px;
    padding: 12px;
    display: grid;
    gap: 8px;
    font-size: 13px;
  }

  .de-fp-capacity-card--ok {
    background: #ECFDF5;
    color: #047857;
  }

  .de-fp-capacity-card--warn {
    background: #FEF2F2;
    color: #B91C1C;
  }

  .de-fp-capacity-bar {
    height: 8px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.25);
    overflow: hidden;
  }

  .de-fp-capacity-bar span {
    display: block;
    height: 100%;
    background: currentColor;
    border-radius: inherit;
  }

  .de-fp-section-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
  }

  .de-wizard-color-input {
    width: 100%;
    height: 42px;
    border: 1px solid ${Colors.Line};
    border-radius: 12px;
    padding: 4px;
    background: #fff;
  }

  .de-wizard-check {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .de-wizard-ticket-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .de-wizard-summary {
    list-style: none;
    margin: 12px 0 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }

  .de-wizard-summary li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    border-bottom: 1px solid ${Colors.Line};
    padding-bottom: 8px;
  }

  .de-wizard-summary span {
    color: ${Colors.Placeholder};
  }

  .de-wizard-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.96);
    border-top: 1px solid ${Colors.Line};
    backdrop-filter: blur(8px);
    z-index: 100;
  }

  .de-wizard-actions-row {
    display: flex;
    justify-content: flex-start;
  }

  .de-seating-map--preview {
    margin-top: 8px;
  }

  .de-event-location {
    display: grid;
    gap: 10px;
  }

  .de-event-location__hint,
  .de-event-location__resolved {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-event-location__resolved {
    color: ${Colors.LovablePrimary};
  }

  .de-event-location__map-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .de-event-location__map {
    width: 100%;
    height: 220px;
    border-radius: 14px;
    border: 1px solid ${Colors.Line};
    overflow: hidden;
  }

  .de-guests-page {
    padding: 0 16px 100px;
    max-width: 720px;
    margin: 0 auto;
  }

  .de-guests-page__header h1 {
    margin: 8px 0 4px;
    font-size: 24px;
    color: ${Colors.LovablePrimary};
  }

  .de-guests-page__back {
    border: none;
    background: none;
    color: ${Colors.LovablePrimary};
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }

  .de-guests-page__stats {
    margin: 0;
    color: ${Colors.Placeholder};
    font-size: 14px;
  }

  .de-guests-page__search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 16px 0 12px;
    padding: 10px 14px;
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    background: #fff;
  }

  .de-guests-page__search input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 14px;
  }

  .de-guests-page__tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .de-guests-page__tab {
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #fff;
    padding: 10px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    cursor: pointer;
  }

  .de-guests-page__tab--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-guests-page__tab strong {
    font-size: 11px;
  }

  .de-guests-page__tab em {
    font-style: normal;
    font-size: 13px;
    font-weight: 700;
    color: ${Colors.LovablePrimary};
  }

  .de-guests-page__actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .de-guests-page__select-btn,
  .de-guests-page__action-btn {
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    background: #fff;
    padding: 8px 14px;
    font-size: 13px;
    cursor: pointer;
  }

  .de-guests-page__select-btn--active,
  .de-guests-page__action-btn--primary {
    border-color: ${Colors.LovablePrimary};
    color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
  }

  .de-guests-page__list {
    display: grid;
    gap: 10px;
  }

  .de-guests-page__section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    color: ${Colors.LovablePrimary};
    margin-bottom: 4px;
  }

  .de-guest-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid ${Colors.Line};
    border-radius: 16px;
    background: #fff;
  }

  .de-guest-card--clickable {
    width: 100%;
    cursor: pointer;
    text-align: left;
  }

  .de-guest-card__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-guest-card__info span {
    font-size: 13px;
    color: ${Colors.Placeholder};
  }

  .de-guest-card__fav {
    border: none;
    background: none;
    font-size: 20px;
    cursor: pointer;
  }

  .de-guests-page__group-form,
  .de-guests-page__user-search {
    display: grid;
    gap: 8px;
    margin-top: 8px;
  }

  .de-guests-page__events-link {
    margin-top: 24px;
    display: grid;
    gap: 8px;
  }

  .de-guests-page__events-link button {
    border: none;
    background: none;
    color: ${Colors.LovablePrimary};
    text-align: left;
    cursor: pointer;
    font-weight: 600;
  }

  /* ── Wizard v2 (3 pasos) ── */
  .de-wizard-v2 {
    min-height: 100vh;
    padding-bottom: 88px;
    background: #f8fafc;
    overflow-x: hidden;
    max-width: 100vw;
  }

  .de-wizard-landing {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #fff;
  }

  .de-wizard-landing__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px;
  }

  .de-wizard-landing__logo,
  .de-wizard-v2-topbar__logo {
    font-size: 22px;
    font-weight: 800;
    color: ${Colors.LovablePrimary};
  }

  .de-wizard-landing__logo span,
  .de-wizard-v2-topbar__logo span {
    color: #111;
  }

  .de-wizard-landing__cta-small {
    border: none;
    background: ${Colors.LovablePrimary};
    color: #fff;
    padding: 10px 20px;
    border-radius: 999px;
    font-weight: 600;
    cursor: pointer;
  }

  .de-wizard-landing__hero {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 24px 80px;
    max-width: 720px;
    margin: 0 auto;
  }

  .de-wizard-landing__badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(88, 86, 235, 0.1);
    color: ${Colors.LovablePrimary};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .de-wizard-landing__hero h1 {
    font-size: clamp(28px, 5vw, 44px);
    line-height: 1.15;
    margin: 0 0 16px;
    color: #0f172a;
  }

  .de-wizard-landing__hero p {
    color: ${Colors.Placeholder};
    font-size: 16px;
    line-height: 1.6;
    margin-bottom: 28px;
  }

  .de-wizard-v2-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #fff;
    border-bottom: 1px solid ${Colors.Line};
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .de-wizard-v2-stepper {
    display: flex;
    gap: 8px;
    align-items: center;
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .de-wizard-v2-stepper::-webkit-scrollbar {
    display: none;
  }

  .de-wizard-v2-stepper__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    color: ${Colors.Placeholder};
    font-size: 13px;
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .de-wizard-v2-stepper__item--active {
    background: rgba(88, 86, 235, 0.1);
    color: ${Colors.LovablePrimary};
    font-weight: 700;
  }

  .de-wizard-v2-stepper__item--done .de-wizard-v2-stepper__num {
    background: ${Colors.LovablePrimary};
    color: #fff;
  }

  .de-wizard-v2-stepper__num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    background: #e2e8f0;
  }

  .de-wizard-v2-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 16px;
  }

  .de-wizard-v2-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px calc(14px + env(safe-area-inset-bottom));
    background: rgba(255, 255, 255, 0.97);
    border-top: 1px solid ${Colors.Line};
    backdrop-filter: blur(8px);
    z-index: 100;
  }

  .de-wizard-v2-footer__back {
    border: none;
    background: none;
    color: ${Colors.Placeholder};
    font-weight: 600;
    cursor: pointer;
    font-size: 15px;
  }

  .de-wizard-v2-details__head h2,
  .de-wizard-v2-publish__head h2 {
    margin: 0 0 6px;
    font-size: 28px;
    color: #0f172a;
  }

  .de-wizard-v2-details__head p,
  .de-wizard-v2-publish__head p {
    color: ${Colors.Placeholder};
    margin-bottom: 20px;
  }

  .de-wizard-v2-card {
    margin-bottom: 12px;
  }

  .de-wizard-accordion {
    background: #fff;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    margin-bottom: 10px;
    overflow: hidden;
  }

  .de-wizard-accordion__head {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px;
    border: none;
    background: #fff;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    text-align: left;
  }

  .de-wizard-accordion__body {
    padding: 0 18px 18px;
    border-top: 1px solid ${Colors.Line};
  }

  .de-wizard-media__upload {
    display: inline-flex;
    padding: 12px 18px;
    border: 2px dashed ${Colors.Line};
    border-radius: 12px;
    cursor: pointer;
    color: ${Colors.LovablePrimary};
    font-weight: 600;
  }

  .de-wizard-media__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
  }

  .de-wizard-media__item {
    position: relative;
    width: 88px;
    height: 88px;
    border-radius: 10px;
    overflow: hidden;
  }

  .de-wizard-media__item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .de-wizard-media__item button {
    position: absolute;
    top: 4px;
    right: 4px;
    border: none;
    background: rgba(0,0,0,0.55);
    color: #fff;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    cursor: pointer;
  }

  .de-wizard-v2-plano__summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 14px;
    margin-bottom: 10px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid ${Colors.Line};
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }

  .de-wizard-v2-plano__summary-dot {
    color: ${Colors.Placeholder};
  }

  .de-wizard-v2-plano__nav {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    margin-bottom: 12px;
    position: sticky;
    top: 0;
    z-index: 20;
    padding: 4px 0 8px;
    background: #f8fafc;
  }

  .de-wizard-v2-plano__nav-btn {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 64px;
    padding: 8px 4px;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #fff;
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
  }

  .de-wizard-v2-plano__nav-btn--active {
    border-color: ${Colors.LovablePrimary};
    background: rgba(88, 86, 235, 0.1);
    color: ${Colors.LovablePrimary};
    box-shadow: 0 4px 14px rgba(88, 86, 235, 0.12);
  }

  .de-wizard-v2-plano__nav-icon {
    font-size: 18px;
    line-height: 1;
  }

  .de-wizard-v2-plano__nav-label {
    line-height: 1.2;
    text-align: center;
  }

  .de-wizard-v2-plano__nav-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: ${Colors.LovablePrimary};
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .de-wizard-v2-plano__hint {
    margin: 0 0 10px;
    font-size: 13px;
    color: ${Colors.Placeholder};
    line-height: 1.45;
  }

  .de-wizard-v2-plano__canvas {
    min-width: 0;
  }

  .de-wizard-v2-plano__panel {
    background: #fff;
    border: 1px solid ${Colors.Line};
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .de-wizard-v2-plano__panel-head h3 {
    margin: 0 0 6px;
    font-size: 18px;
    font-weight: 800;
    color: ${Colors.TexColor};
  }

  .de-wizard-v2-plano__panel-head p {
    margin: 0;
    font-size: 13px;
    color: ${Colors.Placeholder};
    line-height: 1.45;
  }

  .de-wizard-v2-plano__empty {
    text-align: center;
    padding: 24px 12px;
    color: ${Colors.Placeholder};
  }

  .de-wizard-v2-plano__panel-cta {
    width: 100%;
    border: none;
    border-radius: 12px;
    padding: 14px 16px;
    background: ${Colors.LovablePrimary};
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .de-wizard-v2-plano__panel-cta--secondary {
    background: #fff;
    color: ${Colors.LovablePrimary};
    border: 1px solid ${Colors.LovablePrimary};
  }

  .de-wizard-v2-cat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #f8fafc;
    text-align: left;
    cursor: pointer;
  }

  .de-wizard-v2-cat-card__dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .de-wizard-v2-cat-card__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .de-wizard-v2-cat-card__body strong {
    font-size: 15px;
    color: ${Colors.TexColor};
  }

  .de-wizard-v2-cat-card__body small {
    font-size: 12px;
    color: ${Colors.Placeholder};
  }

  .de-wizard-v2-cat-card__edit {
    font-size: 12px;
    font-weight: 700;
    color: ${Colors.LovablePrimary};
    flex-shrink: 0;
  }

  .de-wizard-v2-gate-card {
    padding-bottom: 4px;
  }

  .de-wizard-v2-ticket-card {
    padding: 14px;
    border: 1px solid ${Colors.Line};
    border-radius: 14px;
    background: #f8fafc;
    display: grid;
    gap: 10px;
  }

  .de-wizard-v2-ticket-card__head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .de-wizard-v2-ticket-card__qty {
    margin-left: auto;
    font-size: 12px;
    color: ${Colors.Placeholder};
    font-weight: 600;
  }

  .de-wizard-v2-ticket-card__subtotal {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }

  .de-wizard-v2-revenue-total--inline {
    margin-top: 4px;
  }

  .de-fp-workspace-bar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px 4px;
    border-bottom: 1px solid ${Colors.Line};
    background: #F8FAFC;
  }

  .de-fp-workspace-bar__label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${Colors.Placeholder};
  }

  .de-fp-workspace-bar__presets {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .de-fp-workspace-bar__presets::-webkit-scrollbar {
    display: none;
  }

  .de-fp-workspace-bar__btn {
    flex: 0 0 auto;
    border: 1px solid ${Colors.Line};
    border-radius: 999px;
    background: #fff;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    color: ${Colors.TexColor};
  }

  .de-fp-workspace-bar__btn--active {
    border-color: ${Colors.LovablePrimary};
    background: ${Colors.LovablePrimaryLight};
    color: ${Colors.LovablePrimary};
  }

  .de-fp-editor--compact {
    max-width: 100%;
    width: 100%;
  }

  .de-fp-editor--compact .de-fp-editor__header,
  .de-fp-editor--compact .de-fp-statusbar {
    display: none;
  }

  .de-fp-editor--compact .de-fp-toolbar {
    padding: 6px 8px;
    gap: 4px;
  }

  .de-fp-editor--compact .de-fp-tool--icon {
    width: 34px;
    height: 34px;
    font-size: 15px;
    border-radius: 10px;
  }

  .de-fp-editor--compact .de-fp-canvas-wrap {
    min-height: auto;
    max-height: min(52vh, 420px);
    padding: 10px 8px 8px;
    overflow: auto;
  }

  .de-fp-editor--compact .de-fp-canvas {
    min-height: 600px;
  }

  .de-fp-editor--compact .de-fp-shape-bar {
    padding: 8px 8px 10px;
    gap: 6px;
  }

  .de-fp-editor--compact .de-fp-shape-btn {
    min-width: 60px;
    padding: 6px 8px;
    font-size: 11px;
  }

  @media (max-width: 640px) {
    .de-wizard-v2-topbar {
      padding: 10px 12px;
      gap: 8px;
    }

    .de-wizard-v2-topbar__logo span {
      font-size: 14px;
    }

    .de-wizard-v2-stepper__item {
      padding: 4px 10px;
      font-size: 12px;
    }

    .de-wizard-v2-stepper__num {
      width: 22px;
      height: 22px;
      font-size: 11px;
    }

    .de-wizard-v2-body {
      padding: 16px 12px calc(100px + env(safe-area-inset-bottom));
    }

    .de-wizard-v2-footer {
      padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
    }

    .de-wizard-v2-details__head h2,
    .de-wizard-v2-publish__head h2 {
      font-size: 22px;
    }

    .de-wizard-grid-2 {
      grid-template-columns: 1fr;
    }

    .de-wizard-v2-plano__nav-btn {
      min-height: 58px;
      font-size: 10px;
    }

    .de-wizard-v2-plano__nav-icon {
      font-size: 16px;
    }
  }

  @media (min-width: 900px) {
    .de-wizard-v2-plano__nav {
      max-width: 520px;
      margin-left: auto;
      margin-right: auto;
    }

    .de-fp-editor--compact .de-fp-canvas-wrap {
      min-height: 520px;
    }
  }

  .de-wizard-v2-publish__grid {
    display: grid;
    gap: 20px;
  }

  @media (min-width: 900px) {
    .de-wizard-v2-publish__grid {
      grid-template-columns: 1.2fr 0.8fr;
    }
  }

  .de-wizard-v2-publish__map-card {
    background: #fff;
    border: 1px solid ${Colors.Line};
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  .de-wizard-v2-publish__map-placeholder {
    min-height: 220px;
    display: grid;
    place-items: center;
    background: #f1f5f9;
    color: ${Colors.Placeholder};
  }

  .de-wizard-v2-publish__event-info {
    padding: 20px;
  }

  .de-wizard-v2-publish__event-info h3 {
    margin: 0 0 6px;
    font-size: 22px;
  }

  .de-wizard-v2-publish__meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${Colors.Line};
  }

  .de-wizard-v2-publish__meta small {
    display: block;
    color: ${Colors.Placeholder};
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .de-wizard-v2-publish__contact {
    margin-top: 12px;
    font-size: 13px;
    color: ${Colors.Placeholder};
    line-height: 1.5;
  }

  .de-wizard-v2-publish__sidebar {
    background: #fff;
    border: 1px solid ${Colors.Line};
    border-radius: 16px;
    padding: 20px;
  }

  .de-wizard-v2-publish__sidebar h4 {
    margin: 0 0 12px;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${Colors.Placeholder};
  }

  .de-wizard-v2-revenue-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid ${Colors.Line};
  }

  .de-wizard-v2-revenue-row small {
    display: block;
    color: ${Colors.Placeholder};
    font-size: 12px;
  }

  .de-wizard-v2-revenue-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 14px;
    padding: 14px;
    border-radius: 12px;
    background: rgba(88, 86, 235, 0.08);
    font-weight: 700;
    color: ${Colors.LovablePrimary};
  }

  .de-wizard-v2-gates-list {
    margin-top: 20px;
  }

  .de-wizard-v2-gate-chip {
    display: inline-block;
    margin: 4px 6px 0 0;
    padding: 6px 12px;
    border-radius: 999px;
    background: #f1f5f9;
    font-size: 13px;
    font-weight: 600;
  }

  .de-checkout-timer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(105, 121, 248, 0.12), rgba(239, 68, 68, 0.08));
    border: 1px solid rgba(105, 121, 248, 0.2);
    margin-bottom: 12px;
  }

  .de-checkout-timer__clock {
    font-size: 28px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: ${Colors.LovablePrimary};
    min-width: 72px;
  }

  .de-checkout-timer--urgent .de-checkout-timer__clock {
    color: #dc2626;
  }

  .de-checkout-selection-list {
    display: grid;
    gap: 8px;
    margin: 12px 0;
  }

  .de-checkout-selection-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f8fafc;
    font-size: 14px;
  }

  @keyframes de-float-nav-in {
    0% { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.92); }
    60% { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.02); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
  }

  @keyframes de-float-nav-out {
    0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    100% { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.92); }
  }

  @keyframes de-fab-in {
    0% { opacity: 0; transform: translateY(24px) scale(0.8); }
    60% { opacity: 1; transform: translateY(-4px) scale(1.05); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes de-fab-out {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(24px) scale(0.8); }
  }
`;

export { Colors, FontSizes, Layout };
