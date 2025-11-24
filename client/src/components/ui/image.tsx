import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string; // URL to use if main src fails
  blurDataURL?: string; // Base64 placeholder
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  objectFit?: 'contain' | 'cover' | 'fill';
}

export function Image({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder-image.jpg', // You might want to create a generic placeholder
  aspectRatio = 'auto',
  objectFit = 'cover',
  loading = 'lazy',
  ...props
}: ImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
    setError(false);
    setIsLoading(true);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    if (!error && currentSrc !== fallbackSrc) {
       setError(true);
       setCurrentSrc(fallbackSrc);
       setIsLoading(false); // Stop loading state on error fallback
    }
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: 'aspect-auto',
  };

  const objectFitClasses = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
  };

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", aspectRatioClasses[aspectRatio], className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40 animate-pulse">
           <Icon icon="mdi:image-outline" className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "h-full w-full transition-opacity duration-500",
          objectFitClasses[objectFit],
          isLoading ? "opacity-0 scale-105" : "opacity-100 scale-100"
        )}
        {...props}
      />
    </div>
  );
}

