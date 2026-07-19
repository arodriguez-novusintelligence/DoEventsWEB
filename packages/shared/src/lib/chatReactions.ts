export interface ChatMessageReaction {
  userId: string;
  emoji: string;
  createdAt?: string;
}

export const CHAT_QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'] as const;

export type ChatQuickReaction = typeof CHAT_QUICK_REACTIONS[number];

export function normalizeChatReactions(raw: unknown): ChatMessageReaction[] {
  if (!Array.isArray(raw)) return [];
  const result: ChatMessageReaction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as ChatMessageReaction;
    const userId = String(record.userId || '').trim();
    const emoji = String(record.emoji || '').trim();
    if (!userId || !emoji) continue;
    result.push({
      userId,
      emoji,
      ...(record.createdAt ? { createdAt: record.createdAt } : {}),
    });
  }
  return result;
}

export function toggleChatReaction(
  reactions: ChatMessageReaction[] | undefined,
  userId: string,
  emoji: string,
): ChatMessageReaction[] {
  const list = [...normalizeChatReactions(reactions)];
  const idx = list.findIndex((item) => item.userId === userId);
  const normalizedEmoji = emoji.trim();

  if (!normalizedEmoji) {
    if (idx >= 0) list.splice(idx, 1);
    return list;
  }

  if (idx >= 0 && list[idx].emoji === normalizedEmoji) {
    list.splice(idx, 1);
    return list;
  }

  const entry: ChatMessageReaction = {
    userId,
    emoji: normalizedEmoji,
    createdAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }

  return list;
}

export function groupChatReactions(reactions: ChatMessageReaction[] | undefined) {
  const groups = new Map<string, string[]>();
  normalizeChatReactions(reactions).forEach((reaction) => {
    const users = groups.get(reaction.emoji) || [];
    users.push(reaction.userId);
    groups.set(reaction.emoji, users);
  });
  return Array.from(groups.entries()).map(([emoji, userIds]) => ({ emoji, userIds }));
}

export function resolveUserChatReaction(
  reactions: ChatMessageReaction[] | undefined,
  userId?: string,
): string | undefined {
  if (!userId) return undefined;
  return normalizeChatReactions(reactions).find((item) => item.userId === userId)?.emoji;
}
