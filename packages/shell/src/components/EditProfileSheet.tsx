import React, { useEffect, useState } from 'react';
import {
  Button,
  TextField,
  UpdateUserProfileInput,
  formatFileSize,
  resolveManualUserLocation,
  updateUserProfile,
  uploadProfileAvatar,
  setProfileAvatarFromGallery,
  appendImageCacheBuster,
  ProfileMediaPickerSheet,
  useToast,
  validateProfileImageFile,
  invalidateProfilePageCache,
  invalidateCachedProfile,
  PROFILE_PAGE_CACHE_INVALIDATED_EVENT,
} from '@doevents/shared';
import { ProfileSettingsPanel } from './ProfileSettingsPanel';

export interface EditProfileSheetProps {
  open: boolean;
  userId: string;
  plan?: string;
  isPublicProfile?: boolean;
  initial: UpdateUserProfileInput & {
    bio?: string;
    ciudad?: string;
    departamento?: string;
    pais?: string;
    direccion?: string;
    documento?: string;
    tipoDocumento?: string;
  };
  onClose: () => void;
  onSaved: () => void;
  onVisibilityChange?: (isPublic: boolean) => void;
  onOpenBankData?: () => void;
}



export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  open,
  userId,
  plan,
  isPublicProfile = true,
  initial,
  onClose,
  onSaved,
  onVisibilityChange,
  onOpenBankData,
}) => {

  const { showToast } = useToast();

  const [name, setName] = useState(initial.name || '');

  const [lastName, setLastName] = useState(initial.lastName || '');

  const [username, setUsername] = useState(initial.user || '');

  const [bio, setBio] = useState(initial.bio || initial.description || '');

  const [phone, setPhone] = useState(initial.phone || '');

  const [ciudad, setCiudad] = useState(initial.ciudad || '');

  const [departamento, setDepartamento] = useState(initial.departamento || '');

  const [pais, setPais] = useState(initial.pais || 'Colombia');

  const [direccion, setDireccion] = useState(initial.direccion || '');

  const [documento, setDocumento] = useState(initial.documento || '');

  const [tipoDocumento, setTipoDocumento] = useState(initial.tipoDocumento || 'CC');

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [avatarHint, setAvatarHint] = useState<string | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {

    if (!open) return;

    setName(initial.name || '');

    setLastName(initial.lastName || '');

    setUsername(initial.user || '');

    setBio(initial.bio || initial.description || '');

    setPhone(initial.phone || '');

    setCiudad(initial.ciudad || '');

    setDepartamento(initial.departamento || '');

    setPais(initial.pais || 'Colombia');

    setDireccion(initial.direccion || '');

    setDocumento(initial.documento || '');

    setTipoDocumento(initial.tipoDocumento || 'CC');

    setAvatarPreview(null);

    setAvatarFile(null);

    setAvatarHint(null);

  }, [open, initial]);



  if (!open) return null;



  const handleAvatarFile = async (file: File) => {
    try {
      validateProfileImageFile(file);
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarHint(`${file.name} · ${formatFileSize(file.size)}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Imagen no válida', 'error');
    }
  };

  const handleSave = async () => {

    setSubmitting(true);

    try {

      await updateUserProfile({
        id: userId,
        email: initial.email,
        name: name.trim(),
        lastName: lastName.trim(),
        user: username.trim(),
        description: bio.trim(),
        phone: phone.trim(),
        ciudad: ciudad.trim(),
        departamento: departamento.trim(),
        pais: pais.trim(),
        direccion: direccion.trim(),
        documento: documento.trim(),
        tipoDocumento: tipoDocumento.trim(),
      });

      if (avatarFile) {
        await uploadProfileAvatar(userId, avatarFile);
        invalidateProfilePageCache(userId);
        invalidateCachedProfile(userId);
        window.dispatchEvent(new Event(PROFILE_PAGE_CACHE_INVALIDATED_EVENT));
      }

      const cityChanged = ciudad.trim() && ciudad.trim() !== (initial.ciudad || '').trim();
      if (cityChanged) {
        await resolveManualUserLocation([ciudad.trim(), departamento.trim(), pais.trim()].filter(Boolean).join(', '));
      }

      showToast('Perfil actualizado', 'success');

      onSaved();

      onClose();

    } catch (err) {

      showToast(err instanceof Error ? err.message : 'Error al guardar perfil', 'error');

    } finally {

      setSubmitting(false);

    }

  };



  return (

    <div className="de-sheet-overlay de-sheet-overlay--above-dock" onClick={onClose} role="presentation">

      <div className="de-sheet de-sheet--with-footer" onClick={(e) => e.stopPropagation()}>

        <header className="de-sheet__header">

          <h2>Editar perfil</h2>

          <button type="button" className="de-sheet__close" onClick={onClose}>×</button>

        </header>

        <div className="de-sheet__body de-form-stack">

          <section className="de-form-section">

            <h3>Identidad</h3>

            <label className="de-form-file">

              <span>Cambiar foto de perfil</span>

              <button type="button" className="de-access-btn de-access-btn--ghost" onClick={() => setAvatarPickerOpen(true)}>
                Elegir imagen
              </button>

            </label>

            {avatarPreview && <img src={avatarPreview} alt="Avatar" className="de-profile-edit-avatar" />}
            {avatarHint && <small className="de-profile-cover__hint">{avatarHint}</small>}

            <TextField label="Nombre" value={name} onChange={(e) => setName(e.target.value)} variant="bordered" />

            <TextField label="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} variant="bordered" />

            <TextField label="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} variant="bordered" />

            <TextField label="Correo" value={initial.email || ''} variant="bordered" disabled />

          </section>



          <section className="de-form-section">

            <h3>Contacto</h3>

            <TextField label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} variant="bordered" placeholder="+57 300 000 0000" />

            <TextField label="Bio / Descripción" value={bio} onChange={(e) => setBio(e.target.value)} variant="bordered" />

          </section>



          <section className="de-form-section">

            <h3>Ubicación</h3>

            <TextField
              label="Ubicación actual"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              variant="bordered"
              placeholder="Ej: Bogotá, Girardot, Medellín…"
            />

            <TextField label="Departamento" value={departamento} onChange={(e) => setDepartamento(e.target.value)} variant="bordered" />

            <TextField label="País" value={pais} onChange={(e) => setPais(e.target.value)} variant="bordered" />

            <TextField label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} variant="bordered" />

          </section>



          <section className="de-form-section">
            <h3>Documento</h3>
            <TextField label="Tipo de documento" value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} variant="bordered" placeholder="CC, CE, NIT..." />
            <TextField label="Número de documento" value={documento} onChange={(e) => setDocumento(e.target.value)} variant="bordered" />
          </section>

          <section className="de-form-section de-edit-profile-settings">
            <h3>Privacidad y cuenta</h3>
            <ProfileSettingsPanel
              userId={userId}
              plan={plan}
              isPublicProfile={isPublicProfile}
              onVisibilityChange={onVisibilityChange}
              onOpenBankData={() => {
                onClose();
                onOpenBankData?.();
              }}
            />
          </section>
        </div>

        <footer className="de-sheet__footer">

          <Button

            label={submitting ? 'Guardando...' : 'Guardar cambios'}

            tone="lovable"

            disabled={submitting}

            onClick={handleSave}

          />

        </footer>

      </div>

      <ProfileMediaPickerSheet
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        userId={userId}
        title="Cambiar foto de perfil"
        onFile={(file) => { void handleAvatarFile(file); }}
        onGallerySelect={(item) => {
          void setProfileAvatarFromGallery(userId, { imageId: item.imageId, key: item.key })
            .then((url) => {
              const busted = appendImageCacheBuster(url, Date.now()) || url;
              invalidateProfilePageCache(userId);
              invalidateCachedProfile(userId);
              window.dispatchEvent(new Event(PROFILE_PAGE_CACHE_INVALIDATED_EVENT));
              onSaved();
              showToast('Foto de perfil actualizada', 'success');
              return busted;
            })
            .catch((err) => showToast(err instanceof Error ? err.message : 'No se pudo usar la imagen', 'error'));
        }}
      />

    </div>

  );

};



export default EditProfileSheet;


