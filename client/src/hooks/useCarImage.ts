import { useState, useEffect } from 'react';

const UNSPLASH_ACCESS_KEY = 'wGjVHiHB8KF5uxQM44jhaLFu6nt0d4sgKy6mINceyZw'; // User provided key

interface UnsplashImage {
  url: string;
  photographer: string;
  photographerUrl: string;
}

export function useCarImage(query: string | null) {
  const [image, setImage] = useState<UnsplashImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    let isMounted = true;
    setIsLoading(true);

    // Create a simple cache key to avoid hitting rate limits too often during dev
    const cacheKey = `unsplash_car_${query}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
      try {
        setImage(JSON.parse(cached));
        setIsLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem(cacheKey);
      }
    }

    const fetchImage = async () => {
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            query
          )}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
        );

        if (!res.ok) throw new Error('Failed to fetch image');

        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
          const imgData = {
            url: data.results[0].urls.regular,
            photographer: data.results[0].user.name,
            photographerUrl: data.results[0].user.links.html,
          };
          
          if (isMounted) {
            setImage(imgData);
            sessionStorage.setItem(cacheKey, JSON.stringify(imgData));
          }
        } else {
            if(isMounted) setImage(null);
        }
      } catch (err) {
        if (isMounted) {
            // Fallback or just null
            setImage(null);
            console.error('Unsplash fetch error:', err);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [query]);

  return { image, isLoading };
}
