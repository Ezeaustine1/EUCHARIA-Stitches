import React, { useState } from 'react';
import { Scissors } from 'lucide-react';

interface ResilientImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackLabel?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  fallbackLabel,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#2C211D] via-[#1A1412] to-[#3B2C26] text-[#F5EFE6] p-6 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-full border border-[#C5A059]/50 flex items-center justify-center mb-3 text-[#C5A059] font-serif-display text-lg tracking-widest">
          ES
        </div>
        <Scissors className="w-4 h-4 text-[#C5A059]/70 mb-2" />
        <span className="font-serif-display text-sm tracking-wide text-[#F5EFE6]/90 max-w-[200px] line-clamp-2">
          {fallbackLabel || alt || 'EUCHARIA Stitches Couture'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
};
