import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@lovable/lib/utils';

interface DeleteOwnItemButtonProps {
  label: string;
  onDelete: () => Promise<void>;
  className?: string;
  compact?: boolean;
}

export const DeleteOwnItemButton: React.FC<DeleteOwnItemButtonProps> = ({
  label,
  onDelete,
  className,
  compact = false,
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    const ok = window.confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        disabled={deleting}
        onClick={(e) => void handleClick(e)}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border border-destructive/30 bg-card/90 text-destructive shadow-sm hover:bg-destructive/10 disabled:opacity-50',
          className,
        )}
        aria-label={`Eliminar ${label}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={(e) => void handleClick(e)}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50',
        className,
      )}
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? 'Eliminando…' : `Eliminar ${label}`}
    </button>
  );
};

export default DeleteOwnItemButton;
