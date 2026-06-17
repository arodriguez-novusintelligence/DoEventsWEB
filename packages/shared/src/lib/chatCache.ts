type CachedChatRoom = Record<string, unknown>;
type CachedChatMessage = Record<string, unknown>;

const CHAT_ROOMS_KEY = 'doevents_chat_rooms_v1';
const CHAT_MESSAGES_KEY = 'doevents_chat_messages_v1';

export const CHAT_ROOMS_FRESH_MS = 3 * 60 * 1000;
export const CHAT_MESSAGES_FRESH_MS = 2 * 60 * 1000;
export const CHAT_CACHE_STALE_MS = 30 * 60 * 1000;

interface TimedEntry<T> {
  data: T;
  cachedAt: number;
}

interface RoomsStore {
  users: Record<string, TimedEntry<CachedChatRoom[]>>;
}

interface MessagesStore {
  rooms: Record<string, TimedEntry<CachedChatMessage[]>>;
}

const roomsMemory = new Map<string, TimedEntry<CachedChatRoom[]>>();
const messagesMemory = new Map<string, TimedEntry<CachedChatMessage[]>>();

function readRoomsStore(): RoomsStore {
  try {
    const raw = localStorage.getItem(CHAT_ROOMS_KEY);
    if (!raw) return { users: {} };
    return JSON.parse(raw) as RoomsStore;
  } catch {
    return { users: {} };
  }
}

function writeRoomsStore(store: RoomsStore): void {
  try {
    localStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(store));
  } catch {
    // ignore quota
  }
}

function readMessagesStore(): MessagesStore {
  try {
    const raw = localStorage.getItem(CHAT_MESSAGES_KEY);
    if (!raw) return { rooms: {} };
    return JSON.parse(raw) as MessagesStore;
  } catch {
    return { rooms: {} };
  }
}

function writeMessagesStore(store: MessagesStore): void {
  try {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(store));
  } catch {
    // ignore quota
  }
}

function isFresh(cachedAt: number, freshMs: number): boolean {
  return Date.now() - cachedAt < freshMs;
}

function isStaleButUsable(cachedAt: number): boolean {
  const age = Date.now() - cachedAt;
  return age >= CHAT_ROOMS_FRESH_MS && age < CHAT_CACHE_STALE_MS;
}

function getUsableEntry<T>(
  entry: TimedEntry<T> | undefined,
  freshMs: number,
): TimedEntry<T> | null {
  if (!entry) return null;
  if (isFresh(entry.cachedAt, freshMs)) return entry;
  if (isStaleButUsable(entry.cachedAt)) return entry;
  return null;
}

export function getCachedChatRooms<T = CachedChatRoom>(userId: string): T[] | null {
  const memory = roomsMemory.get(userId);
  const memoryEntry = getUsableEntry(memory, CHAT_ROOMS_FRESH_MS);
  if (memoryEntry) return memoryEntry.data as T[];

  const store = readRoomsStore();
  const entry = getUsableEntry(store.users[userId], CHAT_ROOMS_FRESH_MS);
  if (!entry) return null;
  roomsMemory.set(userId, entry);
  return entry.data as T[];
}

export function cacheChatRooms<T = CachedChatRoom>(userId: string, rooms: T[]): void {
  const entry: TimedEntry<CachedChatRoom[]> = { data: rooms as CachedChatRoom[], cachedAt: Date.now() };
  roomsMemory.set(userId, entry);
  const store = readRoomsStore();
  store.users[userId] = entry;
  writeRoomsStore(store);
}

export function getCachedChatMessages<T = CachedChatMessage>(roomId: string): T[] | null {
  const memory = messagesMemory.get(roomId);
  const memoryEntry = getUsableEntry(memory, CHAT_MESSAGES_FRESH_MS);
  if (memoryEntry) return memoryEntry.data as T[];

  const store = readMessagesStore();
  const entry = getUsableEntry(store.rooms[roomId], CHAT_MESSAGES_FRESH_MS);
  if (!entry) return null;
  messagesMemory.set(roomId, entry);
  return entry.data as T[];
}

export function cacheChatMessages<T = CachedChatMessage>(roomId: string, messages: T[]): void {
  const entry: TimedEntry<CachedChatMessage[]> = { data: messages as CachedChatMessage[], cachedAt: Date.now() };
  messagesMemory.set(roomId, entry);
  const store = readMessagesStore();
  store.rooms[roomId] = entry;
  writeMessagesStore(store);
}

export function patchCachedChatRoom<T extends { roomId?: string; id?: string }>(
  userId: string,
  room: T,
): void {
  const cached = getCachedChatRooms<T>(userId);
  if (!cached) return;
  const roomId = room.roomId || room.id;
  if (!roomId) return;
  const next = [
    room,
    ...cached.filter((item) => (item.roomId || item.id) !== roomId),
  ];
  cacheChatRooms(userId, next);
}

export function invalidateChatCache(userId?: string): void {
  if (userId) {
    roomsMemory.delete(userId);
    const store = readRoomsStore();
    delete store.users[userId];
    writeRoomsStore(store);
    return;
  }
  roomsMemory.clear();
  messagesMemory.clear();
  try {
    localStorage.removeItem(CHAT_ROOMS_KEY);
    localStorage.removeItem(CHAT_MESSAGES_KEY);
  } catch {
    // ignore
  }
}
