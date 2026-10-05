import React, { ImgHTMLAttributes, useEffect, useState } from 'react';
import { campaignAssetService } from '../../services/storage/campaignAssetService';

interface AssetImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  fallbackSrc?: string;
}

export const AssetImage: React.FC<AssetImageProps> = ({ src, fallbackSrc, onError, ...props }) => {
  const [resolved, setResolved] = useState(src || fallbackSrc || '');

  useEffect(() => {
    let active = true;
    if (!src) {
      setResolved(fallbackSrc || '');
      return () => { active = false; };
    }

    if (!campaignAssetService.isStorageRef(src)) {
      setResolved(src);
      return () => { active = false; };
    }

    setResolved(fallbackSrc || '');
    void campaignAssetService.resolveImageRef(src)
      .then(url => { if (active) setResolved(url || fallbackSrc || ''); })
      .catch(() => { if (active) setResolved(fallbackSrc || ''); });

    return () => { active = false; };
  }, [fallbackSrc, src]);

  if (!resolved) return null;

  return (
    <img
      {...props}
      src={resolved}
      onError={(event) => {
        if (fallbackSrc && event.currentTarget.src !== fallbackSrc) {
          event.currentTarget.src = fallbackSrc;
        }
        onError?.(event);
      }}
    />
  );
};
