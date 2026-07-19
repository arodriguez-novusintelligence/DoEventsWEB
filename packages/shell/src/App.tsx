import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from '@doevents/shared';
import { ForgotPasswordView } from '@lovable/components/auth/ForgotPasswordView';
import { LoginView } from '@lovable/components/auth/LoginView';
import { ResetPasswordView } from '@lovable/components/auth/ResetPasswordView';
import { SignUpView } from '@lovable/components/auth/SignUpView';
import LovableLayout from './lovable-bridge/LovableLayout';
import PageFallback from './components/PageFallback';
import PageErrorBoundary from './components/PageErrorBoundary';
import { lazyPage, lazyNamedPage } from './lib/lazyPage';

const AuthMicrofrontend = lazyNamedPage(
  () => import('./remotes/AuthMicrofrontend'),
  'AuthMicrofrontend',
);

const WallPage = lazyPage(() => import('./pages/WallPage'));
const EventsPage = lazyPage(() => import('./pages/EventsPage'));
const MapPage = lazyPage(() => import('./pages/MapPage'));
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'));
const ProfileVenuesPage = lazyPage(() => import('./pages/ProfileVenuesPage'));
const ProfileStatsPage = lazyPage(() => import('./pages/ProfileStatsPage'));
const ProfilePublicationsPage = lazyPage(() => import('./pages/ProfilePublicationsPage'));
const PublicUserProfilePage = lazyPage(() => import('./pages/PublicUserProfilePage'));
const UserServicesPage = lazyPage(() => import('./pages/UserServicesPage'));
const PlanOverviewPage = lazyPage(() => import('./pages/PlanOverviewPage'));
const PlansCatalogPage = lazyPage(() => import('./pages/PlansCatalogPage'));
const PlanDetailPage = lazyPage(() => import('./pages/PlanDetailPage'));
const PlanProPage = lazyPage(() => import('./pages/PlanProPage'));
const ProfileGalleryPage = lazyPage(() => import('./pages/ProfileGalleryPage'));
const EventDetailPage = lazyPage(() => import('./pages/EventDetailPage'));
const EventDetailFullPage = lazyPage(() => import('./pages/EventDetailFullPage'));
const CreateEventPage = lazyPage(() => import('./pages/CreateEventPage'));
const PublishSitePage = lazyPage(() => import('./pages/PublishSitePage'));
const PlaceDetailPage = lazyPage(() => import('./pages/PlaceDetailPage'));
const PlaceReservePage = lazyPage(() => import('./pages/PlaceReservePage'));
const PlaceEditPage = lazyPage(() => import('./pages/PlaceEditPage'));
const EventEditPage = lazyPage(() => import('./pages/EventEditPage'));
const ServiceEditPage = lazyPage(() => import('./pages/ServiceEditPage'));
const SearchEventsPage = lazyPage(() => import('./pages/SearchEventsPage'));
const KycPage = lazyPage(() => import('./pages/KycPage'));
const MyEventsPage = lazyPage(() => import('./pages/MyEventsPage'));
const TicketCheckoutPage = lazyPage(() => import('./pages/TicketCheckoutPage'));
const OrderConfirmationPage = lazyPage(() => import('./pages/OrderConfirmationPage'));
const TicketsPage = lazyPage(() => import('./pages/TicketsPage'));
const TicketDetailPage = lazyPage(() => import('./pages/TicketDetailPage'));
const AccessControlPage = lazyPage(() => import('./pages/AccessControlPage'));
const GuestsHubPage = lazyPage(() => import('./pages/GuestsHubPage'));
const EventGuestsPage = lazyPage(() => import('./pages/EventGuestsPage'));
const MyInvitationsPage = lazyPage(() => import('./pages/MyInvitationsPage'));
const RefundsPage = lazyPage(() => import('./pages/RefundsPage'));
const ServiceCreatePage = lazyPage(() => import('./pages/ServiceCreatePage'));
const ServiceDetailPage = lazyPage(() => import('./pages/ServiceDetailPage'));
const NotificationsPage = lazyPage(() => import('./pages/NotificationsPage'));
const ChatPage = lazyPage(() => import('./pages/ChatPage'));
const PaymentFinallyPage = lazyPage(() => import('./pages/PaymentFinallyPage'));
const AIAssistantPage = lazyPage(() => import('./pages/AIAssistantPage'));
const NotFound = lazyPage(() => import('./pages/NotFound'));
const EventPublished = lazyPage(() => import('./pages/EventPublished'));
const PurchasesPage = lazyPage(() => import('./pages/PurchasesPage'));
const PurchasesVenuesPage = lazyPage(() => import('./pages/PurchasesVenuesPage'));
const PurchasesServicesPage = lazyPage(() => import('./pages/PurchasesServicesPage'));
const VenueReservationDetail = lazyPage(() => import('@lovable/components/purchases/VenueReservationDetail'));
const ServiceReservationDetail = lazyPage(() => import('@lovable/components/purchases/ServiceReservationDetail'));

