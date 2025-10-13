import React, { useMemo } from 'react';

const SIZE_CLASSES = {
  xs: { container: 'h-6 w-6 text-xs', image: 'h-6 w-6', text: 'text-[0.65rem]' },
  sm: { container: 'h-8 w-8 text-sm', image: 'h-8 w-8', text: 'text-sm' },
  md: { container: 'h-10 w-10 text-base', image: 'h-10 w-10', text: 'text-base' },
  lg: { container: 'h-14 w-14 text-xl', image: 'h-14 w-14', text: 'text-xl' },
  xl: { container: 'h-20 w-20 text-2xl', image: 'h-20 w-20', text: 'text-2xl' },
};

const FALLBACK_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-lime-500',
  'bg-purple-500',
  'bg-orange-500',
];

const getInitials = (name) => {
  if (!name || typeof name !== 'string') {
    return '?';
  }

  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    return name.slice(0, 1).toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar = ({
  src,
  name,
  size = 'md',
  alt = '',
  className = '',
  showInitials = true,
}) => {
  const sizeConfig = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const fallback = useMemo(() => {
    const initials = getInitials(name);
    const colorIndex = name
      ? Math.abs(
          Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0)
        ) % FALLBACK_COLORS.length
      : 0;

    return {
      initials,
      colorClass: FALLBACK_COLORS[colorIndex],
    };
  }, [name]);

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`inline-block rounded-full object-cover shadow-sm ${sizeConfig.image} ${className}`.trim()}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold uppercase text-white shadow-sm ${sizeConfig.container} ${fallback.colorClass} ${className}`.trim()}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    >
      {showInitials ? fallback.initials : null}
    </span>
  );
};

export default Avatar;
