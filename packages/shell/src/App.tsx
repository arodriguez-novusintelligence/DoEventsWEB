import React from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';

import { isAuthenticated } from '@doevents/shared';

import { AuthMicrofrontend } from './remotes/AuthMicrofrontend';

import { LovableLayout } from './lovable-bridge/LovableLayout';

import { EventsPage } from './pages/EventsPage';
import { MapPage } from './pages/MapPage';
import { WallPage } from './pages/WallPage';

import { ProfilePage } from './pages/ProfilePage';
import { ProfileVenuesPage } from './pages/ProfileVenuesPage';
import { ProfileStatsPage } from './pages/ProfileStatsPage';
import { ProfilePublicationsPage } from './pages/ProfilePublicationsPage';
import { PublicUserProfilePage } from './pages/PublicUserProfilePage';
import { UserServicesPage } from './pages/UserServicesPage';

import { PlanOverviewPage } from './pages/PlanOverviewPage';
import { PlansCatalogPage } from './pages/PlansCatalogPage';
import { PlanDetailPage } from './pages/PlanDetailPage';
import { PlanProPage } from './pages/PlanProPage';

import { ProfileGalleryPage } from './pages/ProfileGalleryPage';

import { EventDetailPage } from './pages/EventDetailPage';
import { EventDetailFullPage } from './pages/EventDetailFullPage';

import { CreateEventPage } from './pages/CreateEventPage';

import { PublishSitePage } from './pages/PublishSitePage';
import { PlaceDetailPage } from './pages/PlaceDetailPage';
import { PlaceReservePage } from './pages/PlaceReservePage';
import { PlaceEditPage } from './pages/PlaceEditPage';
import { EventEditPage } from './pages/EventEditPage';
import { ServiceEditPage } from './pages/ServiceEditPage';
import { SearchEventsPage } from './pages/SearchEventsPage';
import { KycPage } from './pages/KycPage';

import { MyEventsPage } from './pages/MyEventsPage';

import { TicketCheckoutPage } from './pages/TicketCheckoutPage';

import { OrderConfirmationPage } from './pages/OrderConfirmationPage';

import { TicketsPage } from './pages/TicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { AccessControlPage } from './pages/AccessControlPage';
import { GuestsHubPage } from './pages/GuestsHubPage';
import { EventGuestsPage } from './pages/EventGuestsPage';
import { MyInvitationsPage } from './pages/MyInvitationsPage';
import { RefundsPage } from './pages/RefundsPage';
import { ServiceCreatePage } from './pages/ServiceCreatePage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';

import { NotificationsPage } from './pages/NotificationsPage';

import { ChatPage } from './pages/ChatPage';
import { PaymentFinallyPage } from './pages/PaymentFinallyPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { AdminPanelView, AdminLegacyRedirect } from '@lovable/components/admin/AdminPanelView';
import AdminRefundsPanel from '@lovable/components/admin/AdminRefundsPanel';
import AdminReportsPanel from '@lovable/components/admin/AdminReportsPanel';
import { NotFound } from './pages/NotFound';
import { EventPublished } from './pages/EventPublished';
import { PurchasesPage } from './pages/PurchasesPage';
import { PurchasesVenuesPage } from './pages/PurchasesVenuesPage';
import { PurchasesServicesPage } from './pages/PurchasesServicesPage';
import VenueReservationDetail from '@lovable/components/purchases/VenueReservationDetail';
import ServiceReservationDetail from '@lovable/components/purchases/ServiceReservationDetail';



const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const authed = isAuthenticated();

  if (!authed) {

    return <Navigate to="/auth/login" replace />;

  }

  return <>{children}</>;

};



export const AppRouter: React.FC = () => (

  <Routes>

    <Route

      path="/"

      element={

        <ProtectedRoute>

          <LovableLayout />

        </ProtectedRoute>

      }

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
      <Route path="payment-finally" element={<PaymentFinallyPage />} />

      <Route path="assistant" element={<AIAssistantPage />} />

      <Route path="admin" element={<AdminPanelView />} />
      <Route path="admin/users" element={<AdminLegacyRedirect section="users" />} />
      <Route path="admin/refunds" element={<AdminRefundsPanel />} />
      <Route path="admin/reports" element={<AdminReportsPanel />} />
      <Route path="admin/events" element={<AdminLegacyRedirect section="events" />} />
      <Route path="admin/orders" element={<AdminLegacyRedirect section="orders" />} />
      <Route path="admin/venues" element={<AdminLegacyRedirect section="venues" />} />
      <Route path="admin/services" element={<AdminLegacyRedirect section="services" />} />
      <Route path="admin/activity" element={<AdminLegacyRedirect section="activity" />} />

      <Route path="feed" element={<Navigate to="/" replace />} />

      <Route path="*" element={<NotFound />} />

    </Route>

    <Route path="/auth/*" element={<AuthMicrofrontend />} />

    <Route path="*" element={<NotFound />} />

  </Routes>

);

