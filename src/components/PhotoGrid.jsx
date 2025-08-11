import React, { useState } from 'react';
import { Check, X, Sparkles, Layers, Edit3 } from 'lucide-react';
import { usePhotoContext } from '../contexts/PhotoContext';
import { cn } from '../lib/utils';

export const PhotoGrid = () => {
  const { 
    photos, 
    selectedPhotoId, 
    setSelectedPhotoId,
    removePhoto 
  } = usePhotoContext();
  
  const [hoveredPhotoId, setHoveredPhotoId] = useState(null);

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
          {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'} Ready
        </h3>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
          Click to edit
        </p>
      </div>
      
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1.5 sm:gap-2">
        {photos.map((photo) => {
          const isSelected = selectedPhotoId === photo.id;
          const isHovered = hoveredPhotoId === photo.id;
          const hasAutoAdjust = photo.edits?.autoAdjusted;
          const hasPreset = photo.edits?.preset;
          const hasManualEdits = photo.edits && (
            photo.edits.brightness !== 0 || 
            photo.edits.contrast !== 100 || 
            photo.edits.saturation !== 100 ||
            photo.edits.exposure !== 0 ||
            photo.edits.highlights !== 0 ||
            photo.edits.shadows !== 0
          );
          const hasCopiedEdits = photo.edits?.appliedTo?.length > 0;
          const hasAnyEdits = hasAutoAdjust || hasPreset || hasManualEdits || hasCopiedEdits;
          
          return (
            <div
              key={photo.id}
              className={cn(
                "relative group cursor-pointer rounded-md overflow-hidden border-2 transition-all aspect-square",
                isSelected 
                  ? "border-blue-500 ring-2 ring-blue-500/30 shadow-md scale-[1.03]" 
                  : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm"
              )}
              onClick={() => setSelectedPhotoId(photo.id)}
              onMouseEnter={() => setHoveredPhotoId(photo.id)}
              onMouseLeave={() => setHoveredPhotoId(null)}
            >
              {/* Image */}
              <img
                src={photo.thumbnail || photo.original}
                alt={photo.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Selection overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
              )}

              {/* Top indicators */}
              <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-1">
                {/* Selected indicator */}
                {isSelected && (
                  <div className="bg-blue-500 text-white p-0.5 rounded-full shadow-sm">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </div>
                )}
                
                {/* Edit indicators - only show when not hovered */}
                {!isHovered && hasAnyEdits && (
                  <div className={cn(
                    "flex gap-0.5",
                    isSelected && "ml-auto"
                  )}>
                    {hasAutoAdjust && (
                      <div className="bg-blue-600/90 text-white p-0.5 rounded shadow-sm" title="Auto-enhanced">
                        <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                    )}
                    {(hasManualEdits || hasPreset) && !hasAutoAdjust && (
                      <div className="bg-purple-600/90 text-white p-0.5 rounded shadow-sm" title="Edited">
                        <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                    )}
                    {hasCopiedEdits && (
                      <div className="bg-green-600/90 text-white p-0.5 rounded shadow-sm" title={`Applied to ${photo.edits.appliedTo.length}`}>
                        <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                    )}
                  </div>
                )}

                {/* Remove button - only on hover */}
                {isHovered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(photo.id);
                    }}
                    className={cn(
                      "bg-red-500/90 hover:bg-red-600 text-white p-0.5 rounded-full transition-all shadow-sm",
                      "opacity-0 group-hover:opacity-100",
                      isSelected && "ml-auto"
                    )}
                    title="Remove"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                )}
              </div>

              {/* Photo name - bottom gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 sm:p-1.5">
                <p className="text-white text-[9px] sm:text-[10px] font-medium truncate">
                  {photo.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
