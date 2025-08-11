import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wand2, RotateCcw, Copy, Layers, Sparkles } from 'lucide-react';
import { usePhotoContext } from '../contexts/PhotoContext';
import { applyImageEdits, analyzeImageForAutoAdjust } from '../utils/imageProcessing';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';

const adjustmentGroups = {
  light: [
    { key: 'exposure', label: 'Exposure', min: -100, max: 100, default: 0 },
    { key: 'highlights', label: 'Highlights', min: -100, max: 100, default: 0 },
    { key: 'shadows', label: 'Shadows', min: -100, max: 100, default: 0 },
    { key: 'brightness', label: 'Brightness', min: -100, max: 100, default: 0 },
    { key: 'contrast', label: 'Contrast', min: 0, max: 200, default: 100 },
  ],
  color: [
    { key: 'saturation', label: 'Saturation', min: 0, max: 200, default: 100 },
    { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, default: 0 },
    { key: 'warmth', label: 'Warmth', min: -100, max: 100, default: 0 },
    { key: 'tint', label: 'Tint', min: -100, max: 100, default: 0 },
  ],
  detail: [
    { key: 'sharpness', label: 'Sharpness', min: 0, max: 100, default: 0 },
    { key: 'vignette', label: 'Vignette', min: 0, max: 100, default: 0 },
  ]
};

