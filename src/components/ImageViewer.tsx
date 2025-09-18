import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImagePair {
  before: string;
  after: string;
  title?: string;
  description?: string;
}

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImagePair[];
  initialImageIndex: number;
  initialType: 'before' | 'after';
}

const ImageViewer = ({ isOpen, onClose, images, initialImageIndex, initialType }: ImageViewerProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [currentType, setCurrentType] = useState<'before' | 'after'>(initialType);

  const currentImage = images[currentImageIndex];
  const currentSrc = currentType === 'before' ? currentImage?.before : currentImage?.after;

  const handlePrevious = () => {
    if (currentType === 'after') {
      setCurrentType('before');
    } else {
      if (currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
        setCurrentType('after');
      }
    }
  };

  const handleNext = () => {
    if (currentType === 'before') {
      setCurrentType('after');
    } else {
      if (currentImageIndex < images.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
        setCurrentType('before');
      }
    }
  };

  const canGoPrevious = currentType === 'after' || currentImageIndex > 0;
  const canGoNext = currentType === 'before' || currentImageIndex < images.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
        <div className="relative flex items-center justify-center h-[95vh]">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Previous button */}
          {canGoPrevious && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-10 text-white hover:bg-white/20"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {/* Image */}
          <div className="flex flex-col items-center justify-center max-w-full max-h-full p-8">
            <div className="text-center mb-4">
              <h3 className={`text-2xl font-bold ${currentType === 'before' ? 'text-red-400' : 'text-green-400'}`}>
                {currentType === 'before' ? 'AVANT' : 'APRÈS'}
              </h3>
              {currentImage?.title && (
                <p className="text-white/80 text-lg mt-2">{currentImage.title}</p>
              )}
            </div>
            
            <img
              src={currentSrc}
              alt={`${currentType === 'before' ? 'Photo originale' : 'Photo retouchée'}${currentImage?.title ? ` - ${currentImage.title}` : ''}`}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            
            {currentImage?.description && currentType === 'after' && (
              <p className="text-white/70 text-center mt-4 max-w-2xl">{currentImage.description}</p>
            )}
          </div>

          {/* Next button */}
          {canGoNext && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-10 text-white hover:bg-white/20"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Navigation indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/50 px-6 py-3 rounded-full">
            <span className="text-white text-sm">
              Image {currentImageIndex + 1} / {images.length}
            </span>
            <span className="text-white/60">•</span>
            <span className="text-white text-sm">
              {currentType === 'before' ? 'Avant' : 'Après'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewer;