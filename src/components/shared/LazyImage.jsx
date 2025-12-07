import React, { useState, useEffect, useRef } from 'react';

export default function LazyImage({ 
    src, 
    alt, 
    className = '', 
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f1f5f9" width="400" height="300"/%3E%3C/svg%3E',
    ...props 
}) {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoaded, setIsLoaded] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const actualSrc = img.getAttribute('data-src');
                        
                        if (actualSrc && actualSrc !== imageSrc) {
                            // Preload the image
                            const loader = new Image();
                            loader.src = actualSrc;
                            loader.onload = () => {
                                setImageSrc(actualSrc);
                                setIsLoaded(true);
                            };
                            loader.onerror = () => {
                                console.error(`Failed to load image: ${actualSrc}`);
                                setIsLoaded(true); // Still mark as loaded to remove blur
                            };
                        }
                        
                        observer.unobserve(img);
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before image enters viewport
                threshold: 0.01
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [src]);

    return (
        <img
            ref={imgRef}
            src={imageSrc}
            data-src={src}
            alt={alt}
            className={`transition-all duration-300 ${!isLoaded ? 'blur-sm' : 'blur-0'} ${className}`}
            loading="lazy"
            {...props}
        />
    );
}