export const EditPanelV2 = () => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('light');
  const [showOriginal, setShowOriginal] = useState(false);
  
  const { 
    selectedPhotoId, 
    photos, 
    updatePhotoEdits,
    applyEditsToPhotos,
    copiedEdits,
    setCopiedEdits
  } = usePhotoContext();
  
  const selectedPhoto = photos.find(p => p.id === selectedPhotoId);
  
  // Apply auto-adjustment
  const handleAutoAdjust = useCallback(() => {
    if (!selectedPhoto || !canvasRef.current || !imageRef.current) return;
    
    setIsProcessing(true);
    
    // Create temporary canvas for analysis
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    tempCanvas.width = imageRef.current.width;
    tempCanvas.height = imageRef.current.height;
    tempCtx.drawImage(imageRef.current, 0, 0);
    
    // Analyze and get adjustments
    const adjustments = analyzeImageForAutoAdjust(tempCanvas, tempCtx);
    
    // Apply adjustments
    updatePhotoEdits(selectedPhotoId, {
      ...adjustments,
      autoAdjusted: true,
      preset: null // Clear any preset when auto-adjusting
    });
    
    setTimeout(() => setIsProcessing(false), 100);
  }, [selectedPhoto, selectedPhotoId, updatePhotoEdits]);
  
  // Update canvas when photo or edits change
  useEffect(() => {
    if (!selectedPhoto || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    
    img.onload = () => {
      // Get the display size (CSS pixels)
      const container = canvas.parentElement;
      const maxDisplayWidth = container ? container.clientWidth : 800;
      const maxDisplayHeight = 600;
      
      // Calculate display dimensions maintaining aspect ratio
      let displayWidth = img.width;
      let displayHeight = img.height;
      const aspectRatio = img.width / img.height;
      
      if (displayWidth > maxDisplayWidth) {
        displayWidth = maxDisplayWidth;
        displayHeight = displayWidth / aspectRatio;
      }
      
      if (displayHeight > maxDisplayHeight) {
        displayHeight = maxDisplayHeight;
        displayWidth = displayHeight * aspectRatio;
      }
      
      // Set canvas dimensions
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Store reference to original image
      imageRef.current = img;
      
      // Apply edits or show original
      if (showOriginal) {
        // Show original image
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      } else {
        // Apply edits
        applyImageEdits(canvas, ctx, img, selectedPhoto.edits, selectedPhoto.edits.preset);
      }
    };
    
    img.src = selectedPhoto.original;
  }, [selectedPhoto, selectedPhoto?.edits, showOriginal]);

  if (!selectedPhoto) {
    return null;
  }

  const handleSliderChange = (key, value) => {
    // Don't show loading overlay for slider changes
    updatePhotoEdits(selectedPhotoId, {
      [key]: Array.isArray(value) ? value[0] : value
    });
  };

  const resetEdits = () => {
    const defaultEdits = {};
    Object.values(adjustmentGroups).flat().forEach(adj => {
      defaultEdits[adj.key] = adj.default;
    });
    
    updatePhotoEdits(selectedPhotoId, {
      ...defaultEdits,
      preset: null,
      autoAdjusted: false
    });
  };

  const handleCopyEdits = () => {
    setCopiedEdits({
      ...selectedPhoto.edits,
      sourcePhotoId: selectedPhotoId
    });
  };

  const handleApplyToAll = () => {
    const otherPhotos = photos
      .filter(p => p.id !== selectedPhotoId)
      .map(p => p.id);
    
    if (otherPhotos.length > 0) {
      applyEditsToPhotos(selectedPhotoId, otherPhotos);
    }
  };

  const handlePasteEdits = () => {
    if (copiedEdits && copiedEdits.sourcePhotoId !== selectedPhotoId) {
      const { sourcePhotoId, appliedTo, ...editsToApply } = copiedEdits;
      updatePhotoEdits(selectedPhotoId, editsToApply);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {/* Canvas Preview */}
      <Card className="order-2 lg:order-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base">Preview</CardTitle>
              <CardDescription className="text-xs truncate">{selectedPhoto.name}</CardDescription>
            </div>
            <button
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors select-none whitespace-nowrap"
            >
              <span className="hidden sm:inline">Hold to see original</span>
              <span className="sm:hidden">Original</span>
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg">
            <canvas 
              ref={canvasRef}
              className="rounded-lg shadow-sm max-w-full h-auto mx-auto block"
              style={{ imageRendering: 'high-quality' }}
            />
            
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}
            
            {selectedPhoto.edits.autoAdjusted && !showOriginal && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1 shadow-lg">
                <Sparkles className="w-3 h-3" />
                <span className="hidden sm:inline">Auto-enhanced</span>
                <span className="sm:hidden">Auto</span>
              </div>
            )}
            
            {showOriginal && (
              <div className="absolute top-2 left-2 bg-slate-800 text-white px-2 py-1 rounded-md text-xs shadow-lg">
                Original
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="order-1 lg:order-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm sm:text-base">Adjustments</CardTitle>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoAdjust}
                disabled={isProcessing}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 px-2 sm:px-3"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Auto
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetEdits}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 px-2 sm:px-3"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="light" className="text-xs sm:text-sm">Light</TabsTrigger>
              <TabsTrigger value="color" className="text-xs sm:text-sm">Color</TabsTrigger>
              <TabsTrigger value="detail" className="text-xs sm:text-sm">Detail</TabsTrigger>
            </TabsList>
            
            <TabsContent value="light" className="space-y-3 mt-3">
              {adjustmentGroups.light.map(adj => (
                <div key={adj.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-medium">{adj.label}</label>
                    <span className="text-xs sm:text-sm text-muted-foreground w-10 text-right tabular-nums">
                      {selectedPhoto.edits[adj.key] || adj.default}
                    </span>
                  </div>
                  <Slider
                    value={[selectedPhoto.edits[adj.key] || adj.default]}
                    onValueChange={(value) => handleSliderChange(adj.key, value)}
                    min={adj.min}
                    max={adj.max}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="color" className="space-y-3 mt-3">
              {adjustmentGroups.color.map(adj => (
                <div key={adj.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-medium">{adj.label}</label>
                    <span className="text-xs sm:text-sm text-muted-foreground w-10 text-right tabular-nums">
                      {selectedPhoto.edits[adj.key] || adj.default}
                    </span>
                  </div>
                  <Slider
                    value={[selectedPhoto.edits[adj.key] || adj.default]}
                    onValueChange={(value) => handleSliderChange(adj.key, value)}
                    min={adj.min}
                    max={adj.max}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="detail" className="space-y-3 mt-3">
              {adjustmentGroups.detail.map(adj => (
                <div key={adj.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-medium">{adj.label}</label>
                    <span className="text-xs sm:text-sm text-muted-foreground w-10 text-right tabular-nums">
                      {selectedPhoto.edits[adj.key] || adj.default}
                    </span>
                  </div>
                  <Slider
                    value={[selectedPhoto.edits[adj.key] || adj.default]}
                    onValueChange={(value) => handleSliderChange(adj.key, value)}
                    min={adj.min}
                    max={adj.max}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>

          {/* Edit Transfer Buttons */}
          <div className="border-t pt-4 mt-4 space-y-2">
            <h4 className="text-xs sm:text-sm font-medium mb-2">Batch Actions</h4>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyEdits}
              className="w-full gap-1.5 text-xs sm:text-sm h-8"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Edits
            </Button>
            
            {copiedEdits && copiedEdits.sourcePhotoId !== selectedPhotoId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePasteEdits}
                className="w-full gap-2"
              >
                <Layers className="w-4 h-4" />
                Paste Copied Edits
              </Button>
            )}
            
            <Button
              variant="default"
              size="sm"
              onClick={handleApplyToAll}
              className="w-full"
            >
              Apply to All Photos
            </Button>
            
            {selectedPhoto.edits.appliedTo?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Applied to {selectedPhoto.edits.appliedTo.length} other photo(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
