import React from 'react';

interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsDialog: React.FC<TermsDialogProps> = ({ open, onClose, onAccept }) => {
  if (!open) return null;

  return (
    <div className="de-terms-dialog" role="dialog" aria-modal="true" aria-labelledby="terms-dialog-title">
      <div className="de-terms-dialog__panel">
        <div className="de-terms-dialog__header">
          <h3 id="terms-dialog-title">Términos y Condiciones</h3>
          <p>Do.Events — Versión actualizada</p>
        </div>
        <div className="de-terms-dialog__body">
          <p>
            Bienvenidos a Do.Events. Estos términos describen las reglas para el uso de la aplicación móvil y/o web
            Do.Events. Al acceder a la aplicación aceptas estos términos en su totalidad.
          </p>
          <p>
            Do.Events es una plataforma tecnológica que permite gestionar eventos de principio a fin: crear, publicar,
            vender, comunicar, contratar servicios, gestionar invitados, control de accesos y estadísticas.
          </p>
          <p>
            Te comprometes a no publicar contenido ofensivo, ilegal o engañoso, a respetar la privacidad de otros usuarios
            y a proporcionar información real al registrarte.
          </p>
          <p>
            Para registrarte y vender boletas debes ser mayor de 18 años. El tratamiento de datos personales se realiza
            conforme a nuestra política de privacidad y la normativa colombiana aplicable.
          </p>
        </div>
        <div className="de-terms-dialog__footer">
          <button type="button" className="de-btn-pill-primary" onClick={() => { onAccept?.(); onClose(); }}>
            Aceptar términos
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsDialog;
