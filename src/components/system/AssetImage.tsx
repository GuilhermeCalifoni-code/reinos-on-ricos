import React, { ImgHTMLAttributes, useEffect, useRef, useState } from 'react';
import { campaignAssetService } from '../../services/storage/campaignAssetService';

interface AssetImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  fallbackSrc?: string;
}

// Supabase signed URLs currently last 1 hour. Refresh before expiration so
// an open VTT does not gradually lose portraits, maps or handout images.
const SIGNED_URL_REFRESH_MS = 50 * 60 * 1000;

export const AssetImage: React.FC<AssetImageProps> = ({ src, fallbackSrc, onError, ...props }) => {
  const isStorageAsset = campaignAssetService.isStorageRef(src);
  const [resolved, setResolved] = useState(
    isStorageAsset ? (fallbackSrc || '') : (src || fallbackSrc || '')
  );
  const [retry, setRetry] = useState(0);
  const retriedRef = useRef(false);

  useEffect(() => {
    retriedRef.current = false;
    setRetry(0);
  }, [src]);

  useEffect(() => {
    let active = true;

    if (!src || !isStorageAsset) {
      setResolved(src || fallbackSrc || '');
      return () => { active = false; };
    }

    if (retry > 0) setResolved(fallbackSrc || '');

    const refresh = async () => {
      try {
        const url = await campaignAssetService.resolveImageRef(src);
        if (active) setResolved(url || fallbackSrc || '');
      } catch {
        if (active) setResolved(fallbackSrc || '');
      }
    };

    void refresh();
    const refreshTimer = window.setInterval(() => { void refresh(); }, SIGNED_URL_REFRESH_MS);
    return () => { active = false; window.clearInterval(refreshTimer); };
  }, [src, fallbackSrc, isStorageAsset, retry]);

  if (!resolved) return null;

  return (
    <img
      {...props}
      src={resolved}
      onError={(event) => {
        // Broken/expired signed URLs get one fresh signature, then fallback.
        // No retry loop if the object is missing or access is denied.
        if (isStorageAsset && !retriedRef.current) {
          retriedRef.current = true;
          setRetry(value => value + 1);
          return;
        }
        if (fallbackSrc && event.currentTarget.getAttribute('src') !== fallbackSrc) {
          event.currentTarget.src = fallbackSrc;
        }
        onError?.(event);
      }}
    />
  );
};
