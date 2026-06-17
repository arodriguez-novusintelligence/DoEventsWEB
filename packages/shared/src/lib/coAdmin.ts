export type CoAdminEntityType = 'EVENT' | 'VENUE' | 'SERVICE' | 'PUBLICATION';

export function canEditEntity(
  userId: string | null | undefined,
  ownerId: string | null | undefined,
  coAdminIds?: string[] | null,
): boolean {
  if (!userId) return false;
  if (ownerId && userId === ownerId) return true;
  return (coAdminIds || []).includes(userId);
}

export function isEntityOwner(
  userId: string | null | undefined,
  ownerId: string | null | undefined,
): boolean {
  return Boolean(userId && ownerId && userId === ownerId);
}
