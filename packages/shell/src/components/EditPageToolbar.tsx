import React from 'react';
import { useNavigate } from 'react-router-dom';

interface EditPageToolbarProps {
  saving?: boolean;
  dirty?: boolean;
  onSave: () => void | Promise<void>;
  saveLabel?: string;
}

export const EditPageToolbar: React.FC<EditPageToolbarProps> = ({
  saving,
  dirty,
  onSave,
  saveLabel = 'Guardar',
}) => {
  const navigate = useNavigate();

  const goFeed = () => {
    if (dirty && !window.confirm('Tienes cambios sin guardar. Si sales ahora, se perderán. ¿Continuar?')) {
      return;
    }
    navigate('/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg gap-3">
        <button
          type="button"
          className="flex-1 rounded-full border border-border py-3 text-sm font-semibold"
          onClick={goFeed}
        >
          Volver al Feed
        </button>
        <button
          type="button"
          disabled={saving}
          className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          onClick={() => void onSave()}
        >
          {saving ? 'Guardando…' : saveLabel}
        </button>
      </div>
    </div>
  );
};

export function confirmLeaveIfDirty(dirty: boolean, onLeave: () => void) {
  if (dirty && !window.confirm('Tienes cambios sin guardar. Si sales ahora, se perderán. ¿Continuar?')) {
    return;
  }
  onLeave();
}

export default EditPageToolbar;
