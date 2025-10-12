import React, { useEffect } from 'react';

const ImagePreviewModal = ({ isOpen, onClose, src, alt }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <figure
        className="max-h-full max-w-5xl"
        onClick={(event) => {
          // Prevent closing the modal when clicking inside the figure
          event.stopPropagation();
        }}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] w-auto rounded-3xl shadow-2xl"
          loading="lazy"
        />
        {alt && (
          <figcaption className="mt-3 text-center text-sm text-white/80">{alt}</figcaption>
        )}
      </figure>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-700 shadow hover:bg-white"
      >
        ×
      </button>
    </div>
  );
};

export default ImagePreviewModal;
