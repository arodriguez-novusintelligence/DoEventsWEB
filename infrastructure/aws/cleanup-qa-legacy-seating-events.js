/**
 * Elimina eventos QA con silletería antigua (hasSeating) creados hasta hoy inclusive.
 * También borra tickets, distribuciones, órdenes y venues asociados.
 */
const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION || 'us-east-2';
const SUFFIX = '-qa';
const CUTOFF_ISO = process.env.CUTOFF_DATE || '2026-06-10T23:59:59.999Z';

const TABLES = {
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
};

const ddb = new AWS.DynamoDB.DocumentClient({ region: REGION });
const cutoffMs = Date.parse(CUTOFF_ISO);

const batchDelete = async (tableName, items, keyMapper) => {
  if (!items.length) return 0;
  let deleted = 0;
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await ddb.batchWrite({
      RequestItems: {
        [tableName]: chunk.map((item) => ({
          DeleteRequest: { Key: keyMapper(item) },
        })),
      },
    }).promise();
    deleted += chunk.length;
  }
  return deleted;
};

const scanAll = async (tableName, params = {}) => {
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

const parseDate = (value) => {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
};

const isOnOrBeforeCutoff = (event) => {
  const created = parseDate(event.createDate || event.createdAt || event.publishAt);
  return created > 0 && created <= cutoffMs;
};

const deleteVenueCascade = async (venueId) => {
  if (!venueId) return;
  const venueKey = { venue_id: venueId };

  const floors = await queryAll(TABLES.floors, 'venueIdIndex', 'venueId', venueId);
  for (const floor of floors) {
    const elements = await queryAll(TABLES.elements, 'floorIdIndex', 'floorId', floor.floorId);
    await batchDelete(TABLES.elements, elements, (x) => ({ elementId: x.elementId }));

    const categories = await queryAll(TABLES.categories, 'floorIdIndex', 'floorId', floor.floorId);
    for (const category of categories) {
      const seats = await queryAll(TABLES.seats, 'categoryIdIndex', 'categoryId', category.categoryId);
      await batchDelete(TABLES.seats, seats, (x) => ({ seatId: x.seatId }));
      await ddb.delete({ TableName: TABLES.categories, Key: { categoryId: category.categoryId } }).promise();
    }

    await ddb.delete({ TableName: TABLES.floors, Key: { floorId: floor.floorId } }).promise();
  }

  const venueCategories = await queryAll(TABLES.categories, 'venueIdIndex', 'venueId', venueId);
  for (const category of venueCategories) {
    const seats = await queryAll(TABLES.seats, 'categoryIdIndex', 'categoryId', category.categoryId);
    await batchDelete(TABLES.seats, seats, (x) => ({ seatId: x.seatId }));
    await ddb.delete({ TableName: TABLES.categories, Key: { categoryId: category.categoryId } }).promise();
  }

  const gates = await queryAll(TABLES.gates, 'venueIdIndex', 'venueId', venueId);
  await batchDelete(TABLES.gates, gates, (x) => ({ gateId: x.gateId }));

  try {
    await ddb.delete({ TableName: TABLES.venues, Key: venueKey }).promise();
  } catch (_) { /* ignore */ }
};

const deleteEventData = async (eventId, venueIds) => {
  const tickets = await queryAll(TABLES.tickets, 'eventIdIndex', 'eventId', eventId);
  await batchDelete(TABLES.tickets, tickets, (x) => ({ id: x.id }));

  const dists = await queryAll(TABLES.ticketsDist, 'eventIdIndex', 'eventId', eventId);
  await batchDelete(TABLES.ticketsDist, dists, (x) => ({ id: x.id, createDate: x.createDate }));

  const orders = await queryAll(TABLES.orders, 'eventIdIndex', 'event_id', eventId);
  await batchDelete(TABLES.orders, orders, (x) => ({ order_id: x.order_id }));

  const images = await scanAll(TABLES.images, {
    FilterExpression: 'id_evento = :e',
    ExpressionAttributeValues: { ':e': eventId },
  });
  await batchDelete(TABLES.images, images, (x) => ({ id: x.id }));

  for (const venueId of venueIds) {
    await deleteVenueCascade(venueId);
  }

  await ddb.delete({ TableName: TABLES.events, Key: { id: eventId } }).promise();
};

const main = async () => {
  console.log(`Region: ${REGION}`);
  console.log(`Cutoff: ${CUTOFF_ISO}`);

  const [allTickets, allEvents, allVenues] = await Promise.all([
    scanAll(TABLES.tickets),
    scanAll(TABLES.events),
    scanAll(TABLES.venues),
  ]);

  const seatingEventIds = new Set();
  for (const ticket of allTickets) {
    if (ticket.hasSeating === true && ticket.eventId) {
      seatingEventIds.add(ticket.eventId);
    }
  }

  const venueById = new Map();
  for (const venue of allVenues) {
    const id = venue.venue_id || venue.venueId;
    if (id) venueById.set(id, venue);
  }

  const eventsById = new Map(allEvents.map((e) => [e.id, e]));
  const targets = [];

  for (const eventId of seatingEventIds) {
    const event = eventsById.get(eventId);
    if (!event) continue;
    if (event.estatus === 'DELETED') continue;
    if (!isOnOrBeforeCutoff(event)) continue;

    const venueIds = new Set();
    if (event.venueId) venueIds.add(event.venueId);

    for (const ticket of allTickets) {
      if (ticket.eventId === eventId && ticket.venueId) venueIds.add(ticket.venueId);
    }

    let hasSeatingVenue = false;
    for (const venueId of venueIds) {
      const venue = venueById.get(venueId);
      if (venue?.hasSeating === true) hasSeatingVenue = true;
    }

    if (hasSeatingVenue || allTickets.some((t) => t.eventId === eventId && t.hasSeating === true)) {
      targets.push({
        eventId,
        nombre: event.nombre || event.name || eventId,
        createDate: event.createDate,
        venueIds: [...venueIds],
      });
    }
  }

  // Eventos con venue de silletería aunque no tengan registro en Tickets
  for (const event of allEvents) {
    if (!event.id || event.estatus === 'DELETED') continue;
    if (!isOnOrBeforeCutoff(event)) continue;
    if (!event.venueId) continue;
    const venue = venueById.get(event.venueId);
    if (venue?.hasSeating !== true) continue;
    if (targets.some((t) => t.eventId === event.id)) continue;
    targets.push({
      eventId: event.id,
      nombre: event.nombre || event.name || event.id,
      createDate: event.createDate,
      venueIds: [event.venueId],
    });
  }

  console.log(`Eventos a eliminar: ${targets.length}`);
  targets.forEach((t) => console.log(`  - ${t.eventId} | ${t.nombre} | ${t.createDate || 'sin fecha'}`));

  let ok = 0;
  for (const target of targets) {
    try {
      await deleteEventData(target.eventId, target.venueIds);
      ok += 1;
      console.log(`OK eliminado: ${target.eventId}`);
    } catch (err) {
      console.error(`ERROR ${target.eventId}:`, err.message);
    }
  }

  console.log(`\nCompletado: ${ok}/${targets.length} eventos eliminados.`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
