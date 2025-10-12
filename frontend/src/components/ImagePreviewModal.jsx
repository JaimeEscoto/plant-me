import React, { useEffect } from 'react';

const ImagePreviewModal = ({
  isOpen,
  onClose,
  src,
  alt,
  likes = { total: 0, likedByMe: false },
  likeActionLabel,
  likeCountLabel,
  onToggleLike,
  isLiking = false,
}) => {
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

  const liked = Boolean(likes?.likedByMe);
  const likeButtonClasses = liked
    ? 'border-transparent bg-emerald-500 text-white hover:bg-emerald-600'
    : 'border-white/70 bg-white/90 text-slate-700 hover:bg-white';
  const likeBadgeClasses = liked
    ? 'bg-white/30 text-white'
    : 'bg-slate-200 text-slate-700';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <div
        className="max-h-full max-w-5xl"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <figure className="max-h-full">
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

        {(onToggleLike || likeCountLabel) && (
          <div className="mt-4 flex flex-col items-center gap-2">
            {onToggleLike && (
              <button
                type="button"
                onClick={onToggleLike}
                disabled={isLiking}
                className={`flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-semibold shadow-lg focus:outline-none focus:ring-2 focus:ring-white/80 ${
                  likeButtonClasses
                } disabled:cursor-not-allowed disabled:opacity-70`}
                aria-label={likeActionLabel}
                title={likeActionLabel}
              >
                <span aria-hidden="true" className="text-lg">
                  {liked ? '❤️' : '🤍'}
                </span>
                <span>{likeActionLabel}</span>
                <span
                  aria-hidden="true"
                  className={`inline-flex min-w-[1.75rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${likeBadgeClasses}`}
                >
                  {likes?.total ?? 0}
                </span>
              </button>
            )}
            {likeCountLabel && (
              <p className="text-center text-xs text-white/80">{likeCountLabel}</p>
            )}
          </div>
        )}
      </div>
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
