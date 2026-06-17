/**
 * Confirma salida de un flujo de creación/edición con opción de guardar borrador.
 */
export async function confirmLeaveWithSave(options: {
  dirty: boolean;
  canSaveDraft?: boolean;
  onSaveDraft?: () => Promise<void>;
  onLeave: () => void;
}): Promise<void> {
  const { dirty, canSaveDraft, onSaveDraft, onLeave } = options;
  if (!dirty) {
    onLeave();
    return;
  }

  if (canSaveDraft && onSaveDraft) {
    const wantSave = window.confirm(
      'Tienes cambios sin guardar. ¿Deseas guardarlos como borrador antes de salir?',
    );
    if (wantSave) {
      try {
        await onSaveDraft();
        onLeave();
        return;
      } catch {
        if (!window.confirm('No se pudo guardar el borrador. ¿Salir sin guardar?')) return;
        onLeave();
        return;
      }
    }
  }

  if (window.confirm('¿Descartar los cambios y salir?')) {
    onLeave();
  }
}

export function isJsonDifferent(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}
