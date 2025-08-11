import React from 'react';
import { Sun, Sparkles, Moon, Check } from 'lucide-react';
import { usePhotoContext } from '../contexts/PhotoContext';
import { PRESETS } from '../utils/imageProcessing';
import { cn } from '../lib/utils';
import { Card } from './ui/card';

const presetIcons = {
  sunlit: Sun,
  crisp: Sparkles,
  evening: Moon
};

const presetDescriptions = {
  sunlit: 'Bright & warm',
  crisp: 'Sharp & clean',
  evening: 'Golden hour'
};

export const FilterSelector = () => {
  const { selectedPhotoId, photos, updatePhotoEdits } = usePhotoContext();
  
  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);
  
  if (!selectedPhoto) return null;

  const handlePresetSelect = (presetKey) => {
    updatePhotoEdits(selectedPhotoId, {
      preset: selectedPhoto.edits.preset === presetKey ? null : presetKey,
      autoAdjusted: false // Clear auto-adjust when applying preset
    });
  };

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
          Quick Presets
        </h3>
        {selectedPhoto.edits.preset && (
          <button
            onClick={() => updatePhotoEdits(selectedPhotoId, { preset: null })}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(PRESETS).map(([key, preset]) => {
          const Icon = presetIcons[key];
          const isActive = selectedPhoto.edits.preset === key;
          
          return (
            <button
              key={key}
              onClick={() => handlePresetSelect(key)}
              className={cn(
                "relative p-2 sm:p-3 rounded-lg border-2 transition-all",
                "flex flex-col items-center gap-1 sm:gap-2",
                isActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-900"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 sm:w-6 sm:h-6",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
              )} />
              
              <div className="text-center">
                <h4 className={cn(
                  "text-xs sm:text-sm font-medium",
                  isActive ? "text-blue-900 dark:text-blue-300" : "text-slate-900 dark:text-slate-100"
                )}>
                  {preset.name}
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {presetDescriptions[key]}
                </p>
              </div>
              
              {isActive && (
                <div className="absolute top-1 right-1 bg-blue-500 text-white p-0.5 rounded-full">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
