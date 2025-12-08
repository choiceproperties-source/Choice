import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface PhotoGalleryProps {
  images: string[];
  title: string;
}

export function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const mainImage = images[currentImageIndex];
  const minSwipeDistance = 50;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <span className="text-white text-lg font-semibold">
              {currentImageIndex + 1} / {images.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
              data-testid="button-close-fullscreen"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Image */}
          <div
            className="flex-1 flex items-center justify-center relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Previous Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 text-white hover:bg-white/20 h-12 w-12 z-10 transition-all"
              onClick={prevImage}
              data-testid="button-prev-fullscreen"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            {/* Image */}
            <img
              key={currentImageIndex}
              src={mainImage}
              alt={`${title} - Photo ${currentImageIndex + 1}`}
              loading="lazy"
              decoding="async"
              className="max-h-[calc(100vh-160px)] max-w-[90vw] object-contain select-none animate-in fade-in duration-300"
              draggable={false}
            />

            {/* Next Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 text-white hover:bg-white/20 h-12 w-12 z-10 transition-all"
              onClick={nextImage}
              data-testid="button-next-fullscreen"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 p-4 overflow-x-auto bg-black/50 border-t border-white/10 scrollbar-hide">
            {images.map((img, idx) => (
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
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
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
            className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden rounded-lg"
            onClick={() => setIsFullscreen(true)}
            data-testid="gallery-main-image"
          >
            <img
              src={images[0]}
              alt={`${title} - Main`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Maximize2 className="h-4 w-4" />
              {images.length} Photos
            </div>
          </div>

          {/* Thumbnail Grid - 2 columns */}
          {images.slice(1, 5).map((img, idx) => (
            <div
              key={idx + 1}
              className="relative group cursor-pointer overflow-hidden rounded-lg h-[120px]"
              onClick={() => {
                setCurrentImageIndex(idx + 1);
                setIsFullscreen(true);
              }}
              data-testid={`gallery-thumbnail-${idx + 1}`}
            >
              <img
                src={img}
                alt={`${title} - Photo ${idx + 2}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              {idx === 3 && images.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 group-hover:bg-black/70 transition-colors duration-300">
                  <span className="text-white font-bold text-lg">
                    +{images.length - 5}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative group rounded-lg overflow-hidden mb-4">
          <div
            className="relative h-80 bg-muted"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Image */}
            <img
              key={currentImageIndex}
              src={mainImage}
              alt={`${title} - Photo ${currentImageIndex + 1}`}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover animate-in fade-in duration-300"
            />

            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={prevImage}
                  data-testid="button-prev-mobile"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={nextImage}
                  data-testid="button-next-mobile"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Image Counter & Fullscreen */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
              <span className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-md text-sm font-semibold">
                {currentImageIndex + 1}/{images.length}
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
            {images.map((img, idx) => (
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
                <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
