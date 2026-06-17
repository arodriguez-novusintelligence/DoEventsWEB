import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFollowersList, fetchFollowingList, followUser, Loader, unfollowUser, useToast } from '@doevents/shared';

export interface FollowersSheetProps {
  open: boolean;
  userId: string;
  viewerId?: string;
  tab: 'followers' | 'following';
  onClose: () => void;
}

export const FollowersSheet: React.FC<FollowersSheetProps> = ({
  open,
  userId,
  viewerId,
  tab,
  onClose,
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<{ id: string; name: string; avatarUrl?: string | null }>>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const [list, myFollowing] = await Promise.all([
        tab === 'followers' ? fetchFollowersList(userId) : fetchFollowingList(userId),
        viewerId ? fetchFollowingList(viewerId).catch(() => []) : Promise.resolve([]),
      ]);
      if (!cancelled) {
        setItems(list);
        setFollowingIds(new Set(myFollowing.map((item) => item.id)));
      }
    };

    load()
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, userId, viewerId, tab]);

  const toggleFollow = async (targetId: string) => {
    if (!viewerId || viewerId === targetId) return;
    const isFollowing = followingIds.has(targetId);
    try {
      if (isFollowing) {
        await unfollowUser(viewerId, targetId);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        await followUser(viewerId, targetId);
        setFollowingIds((prev) => new Set(prev).add(targetId));
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo actualizar el seguimiento', 'error');
    }
  };

  if (!open) return null;

  return (
    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={onClose} role="presentation">
      <div className="de-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="de-sheet__header">
          <h2>{tab === 'followers' ? 'Seguidores' : 'Seguidos'}</h2>
          <button type="button" className="de-sheet__close" onClick={onClose}>×</button>
        </header>
        <div className="de-sheet__body">
          {loading ? (
            <Loader />
          ) : items.length === 0 ? (
            <p className="de-empty-state">Sin resultados todavía.</p>
          ) : (
            <ul className="de-follow-list">
              {items.map((item) => (
                <li key={item.id} className="de-follow-list__item">
                  <button type="button" className="de-follow-list__avatar" onClick={() => { onClose(); navigate(`/users/${item.id}`); }}>
                    {item.avatarUrl ? <img src={item.avatarUrl} alt={item.name} /> : item.name.charAt(0)}
                  </button>
                  <button type="button" style={{ flex: 1, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => { onClose(); navigate(`/users/${item.id}`); }}>
                    {item.name}
                  </button>
                  {viewerId && viewerId !== item.id && tab === 'followers' && (
                    <button
                      type="button"
                      className="de-profile-pill-btn de-profile-pill-btn--outline"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      onClick={() => toggleFollow(item.id)}
                    >
                      {followingIds.has(item.id) ? 'Siguiendo' : 'Seguir'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersSheet;
