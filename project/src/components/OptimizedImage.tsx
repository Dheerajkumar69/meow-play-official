import { useInView } from 'react-intersection-observer';
import { useEffect, useState, useCallback } from 'react';

interface ImageLoaderProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  placeholder?: string;
}

export const OptimizedImage: React.FC<ImageLoaderProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E'
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '50px 0px'
  });

  const generateSrcSet = useCallback(() => {
    const sizes = [200, 400, 800];
    return sizes
      .map(size => {
        const url = new URL(src);
        url.searchParams.set('width', size.toString());
        return `${url.toString()} ${size}w`;
      })
      .join(', ');
  }, [src]);

  useEffect(() => {
    if (inView) {
      const img = new Image();
      img.src = src;
      img.onload = () => setImageSrc(src);
    }
  }, [inView, src]);

  return (
    <div
      ref={ref}
      className={`overflow-hidden ${className}`}
      style={{ position: 'relative', width, height }}
    >
      {imageSrc === placeholder ? (
        <div className="animate-pulse bg-gray-200 absolute inset-0" />
      ) : null}
      <img
        src={imageSrc}
        srcSet={generateSrcSet()}
        sizes={`(max-width: ${width}px) 100vw, ${width}px`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageSrc === placeholder ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};
