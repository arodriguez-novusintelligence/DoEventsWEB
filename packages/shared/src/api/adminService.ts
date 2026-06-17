import { getAuthToken, getCurrentEnv } from './client';
import { getStoredUserId } from './authService';
import { toUserFacingError } from '../lib/apiError';

export interface AdminUserSummary {
  userId: string;
  email: string;
  username?: string;
  nombre?: string;
  apellido?: string;
  plan?: string;
  platformRole?: string;
  status?: 'active' | 'blocked' | 'suspended' | 'deleted';
  blacklisted?: boolean;
  blacklistedAt?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  eventsCount?: number;
  ordersCount?: number;
}

export interface AdminActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface AdminAIMetrics {
  totalInteractions: number;
  emptyResultSearches: number;
  emptyResultRate: number;
  topIntents: Array<{ intent: string; count: number }>;
  topAgents: Array<{ agent: string; count: number }>;
  conversationsByDay: Array<{ date: string; count: number }>;
  generatedAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  adminUsers?: number;
  proSubscribers: number;
  totalEvents: number;
  publishedEvents?: number;
  draftEvents?: number;
  cancelledEvents?: number;
  eventsInProgress?: number;
  totalOrders: number;
  ordersToday?: number;
  totalVenues?: number;
  totalServices?: number;
  revenueCop: number;
  revenueTodayCop?: number;
  recentActivity?: AdminActivityItem[];
  homeKpis?: {
    activeEvents: number;
    ticketsSoldToday: number;
    revenueTodayCop: number;
    totalUsers: number;
    changes: {
      ticketsSoldToday: number;
      revenueTodayCop: number;
      totalUsers: number;
      activeEvents: number;
    };
  };
  recentEvents?: AdminRecentEventItem[];
  recentTransactions?: AdminRecentTransactionItem[];
  topOrganizers?: AdminTopOrganizerItem[];
}

export interface AdminRecentEventItem {
  id: string;
  name: string;
  organizer: string;
  date: string;
  sold: number;
  total: number;
  status: 'activo' | 'finalizado';
}

export interface AdminRecentTransactionItem {
  id: string;
  event: string;
  amount: number;
  type: 'ingreso' | 'dispersión';
  date: string;
}

export interface AdminTopOrganizerItem {
  rank: number;
  name: string;
  events: number;
  revenueCop: number;
  occupancy: number;
}

export interface AdminSupportProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  description: string;
  followers: number;
  following: number;
  rating: number;
  yearsAsEventer: number;
  eventsCreated: number;
  publications: number;
  guestManagement: number;
  venues: number;
  services: number;
  eventInvitations: number;
  ticketsPurchased: number;
  eventStats: number;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isPrivateProfile: boolean;
  phone?: string;
  whatsapp?: string;
  contactEmail?: string;
  platformRole?: string;
  accountStatus?: string;
}

export interface AdminPaymentItem {
  id: string;
  eventId: string;
  eventName: string;
  organizer: string;
  organizerEmail: string;
  totalTickets: number;
  ticketsSold: number;
  occupancy: number;
  currency: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  status: 'pendiente' | 'procesado' | 'dispersado';
  eventStartDate: string;
  eventEndDate: string;
  ticketsPendingPayment: number;
}

export interface AdminNewUserItem extends AdminUserSummary {
  fullName?: string;
  authSource?: string;
  country?: string;
  rating?: number;
  eventsCount?: number;
  ticketsBought?: number;
}

export interface AdminStaffUser extends AdminUserSummary {
  fullName?: string;
  staffStatus?: 'pendiente' | 'aprobado' | 'rechazado' | 'cerrado';
  staffRole?: 'Admin' | 'Support' | 'Operation' | null;
}

export interface AdminEventItem {
  id: string;
  nombre: string;
  estatus: string;
  fechaIni?: string;
  fechaFin?: string;
  ciudad?: string;
  userId?: string;
  createDate?: string;
  descripcion?: string;
  departamento?: string;
  aforo?: number;
  imagen?: string;
  deletedAt?: string | null;
}

export interface AdminOrderItem {
  orderId: string;
  eventId?: string;
  userId?: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt?: string;
}

