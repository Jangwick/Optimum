import { useEffect, useState } from 'react';
import { getDownloadToken } from '../services/download-token.service.js';

export function useDownloadUrl(resource: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!resource) {
      setUrl(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setUrl(null);

    getDownloadToken(resource)
      .then((token) => {
        if (!cancelled) setUrl(`${resource}?dt=${encodeURIComponent(token)}`);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resource]);

  return { url, loading };
}
