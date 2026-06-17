/**
 * Limpieza QA: usuarios/eventos/venues de prueba + feed social sin basura.
 */
const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION || 'us-east-2';
const SUFFIX = '-qa';
const DRY_RUN = process.env.DRY_RUN === '1';
const FULL_WIPE = process.env.FULL_WIPE === '1';

const TABLES = {
  clients: `Client${SUFFIX}`,
  userPrefs: `UserPreferences${SUFFIX}`,
  events: `Eventos${SUFFIX}`,
  tickets: `Tickets${SUFFIX}`,
  ticketsDist: `TicketsDistribution${SUFFIX}`,
  orders: `Orders${SUFFIX}`,
  venues: `Venues${SUFFIX}`,
  floors: `Venue_Floor${SUFFIX}`,
  elements: `Venue_Element${SUFFIX}`,
  categories: `Venue_Category${SUFFIX}`,
  seats: `Venue_Seat${SUFFIX}`,
  gates: `Venue_Gate${SUFFIX}`,
  images: `imagenes${SUFFIX}`,
  favorites: `userFavoriteEvents${SUFFIX}`,
  invitations: `EventInvitations${SUFFIX}`,
  services: `ServiceProviders${SUFFIX}`,
  chats: `Chats${SUFFIX}`,
  chatMessages: `ChatMessage${SUFFIX}`,
  chatIdempotency: `ChatMessageIdempotency${SUFFIX}`,
  notifications: `Notifications${SUFFIX}`,
  publications: `FeedPublications${SUFFIX}`,
  timeline: `FeedTimeline${SUFFIX}`,
  pubLikes: `FeedPublicationLikes${SUFFIX}`,
  pubReposts: `FeedPublicationReposts${SUFFIX}`,
  comments: `FeedComments${SUFFIX}`,
  commentLikes: `FeedCommentLikes${SUFFIX}`,
  shares: `FeedShares${SUFFIX}`,
  feedMedia: `FeedMedia${SUFFIX}`,
};

const TEST_USER_PREFIX = 'qa-';
const TEST_EVENT_PREFIX = 'qa-';
const TEST_EMAILS = new Set([
  'qa-gustos@doeventsapp.com',
  'qa-full@doeventsapp.com',
  'qa-inactive@doeventsapp.com',
  'maria.eventos@doeventsapp.com',
  'carlos.live@doeventsapp.com',
  'laura.cultura@doeventsapp.com',
  'andres.music@doeventsapp.com',
]);

const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });

const LEGACY_TEST_USER_PREFIX = '42c2e4a4-';
const COMMUNITY_TEST_PREFIX = 'qa-comm-';

const isTestUserId = (id) => typeof id === 'string' && (
  id.startsWith(TEST_USER_PREFIX)
  || id.startsWith(LEGACY_TEST_USER_PREFIX)
  || id.startsWith(COMMUNITY_TEST_PREFIX)
);
const isTestEventId = (id) => typeof id === 'string' && (
  id.startsWith(TEST_EVENT_PREFIX)
  || id.startsWith('cypress-')
);
const isJunkEventName = (name) => {
  const n = String(name || '').trim();
  if (!n) return true;
  return /qa wizard|prueba|detox|cypress|seed|demo|wizard|^test$/i.test(n);
};

const scanAll = async (tableName, params = {}) => {
  try {
    const items = [];
    let lastKey;
    do {
      const res = await ddb.scan({
        TableName: tableName,
        ExclusiveStartKey: lastKey,
        ...params,
      }).promise();
      items.push(...(res.Items || []));
      lastKey = res.LastEvaluatedKey;
    } while (lastKey);
    return items;
  } catch (err) {
    if (/ResourceNotFoundException/i.test(err.code || err.message)) return [];
    throw err;
  }
};