export interface AdminVenueItem {
  venueId: string;
  name: string;
  city?: string;
  address?: string;
  description?: string;
  ownerUserId?: string;
  capacity?: number;
  type?: string;
  mainImage?: string;
  status?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface AdminServiceItem {
  serviceId: string;
  name: string;
  category?: string;
  description?: string;
  userId?: string;
  city?: string;
  status?: string;
  rating?: number;
  minPrice?: number;
  profileImageUrl?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface AdminPlatformRole {
  id: string;
  label: string;
  description: string;
  level: number;
  canAccessAdmin: boolean;
  permissions: string[];
}

export interface AdminUserActivityResponse {
  auditLog: AdminActivityItem[];
  content: {
    events: AdminEventItem[];
    venues: AdminVenueItem[];
    services: AdminServiceItem[];
  };
}

function adminBase(): string {
  const env = getCurrentEnv();
  return env.endpoints.adminBase || `${env.apiBaseUrl}/backoffice`;
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

function withUserIdQuery(path: string): string {
  const userId = getStoredUserId();
  if (!userId) return path;
  const joiner = path.includes('?') ? '&' : '?';
  return `${path}${joiner}userId=${encodeURIComponent(userId)}`;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withUserIdQuery(`${adminBase()}${path}`), {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(body.message || 'Error en el panel de administración');
  return body;
}

export async function fetchAdminDashboard(): Promise<AdminDashboardStats> {
  try {
    return await adminFetch<AdminDashboardStats>('/dashboard');
  } catch (err) {
    throw new Error(toUserFacingError(err, 'el panel de administración'));
  }
}

export async function fetchAdminActivity(limit = 50): Promise<AdminActivityItem[]> {
  const body = await adminFetch<{ activity?: AdminActivityItem[] }>(`/activity?limit=${limit}`);
  return body.activity || [];
}

export async function fetchAdminAIMetrics(): Promise<AdminAIMetrics> {
  return adminFetch<AdminAIMetrics>('/ai/metrics');
}

export async function fetchAdminEvents(): Promise<{
  summary: Record<string, number>;
  events: AdminEventItem[];
}> {
  return adminFetch('/events');
}

export async function fetchAdminOrders(): Promise<{
  summary: Record<string, number>;
  orders: AdminOrderItem[];
}> {
  return adminFetch('/orders');
}

export async function fetchAdminVenues(limit = 50): Promise<{
  total: number;
  venues: AdminVenueItem[];
}> {
  return adminFetch(`/venues?limit=${limit}`);
}

export async function fetchAdminServices(limit = 50): Promise<{
  total: number;
  services: AdminServiceItem[];
}> {
  return adminFetch(`/services?limit=${limit}`);
}

export async function searchAdminUsers(
  query: string,
  limit = 50,
  role?: 'admin' | 'blocked',
): Promise<AdminUserSummary[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (role) params.set('role', role);
  const body = await adminFetch<{ users?: AdminUserSummary[] }>(`/users/search?${params}`);
  return body.users || [];
}

export async function getAdminUser(userId: string): Promise<AdminUserSummary & { profile?: AdminSupportProfile }> {
  return adminFetch(`/users/${encodeURIComponent(userId)}`);
}

export async function updateAdminUser(
  userId: string,
  patch: {
    plan?: 'free' | 'pro';
    platformRole?: string;
    status?: 'active' | 'blocked' | 'suspended';
    blacklisted?: boolean;
    password?: string;
    staffStatus?: 'pendiente' | 'aprobado' | 'rechazado' | 'cerrado';
    staffRole?: 'admin' | 'support' | 'operation';
  },
): Promise<AdminUserSummary> {
  return adminFetch(`/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteAdminUser(
  userId: string,
  options?: { blacklist?: boolean },
): Promise<{ success: boolean; userId: string; blacklisted: boolean }> {
  return adminFetch(`/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    body: JSON.stringify({ blacklist: options?.blacklist !== false }),
  });
}

export async function fetchAdminUserActivity(userId: string): Promise<AdminUserActivityResponse> {
  return adminFetch(`/users/${encodeURIComponent(userId)}/activity`);
}

export async function fetchAdminPlatformRoles(): Promise<AdminPlatformRole[]> {
  const body = await adminFetch<{ roles?: AdminPlatformRole[] }>('/roles');
  return body.roles || [];
}

export async function getAdminEventDetail(eventId: string): Promise<AdminEventItem> {
  const body = await adminFetch<{ event: AdminEventItem }>(`/events/${encodeURIComponent(eventId)}`);
  return body.event;
}

export async function deleteAdminEvent(eventId: string): Promise<{ success: boolean }> {
  return adminFetch(`/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
}

export async function getAdminVenueDetail(venueId: string): Promise<AdminVenueItem> {
  const body = await adminFetch<{ venue: AdminVenueItem }>(`/venues/${encodeURIComponent(venueId)}`);
  return body.venue;
}

export async function deleteAdminVenue(venueId: string): Promise<{ success: boolean }> {
  return adminFetch(`/venues/${encodeURIComponent(venueId)}`, { method: 'DELETE' });
}

export async function getAdminServiceDetail(serviceId: string): Promise<AdminServiceItem> {
  const body = await adminFetch<{ service: AdminServiceItem }>(`/services/${encodeURIComponent(serviceId)}`);
  return body.service;
}

export async function deleteAdminService(serviceId: string): Promise<{ success: boolean }> {
  return adminFetch(`/services/${encodeURIComponent(serviceId)}`, { method: 'DELETE' });
}

export async function fetchAdminPayments(): Promise<{
  summary: { pendingCop: number; processedCop: number; disbursedCop: number };
  payments: AdminPaymentItem[];
}> {
  return adminFetch('/payments');
}

export async function fetchAdminNewUsers(period: 'today' | 'yesterday' | '7d' | 'all' = 'today'): Promise<{
  stats: { today: number; yesterday: number; week: number; change: number };
  dailySeries: Array<{ day: string; current: number; previous: number }>;
  trend: Array<{ label: string; count: number }>;
  sources: Array<{ name: string; value: number }>;
  users: AdminNewUserItem[];
}> {
  return adminFetch(`/new-users?period=${period}`);
}

export async function fetchAdminStaffUsers(options?: {
  query?: string;
  limit?: number;
}): Promise<{
  summary: Record<string, number>;
  users: AdminStaffUser[];
}> {
  const params = new URLSearchParams();
  if (options?.query?.trim()) params.set('q', options.query.trim());
  if (options?.limit) params.set('limit', String(options.limit));
  const qs = params.toString();
  return adminFetch(`/staff-users${qs ? `?${qs}` : ''}`);
}
