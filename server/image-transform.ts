// ImageKit CDN URL transformation utilities for optimized image delivery

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  blur?: number;
}

export interface OptimizedImageURLs {
  original: string;
  thumbnail: string;
  gallery: string;
}

/**
 * Generates an ImageKit URL with transformations
 * Base format: https://ik.imagekit.io/{urlEndpoint}/{path}?tr=transformation
 */
export function generateImageKitURL(
  imageKitFileId: string,
  urlEndpoint: string,
  options?: ImageTransformOptions
): string {
  const baseURL = `${urlEndpoint}/${imageKitFileId}`;
  
  if (!options || Object.keys(options).length === 0) {
    return baseURL;
  }

  const transformations: string[] = [];

  if (options.width) transformations.push(`w-${options.width}`);
  if (options.height) transformations.push(`h-${options.height}`);
  if (options.quality) transformations.push(`q-${options.quality}`);
  if (options.format) transformations.push(`f-${options.format}`);
  if (options.blur) transformations.push(`bl-${options.blur}`);

  const tr = transformations.join(',');
  return `${baseURL}?tr=${tr}`;
}

/**
 * Generates a set of optimized image URLs for different use cases
 */
export function generateOptimizedImageURLs(
  imageKitFileId: string,
  urlEndpoint: string
): OptimizedImageURLs {
  return {
    // Original image with high quality for detail viewing
    original: generateImageKitURL(imageKitFileId, urlEndpoint, {
      quality: 90,
      format: 'auto',
    }),
    // Small thumbnail for listings (300x200, optimized quality)
    thumbnail: generateImageKitURL(imageKitFileId, urlEndpoint, {
      width: 300,
      height: 200,
      quality: 75,
      format: 'auto',
    }),
    // Medium gallery image (800x600, good quality)
    gallery: generateImageKitURL(imageKitFileId, urlEndpoint, {
      width: 800,
      height: 600,
      quality: 85,
      format: 'auto',
    }),
  };
}

/**
 * Get ImageKit URL endpoint from environment
 */
export function getImageKitURLEndpoint(): string {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) {
    throw new Error('IMAGEKIT_URL_ENDPOINT is not configured');
  }
  // Ensure endpoint doesn't have trailing slash
  return endpoint.replace(/\/$/, '');
}