const queryAll = async (tableName, indexName, keyName, keyValue, extra = {}) => {
  const items = [];
  let lastKey;
  do {
    const res = await ddb.query({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: `${keyName} = :v`,
      ExpressionAttributeValues: { ':v': keyValue },
      ExclusiveStartKey: lastKey,
      ...extra,
    }).promise();
    items.push(...(res.Items || []));
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return items;
};

const deleteOne = async (tableName, key) => {
  if (DRY_RUN) return;
  await ddb.delete({ TableName: tableName, Key: key }).promise();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteMany = async (tableName, items, keyMapper) => {
  let deleted = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    try {
      const key = keyMapper(item);
      if (!key || Object.values(key).some((v) => v == null || v === '')) continue;
      await deleteOne(tableName, key);
      deleted += 1;
      if (deleted % 25 === 0) await sleep(200);
    } catch (err) {
      console.error(`  WARN ${tableName}:`, err.message);
      if (/ProvisionedThroughputExceeded/i.test(err.message)) await sleep(1000);
    }
  }
  return deleted;
};

const deleteVenueCascade = async (venueId) => {
  if (!venueId) return;
  if (DRY_RUN) {
    console.log(`  [dry] venue ${venueId}`);
    return;
  }

  const floors = await queryAll(TABLES.floors, 'venueIdIndex', 'venueId', venueId);
  for (const floor of floors) {
    const elements = await queryAll(TABLES.elements, 'floorIdIndex', 'floorId', floor.floorId);
    await deleteMany(TABLES.elements, elements, (x) => ({ elementId: x.elementId }));

    const categories = await queryAll(TABLES.categories, 'floorIdIndex', 'floorId', floor.floorId);
    for (const category of categories) {
      const seats = await queryAll(TABLES.seats, 'categoryIdIndex', 'categoryId', category.categoryId);
      await deleteMany(TABLES.seats, seats, (x) => ({ seatId: x.seatId }));
      await deleteOne(TABLES.categories, { categoryId: category.categoryId });
    }
    await deleteOne(TABLES.floors, { floorId: floor.floorId });
  }

  const venueCategories = await queryAll(TABLES.categories, 'venueIdIndex', 'venueId', venueId);
  for (const category of venueCategories) {
    const seats = await queryAll(TABLES.seats, 'categoryIdIndex', 'categoryId', category.categoryId);
    await deleteMany(TABLES.seats, seats, (x) => ({ seatId: x.seatId }));
    await deleteOne(TABLES.categories, { categoryId: category.categoryId });
  }

  const gates = await queryAll(TABLES.gates, 'venueIdIndex', 'venueId', venueId);
  await deleteMany(TABLES.gates, gates, (x) => ({ gateId: x.gateId }));

  try {
    await deleteOne(TABLES.venues, { venue_id: venueId });
  } catch (_) { /* ignore */ }
};

const deleteEventData = async (eventId, venueIds) => {
  const tickets = await queryAll(TABLES.tickets, 'eventIdIndex', 'eventId', eventId);
  await deleteMany(TABLES.tickets, tickets, (x) => ({ id: x.id }));

  const dists = await queryAll(TABLES.ticketsDist, 'eventIdIndex', 'eventId', eventId);
  await deleteMany(
    TABLES.ticketsDist,
    dists.filter((x) => x.id && x.createDate),
    (x) => ({ id: x.id, createDate: x.createDate }),
  );

  const orders = await queryAll(TABLES.orders, 'eventIdIndex', 'event_id', eventId);
  await deleteMany(TABLES.orders, orders, (x) => ({ order_id: x.order_id }));

  const images = await scanAll(TABLES.images, {
    FilterExpression: 'id_evento = :e',
    ExpressionAttributeValues: { ':e': eventId },
  });
  await deleteMany(TABLES.images, images, (x) => ({ id: x.id }));

  const favs = await scanAll(TABLES.favorites, {
    FilterExpression: 'eventId = :e',
    ExpressionAttributeValues: { ':e': eventId },
  });
  await deleteMany(TABLES.favorites, favs, (x) => ({ userId: x.userId, eventId: x.eventId }));

  const invites = await scanAll(TABLES.invitations, {
    FilterExpression: 'eventId = :e',
    ExpressionAttributeValues: { ':e': eventId },
  });
  await deleteMany(
    TABLES.invitations,
    invites,
    (x) => (x.PK && x.SK ? { PK: x.PK, SK: x.SK } : x.id ? { id: x.id } : null),
  );

  for (const venueId of venueIds) {
    await deleteVenueCascade(venueId);
  }

  await deleteOne(TABLES.events, { id: eventId });
};

const wipeTable = async (tableName, keyMapper) => {
  const items = await scanAll(tableName);
  const deleted = await deleteMany(tableName, items, keyMapper);
  console.log(`  ${tableName}: ${deleted}/${items.length}`);
  return deleted;
};

const main = async () => {
  console.log(`Region: ${REGION}`);
  console.log(`Modo: ${DRY_RUN ? 'DRY RUN' : 'ELIMINAR'}${FULL_WIPE ? ' (FULL_WIPE)' : ''}`);

  const [clients, events, venues, services] = await Promise.all([
    scanAll(TABLES.clients),
    scanAll(TABLES.events),
    scanAll(TABLES.venues),
    scanAll(TABLES.services),
  ]);

  const validUserIds = new Set(clients.map((c) => c.id).filter(Boolean));
  const testUserIds = new Set();
  for (const client of clients) {
    const id = client.id;
    const email = String(client.email || '').toLowerCase();
    const username = String(client.user || client.username || '').toLowerCase();
    if (
      isTestUserId(id)
      || TEST_EMAILS.has(email)
      || (email.endsWith('@doeventsapp.com') && /^(qa-|test|cypress)/.test(email))
      || /^(qa_|test_|cypress_)/.test(username)
    ) {
      testUserIds.add(id);
    }
  }

  console.log('\n=== Eventos de prueba / huérfanos ===');
  const targetEvents = [];
  const venueIdsToDelete = new Set();

  for (const event of events) {
    const id = event.id;
    const userId = event.userId;
    if (!id || event.estatus === 'DELETED') continue;

    const isTest = FULL_WIPE
      || isTestEventId(id)
      || isTestUserId(userId)
      || testUserIds.has(userId)
      || !validUserIds.has(userId)
      || isJunkEventName(event.nombre || event.name);

    if (!isTest) continue;

    const vIds = new Set();
    if (event.venueId) vIds.add(event.venueId);
    if (event.venue_id) vIds.add(event.venue_id);
    targetEvents.push({ eventId: id, nombre: event.nombre || id, venueIds: [...vIds] });
    vIds.forEach((v) => venueIdsToDelete.add(v));
  }

  console.log(`Eventos: ${targetEvents.length}`);
  targetEvents.forEach((e) => console.log(`  - ${e.eventId} | ${e.nombre}`));

  for (const venue of venues) {
    const venueId = venue.venue_id || venue.venueId;
    const ownerId = venue.userId || venue.ownerId || venue.createdBy;
    if (!venueId) continue;
    if (FULL_WIPE || isTestUserId(ownerId) || testUserIds.has(ownerId) || !validUserIds.has(ownerId)) {
      venueIdsToDelete.add(venueId);
    }
  }

  if (FULL_WIPE) {
    console.log('\n=== FULL_WIPE: todos los eventos y venues ===');
    for (const event of events) {
      const id = event.id;
      if (!id || event.estatus === 'DELETED') continue;
      const vIds = new Set();
      if (event.venueId) vIds.add(event.venueId);
      if (event.venue_id) vIds.add(event.venue_id);
      if (!targetEvents.find((t) => t.eventId === id)) {
        targetEvents.push({ eventId: id, nombre: event.nombre || id, venueIds: [...vIds] });
      }
      vIds.forEach((v) => venueIdsToDelete.add(v));
    }
    venues.forEach((venue) => {
      const venueId = venue.venue_id || venue.venueId;
      if (venueId) venueIdsToDelete.add(venueId);
    });
  }

  let eventsDeleted = 0;
  for (const target of targetEvents) {
    try {
      await deleteEventData(target.eventId, target.venueIds);
      eventsDeleted += 1;
      console.log(`OK evento: ${target.eventId}`);
    } catch (err) {
      console.error(`ERROR evento ${target.eventId}:`, err.message);
    }
  }

  for (const venueId of venueIdsToDelete) {
    try {
      await deleteVenueCascade(venueId);
      console.log(`OK venue: ${venueId}`);
    } catch (err) {
      console.error(`ERROR venue ${venueId}:`, err.message);
    }
  }

  console.log('\n=== Feed social (vacío) ===');
  await wipeTable(TABLES.publications, (x) => ({ id: x.id }));
  await wipeTable(TABLES.timeline, (x) => ({ id: x.id }));
  await wipeTable(TABLES.pubLikes, (x) => ({ publicationId: x.publicationId, userId: x.userId }));
  await wipeTable(TABLES.pubReposts, (x) => (x.publicationId && x.userId
    ? { publicationId: x.publicationId, userId: x.userId }
    : x.id ? { id: x.id } : null));
  await wipeTable(TABLES.comments, (x) => ({ id: x.id }));
  await wipeTable(TABLES.commentLikes, (x) => (x.commentId && x.userId
    ? { commentId: x.commentId, userId: x.userId }
    : x.id ? { id: x.id } : null));
  await wipeTable(TABLES.shares, (x) => ({ id: x.id }));
  await wipeTable(TABLES.feedMedia, (x) => ({ id: x.id }));

  console.log('\n=== Chats, mensajes y notificaciones ===');
  await wipeTable(TABLES.chatMessages, (x) => (
    x.id && x.createdAt != null ? { id: x.id, createdAt: x.createdAt } : null
  ));
  await wipeTable(TABLES.chatIdempotency, (x) => (x.idempotencyKey ? { idempotencyKey: x.idempotencyKey } : x.id ? { id: x.id } : null));
  await wipeTable(TABLES.chats, (x) => (
    x.id && x.updatedAt ? { id: x.id, updatedAt: x.updatedAt } : null
  ));

  await wipeTable(TABLES.notifications, (x) => (
    x.userId && x.timestamp ? { userId: x.userId, timestamp: x.timestamp } : null
  ));

  console.log('\n=== Servicios y usuarios de prueba ===');
  if (FULL_WIPE) {
    await wipeTable(TABLES.services, (x) => ({ serviceId: x.serviceId }));
    await wipeTable(TABLES.tickets, (x) => ({ id: x.id }));
    await wipeTable(TABLES.ticketsDist, (x) => (
      x.id && x.createDate ? { id: x.id, createDate: x.createDate } : null
    ));
    await wipeTable(TABLES.orders, (x) => ({ order_id: x.order_id }));
  } else {
    const testServices = services.filter((s) => isTestUserId(s.userId) || String(s.serviceId || '').startsWith('sp-qa-'));
    await deleteMany(TABLES.services, testServices, (x) => ({ serviceId: x.serviceId }));
  }

  for (const userId of testUserIds) {
    try {
      await deleteOne(TABLES.userPrefs, { UserId: userId });
      await deleteOne(TABLES.clients, { id: userId });
      console.log(`OK usuario: ${userId}`);
    } catch (err) {
      console.error(`ERROR usuario ${userId}:`, err.message);
    }
  }

  const remainingFavs = await scanAll(TABLES.favorites);
  const junkFavs = remainingFavs.filter((f) => isTestUserId(f.userId) || testUserIds.has(f.userId) || isTestEventId(f.eventId));
  await deleteMany(TABLES.favorites, junkFavs, (x) => ({ userId: x.userId, eventId: x.eventId }));

  console.log(`\nCompletado: ${eventsDeleted} eventos, feed vaciado, ${testUserIds.size} usuarios revisados.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
