import React, { useRef, useState } from 'react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ProfilePhotoManager = () => {
  const fileInputRef = useRef(null);
  const { user, updateProfilePhoto } = useAuth();
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState({ type: null, message: null });
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  if (!user) {
    return null;
  }

  const resetFeedback = () => setFeedback({ type: null, message: null });

  const handleFileChange = async (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    resetFeedback();

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', message: t('profilePhotoInvalidType') });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setFeedback({
        type: 'error',
        message: t('profilePhotoInvalidSize', { limit: MAX_IMAGE_SIZE_MB }),
      });
      event.target.value = '';
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result;
        await updateProfilePhoto(result);
        setFeedback({ type: 'success', message: t('profilePhotoUpdateSuccess') });
      } catch (err) {
        const errorMessage = err?.response?.data?.error || t('profilePhotoUpdateError');
        setFeedback({ type: 'error', message: errorMessage });
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setFeedback({ type: 'error', message: t('profilePhotoUpdateError') });
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    resetFeedback();
    setRemoving(true);
    try {
      await updateProfilePhoto(null);
      setFeedback({ type: 'success', message: t('profilePhotoRemoved') });
    } catch (err) {
      const errorMessage = err?.response?.data?.error || t('profilePhotoUpdateError');
      setFeedback({ type: 'error', message: errorMessage });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-full bg-slate-100/70 px-3 py-2">
      <Avatar
        src={user.foto_perfil}
        name={user.nombre_usuario}
        size="lg"
        alt={t('profileAvatarAlt', { name: user.nombre_usuario })}
      />
      <div className="flex min-w-[10rem] flex-col">
        <p className="text-sm font-semibold text-gardenSoil">{user.nombre_usuario}</p>
        {feedback.message && (
          <p
            className={`mt-0.5 text-xs ${
              feedback.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {feedback.message}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || removing}
            className="rounded-full border border-gardenGreen px-3 py-1 text-xs font-semibold text-gardenGreen transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? t('profilePhotoUploading') : t('profilePhotoChange')}
          </button>
          {user.foto_perfil && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={uploading || removing}
              className="rounded-full border border-rose-500 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removing ? t('profilePhotoRemoving') : t('profilePhotoRemove')}
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePhotoManager;
