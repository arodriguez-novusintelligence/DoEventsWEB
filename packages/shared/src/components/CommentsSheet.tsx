import React, { useEffect, useState } from 'react';
import { Button, TextField } from './UI';
import { Loader } from './Loader';
import type { FeedComment } from '../types/feed';

export interface CommentsSheetProps {
  open: boolean;
  publicationId: string | null;
  onClose: () => void;
  loadComments: (publicationId: string) => Promise<FeedComment[]>;
  onSubmitComment: (publicationId: string, text: string) => Promise<void>;
}

export const CommentsSheet: React.FC<CommentsSheetProps> = ({
  open,
  publicationId,
  onClose,
  loadComments,
  onSubmitComment,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!open || !publicationId) return;
    let cancelled = false;
    setLoading(true);
    loadComments(publicationId)
      .then((items) => { if (!cancelled) setComments(items); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, publicationId, loadComments]);

  if (!open || !publicationId) return null;

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmitComment(publicationId, text.trim());
      const items = await loadComments(publicationId);
      setComments(items);
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={onClose} role="presentation">
      <div className="de-sheet de-sheet--tall" onClick={(e) => e.stopPropagation()}>
        <header className="de-sheet__header">
          <h2>Comentarios</h2>
          <button type="button" className="de-sheet__close" onClick={onClose}>×</button>
        </header>
        <div className="de-sheet__body">
          {loading ? (
            <Loader />
          ) : comments.length === 0 ? (
            <p className="de-empty-state">Sé el primero en comentar.</p>
          ) : (
            <div className="de-comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="de-comment-item">
                  <p className="de-comment-item__author">{comment.author?.name || 'Usuario'}</p>
                  <p className="de-comment-item__text">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
          <div className="de-comment-form">
            <TextField
              label="Tu comentario"
              value={text}
              onChange={(e) => setText(e.target.value)}
              variant="bordered"
              placeholder="Escribe un comentario..."
            />
            <Button
              label={submitting ? 'Enviando...' : 'Comentar'}
              tone="lovable"
              disabled={submitting || !text.trim()}
              onClick={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
