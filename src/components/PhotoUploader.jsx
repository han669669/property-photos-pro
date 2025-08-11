import React, { useCallback, useState } from 'react';
import { Upload, Images, Sparkles, Plus, FileImage } from 'lucide-react';
import { usePhotoContext } from '../contexts/PhotoContext';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

export const PhotoUploader = () => {
  const { addPhotos, photos } = usePhotoContext();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const hasPhotos = photos.length > 0;

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFiles = (files) => {
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} is not an image`);
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 20MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      setTimeout(() => setError(null), 5000);
    }

    return validFiles;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      addPhotos(validFiles);
    }
  }, [addPhotos]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const validFiles = validateFiles(files);
    
    if (validFiles.length > 0) {
      addPhotos(validFiles);
    }
  }, [addPhotos]);

  const handleLoadSamplePhotos = async () => {
    setIsLoadingSamples(true);
    setError(null);
    
    try {
      const samplePhotos = [
        { url: '/511225370_18029354072677938_8520994366842291032_n.jpg', name: 'Living Room' },
        { url: '/513246862_18029354081677938_4443090111104276508_n.jpg', name: 'Kitchen' },
        { url: '/mcx9Mg.jpg', name: 'Bedroom' },
        { url: '/wEAptmsUsg.jpg', name: 'Bathroom' },
        { url: '/Yv8LRpqkg.jpg', name: 'Exterior' }
      ];
      
      const loadedFiles = [];
      
      for (const sample of samplePhotos) {
        const response = await fetch(sample.url);
        const blob = await response.blob();
        const file = new File([blob], `${sample.name}.jpg`, { type: 'image/jpeg' });
        loadedFiles.push(file);
      }
      
      addPhotos(loadedFiles);
    } catch (err) {
      setError('Failed to load samples');
      console.error('Error loading sample photos:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  // Compact view when photos exist
  if (hasPhotos) {
    return (
      <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col sm:flex-row gap-3 p-3 sm:p-4 rounded-lg border shadow-sm transition-all",
          "bg-white dark:bg-slate-900",
          isDragging 
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" 
            : "border-slate-200 dark:border-slate-800"
        )}
      >
        <div className="flex-1 flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <FileImage className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} ready to edit
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isDragging ? "Drop files here to add" : "Select thumbnails below to edit • Drag files here to add more"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <label htmlFor="photo-upload-additional">
            <input
              id="photo-upload-additional"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="sr-only"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('photo-upload-additional').click();
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add More
            </Button>
          </label>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="absolute bottom-2 left-2 right-2 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Full upload interface when no photos
  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-all cursor-pointer",
        "bg-gradient-to-br from-slate-50/50 to-blue-50/30 dark:from-slate-900/50 dark:to-blue-900/20",
        isDragging 
          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 scale-[1.02]" 
          : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600"
      )}
    >
      {/* Hidden file input */}
      <label htmlFor="photo-upload" className="absolute inset-0 cursor-pointer">
        <input
          id="photo-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>
      
      {/* Content */}
      <div className="relative z-10 pointer-events-none">
        <div className="flex justify-center mb-4">
          <div className={cn(
            "p-3 rounded-full transition-all",
            isDragging 
              ? "bg-blue-100 dark:bg-blue-900/50 scale-110" 
              : "bg-slate-100 dark:bg-slate-800"
          )}>
            <Upload className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 transition-colors",
              isDragging ? "text-blue-600" : "text-slate-600 dark:text-slate-400"
            )} />
          </div>
        </div>
        
        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
          {isDragging ? "Drop your photos here" : "Upload Property Photos"}
        </h3>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Drag & drop or click to browse • JPG, PNG, WebP
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pointer-events-auto">
          <Button 
            size="default" 
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('photo-upload').click();
            }}
          >
            <Upload className="w-4 h-4" />
            Browse Files
          </Button>
          
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleLoadSamplePhotos();
            }}
            disabled={isLoadingSamples}
            className="gap-2"
          >
            {isLoadingSamples ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Try Samples
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-6">
          💡 Pro tip: Select multiple photos at once for batch editing
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};
