import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Maximize2, ImageOff, Upload, Trash2, GripVertical } from "lucide-react";
import { getThumbnailUrl, getGalleryThumbUrl, getMainImageUrl, getFullscreenImageUrl } from "@/lib/imagekit";
import { getFallbackImageUrl } from "@/lib/gallery-placeholder";
import { useToast } from "@/hooks/use-toast";

interface PhotoGalleryProps {
  images: string[];
  title: string;
  propertyId?: string;
  canEdit?: boolean;
  onImagesChange?: (images: string[]) => void;
}

interface ImageState {
  [key: number]: 'loading' | 'loaded' | 'error';
}

export function PhotoGallery({ images, title, propertyId, canEdit = false, onImagesChange }: PhotoGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());
  const [imageStates, setImageStates] = useState<ImageState>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const validImages = images.filter(img => img && typeof img === 'string');
  const mainImage = validImages[currentImageIndex];
  const minSwipeDistance = 50;

  const handleDeleteImage = async (index: number) => {
    if (!propertyId || !canEdit) return;
    
    setIsDeleting(true);
    try {
      const newImages = validImages.filter((_, i) => i !== index);
      await fetch(`/api/properties/${propertyId}/photos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: newImages })
      });
      
      onImagesChange?.(newImages);
      if (currentImageIndex >= newImages.length) {
        setCurrentImageIndex(Math.max(0, newImages.length - 1));
      }
      toast({ description: 'Photo deleted successfully' });
    } catch (err) {
      toast({ description: 'Failed to delete photo', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle image error
  const handleImageError = (index: number) => {
    setImageStates(prev => ({
      ...prev,
      [index]: 'error'
    }));
  };

  const handleImageLoad = (index: number) => {
    setImageStates(prev => ({
      ...prev,
      [index]: 'loaded'
    }));
  };

  // Preload adjacent images for smooth navigation
  useEffect(() => {
    if (validImages.length === 0) return;

    const nextIndex = (currentImageIndex + 1) % validImages.length;
    const prevIndex = (currentImageIndex - 1 + validImages.length) % validImages.length;
    
    setPreloadedImages(new Set([currentImageIndex, nextIndex, prevIndex]));

    // Preload images in the background
    const preloadImage = (url: string) => {
      const img = new Image();
      img.onload = () => {
        setImageStates(prev => ({
          ...prev,
          [validImages.indexOf(url)]: 'loaded'
        }));
      };
      img.onerror = () => {
        setImageStates(prev => ({
          ...prev,
          [validImages.indexOf(url)]: 'error'
        }));
      };
      img.src = url;
    };

    preloadImage(getFullscreenImageUrl(validImages[nextIndex]));
    preloadImage(getFullscreenImageUrl(validImages[prevIndex]));
  }, [currentImageIndex, validImages]);

  const nextImage = () => {
    if (validImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
    }
  };

  const prevImage = () => {
    if (validImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    }
  };

  // Empty state
  if (validImages.length === 0) {
    return (
      <div className="w-full bg-background">
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
          <ImageOff className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">No images available</p>
        </div>
      </div>
    );
  }

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  return (
    <>
      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col" style={{ touchAction: 'none' }}>
          {/* Sticky Header - Optimized for Mobile */}
          <div className="sticky top-0 flex justify-between items-center p-2 md:p-4 border-b border-white/10 bg-black/80 backdrop-blur-sm z-20">
            <span className="text-white text-xs md:text-lg font-semibold select-none">
              {currentImageIndex + 1} / {validImages.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9 flex-shrink-0 md:size-9"
              onClick={() => setIsFullscreen(false)}
              data-testid="button-close-fullscreen"
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Image - Full swipe area */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden w-full"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
            data-testid="gallery-swipe-area"
          >
            {/* Previous Button - Larger on Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-14 w-14 md:h-12 md:w-12 z-10 transition-all hidden md:flex"
              onClick={prevImage}
              data-testid="button-prev-fullscreen"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            {/* Image - Prevent zoom */}
            <img
              key={currentImageIndex}
              src={imageStates[currentImageIndex] === 'error' ? getFallbackImageUrl() : getFullscreenImageUrl(mainImage)}
              srcSet={imageStates[currentImageIndex] === 'error' ? undefined : `${getFullscreenImageUrl(mainImage)} 1920w`}
              alt={`${title} - Photo ${currentImageIndex + 1}`}
              loading="eager"
              decoding="async"
              onLoad={() => handleImageLoad(currentImageIndex)}
              onError={() => handleImageError(currentImageIndex)}
              onDoubleClick={(e) => e.preventDefault()}
              className="max-h-[calc(100vh-80px)] max-w-[95vw] md:max-w-[90vw] object-contain select-none animate-in fade-in duration-300"
              style={{ WebkitUserSelect: 'none', touchAction: 'manipulation' }}
              draggable={false}
            />

            {/* Action Buttons for Editors */}
            {canEdit && (
              <div className="absolute top-12 right-2 md:top-16 md:right-4 flex gap-2 z-20">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-red-500/80 hover:bg-red-600 text-white h-9 w-9 md:h-10 md:w-10"
                  onClick={() => handleDeleteImage(currentImageIndex)}
                  disabled={isDeleting}
                  data-testid="button-delete-photo"
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            )}

            {/* Next Button - Larger on Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-14 w-14 md:h-12 md:w-12 z-10 transition-all hidden md:flex"
              onClick={nextImage}
              data-testid="button-next-fullscreen"
              aria-label="Next image"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 p-4 overflow-x-auto bg-black/50 border-t border-white/10 scrollbar-hide">
            {validImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 transition-all duration-200 rounded-md overflow-hidden ${
                  idx === currentImageIndex
                    ? "ring-2 ring-white scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
                data-testid={`thumbnail-fullscreen-${idx}`}
              >
                <img
                  src={imageStates[idx] === 'error' ? getFallbackImageUrl() : getThumbnailUrl(img)}
                  alt={`Thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  onError={() => handleImageError(idx)}
                  className="w-20 h-16 object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Gallery */}
      <div className="w-full bg-background">
        {/* Desktop Grid Layout */}
        <div className="hidden md:grid grid-cols-4 gap-3 rounded-lg overflow-hidden mb-4">
          {/* Main Large Image - 2 columns */}
          <div
            className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden rounded-lg bg-muted"
            onClick={() => setIsFullscreen(true)}
            data-testid="gallery-main-image"
          >
            <img
              src={imageStates[0] === 'error' ? getFallbackImageUrl() : getGalleryThumbUrl(validImages[0])}
              alt={`${title} - Main`}
              loading="lazy"
              decoding="async"
              onError={() => handleImageError(0)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(0);
                }}
                disabled={isDeleting}
                data-testid="button-delete-main-photo"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Maximize2 className="h-4 w-4" />
              {validImages.length} Photos
            </div>
          </div>

          {/* Thumbnail Grid - 2 columns */}
          {validImages.slice(1, 5).map((img, idx) => (
            <div
              key={idx + 1}
              className="relative group cursor-pointer overflow-hidden rounded-lg h-[120px] bg-muted"
              onClick={() => {
                setCurrentImageIndex(idx + 1);
                setIsFullscreen(true);
              }}
              data-testid={`gallery-thumbnail-${idx + 1}`}
            >
              <img
                src={imageStates[idx + 1] === 'error' ? getFallbackImageUrl() : getGalleryThumbUrl(img)}
                alt={`${title} - Photo ${idx + 2}`}
                loading="lazy"
                decoding="async"
                onError={() => handleImageError(idx + 1)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(idx + 1);
                  }}
                  disabled={isDeleting}
                  data-testid={`button-delete-photo-${idx + 1}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
              {idx === 3 && validImages.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/70 transition-colors duration-300">
                  <span className="text-white font-bold text-lg">
                    +{validImages.length - 5}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Carousel - Optimized for one-hand use */}
        <div className="md:hidden relative group rounded-lg overflow-hidden mb-4">
          <div
            className="relative h-96 bg-muted w-full"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ touchAction: 'manipulation' }}
            data-testid="mobile-carousel-swipe"
          >
            {/* Image - Prevent zoom */}
            <img
              key={currentImageIndex}
              src={imageStates[currentImageIndex] === 'error' ? getFallbackImageUrl() : getMainImageUrl(mainImage)}
              alt={`${title} - Photo ${currentImageIndex + 1}`}
              loading="eager"
              decoding="async"
              onLoad={() => handleImageLoad(currentImageIndex)}
              onError={() => handleImageError(currentImageIndex)}
              onDoubleClick={(e) => e.preventDefault()}
              className="w-full h-full object-cover animate-in fade-in duration-300"
              style={{ WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
              draggable={false}
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Navigation Buttons - Larger touch targets */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={prevImage}
                  data-testid="button-prev-mobile"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={nextImage}
                  data-testid="button-next-mobile"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image Counter & Fullscreen */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
              <span className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-semibold">
                {currentImageIndex + 1}/{validImages.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/70 hover:bg-black/90 text-white"
                onClick={() => setIsFullscreen(true)}
                data-testid="button-fullscreen-mobile"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Thumbnail Indicators */}
          <div className="flex gap-1 p-3 bg-muted/50 overflow-x-auto scrollbar-hide">
            {validImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 h-12 w-12 rounded transition-all duration-200 overflow-hidden ${
                  idx === currentImageIndex
                    ? "ring-2 ring-primary"
                    : "opacity-50 hover:opacity-75"
                }`}
                data-testid={`mobile-thumbnail-${idx}`}
              >
                <img 
                  src={imageStates[idx] === 'error' ? getFallbackImageUrl() : getThumbnailUrl(img)} 
                  alt={`Thumbnail ${idx + 1}`} 
                  loading="lazy" 
                  decoding="async"
                  onError={() => handleImageError(idx)}
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
