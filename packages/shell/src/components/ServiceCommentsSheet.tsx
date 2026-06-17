import React from 'react';
import { Loader, ServiceComment } from '@doevents/shared';

export interface ServiceCommentsSheetProps {
  open: boolean;
  loading: boolean;
  comments: ServiceComment[];
  onClose: () => void;
}

export const ServiceCommentsSheet: React.FC<ServiceCommentsSheetProps> = ({
  open,
  loading,
  comments,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={onClose} role="presentation">
      <div className="de-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="de-sheet__header">
          <h2>Comentarios</h2>
          <button type="button" className="de-sheet__close" onClick={onClose}>×</button>
        </header>
        <div className="de-sheet__body">
          {loading ? (
            <Loader />
          ) : comments.length === 0 ? (
            <p className="de-empty-state">Aún no tienes comentarios sobre tu experiencia.</p>
          ) : (
            <div className="de-service-comments">
              {comments.map((item) => (
                <article key={item.id} className="de-service-comment">
                  <strong>{item.authorName}</strong>
                  <span style={{ marginLeft: 8 }}>{item.rating > 0 ? `⭐ ${item.rating.toFixed(1)}` : ''}</span>
                  {item.eventName && <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0' }}>{item.eventName}</p>}
                  {item.comment && <p style={{ margin: '6px 0 0' }}>{item.comment}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceCommentsSheet;