const AdminPanelView = lazyNamedPage(
  () => import('@lovable/components/admin/AdminPanelView'),
  'AdminPanelView',
);
const AdminLegacyRedirect = lazyNamedPage(
  () => import('@lovable/components/admin/AdminPanelView'),
  'AdminLegacyRedirect',
);
const AdminGuardedLegacyRedirect = lazyNamedPage(
  () => import('@lovable/components/admin/AdminPanelView'),
  'AdminGuardedLegacyRedirect',
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authed = isAuthenticated();
  if (!authed) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
};

export const AppRouter: React.FC = () => (
  <PageErrorBoundary>
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/payment-finally" element={<PaymentFinallyPage />} />

        <Route
          path="/"
          element={(
            <ProtectedRoute>
              <LovableLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<WallPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:orderId" element={<TicketDetailPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="purchases/venues" element={<PurchasesVenuesPage />} />
          <Route path="purchases/venues/:bookingId" element={<VenueReservationDetail />} />
          <Route path="purchases/services" element={<PurchasesServicesPage />} />
          <Route path="purchases/services/:bookingId" element={<ServiceReservationDetail />} />
          <Route path="events/published" element={<EventPublished />} />
          <Route path="access" element={<AccessControlPage />} />
          <Route path="guests" element={<GuestsHubPage />} />
          <Route path="profile/invitations" element={<MyInvitationsPage />} />
          <Route path="profile/refunds" element={<RefundsPage />} />
          <Route path="profile/gallery" element={<ProfileGalleryPage />} />
          <Route path="profile/plan" element={<PlanOverviewPage />} />
          <Route path="profile/plans" element={<PlansCatalogPage />} />
          <Route path="profile/plan/detail" element={<PlanDetailPage />} />
          <Route path="profile/plan/pro" element={<PlanProPage />} />
          <Route path="profile/stats" element={<ProfileStatsPage />} />
          <Route path="profile/venues" element={<ProfileVenuesPage />} />
          <Route path="profile/publications" element={<ProfilePublicationsPage />} />
          <Route path="profile/kyc" element={<KycPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="users/:userId" element={<PublicUserProfilePage />} />
          <Route path="users/:userId/services" element={<UserServicesPage />} />
          <Route path="my-events" element={<MyEventsPage />} />
          <Route path="search" element={<SearchEventsPage />} />
          <Route path="sites/publish" element={<PublishSitePage />} />
          <Route path="places/publish" element={<PublishSitePage />} />
          <Route path="places/:venueId/edit" element={<PlaceEditPage />} />
          <Route path="places/:venueId/reserve" element={<PlaceReservePage />} />
          <Route path="places/:venueId" element={<PlaceDetailPage />} />
          <Route path="events/create" element={<CreateEventPage />} />
          <Route path="services/create" element={<ServiceCreatePage />} />
          <Route path="services/:serviceId/edit" element={<ServiceEditPage />} />
          <Route path="services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="events/:eventId/checkout" element={<TicketCheckoutPage />} />
          <Route path="events/:eventId/guests" element={<EventGuestsPage />} />
          <Route path="events/:eventId/detalle" element={<EventDetailFullPage />} />
          <Route path="events/:eventId/edit" element={<EventEditPage />} />
          <Route path="events/:eventId" element={<EventDetailPage />} />
          <Route path="orders/:orderId/confirm" element={<OrderConfirmationPage />} />
          <Route path="assistant" element={<AIAssistantPage />} />
          <Route path="admin" element={<AdminPanelView />} />
          <Route path="admin/users" element={<AdminLegacyRedirect section="users" />} />
          <Route path="admin/refunds" element={<AdminGuardedLegacyRedirect section="refunds" />} />
          <Route path="admin/reports" element={<AdminGuardedLegacyRedirect section="reports" />} />
          <Route path="admin/events" element={<AdminLegacyRedirect section="events" />} />
          <Route path="admin/orders" element={<AdminLegacyRedirect section="orders" />} />
          <Route path="admin/venues" element={<AdminLegacyRedirect section="venues" />} />
          <Route path="admin/services" element={<AdminLegacyRedirect section="services" />} />
          <Route path="admin/activity" element={<AdminLegacyRedirect section="activity" />} />
          <Route path="feed" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/auth/forgot-password" element={<ForgotPasswordView />} />
        <Route path="/auth/login" element={<LoginView />} />
        <Route path="/auth/register" element={<SignUpView />} />
        <Route path="/auth/reset-password" element={<ResetPasswordView />} />
        <Route path="/auth/*" element={<AuthMicrofrontend />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </PageErrorBoundary>
);
