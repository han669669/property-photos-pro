import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { Download, Package, Image, X, FileDown, FolderDown } from 'lucide-react';
import { usePhotoContext } from '../contexts/PhotoContext';
import { processImageForExport, generateFilename } from '../utils/imageProcessing';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

export const ExportButton = () => {
  const { photos } = usePhotoContext();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [propertyAddress, setPropertyAddress] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptions]);

  const handleExportAll = async () => {
    if (photos.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const zip = new JSZip();
      const processedPhotos = [];
      
      // Process each photo
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const progress = Math.round(((i + 1) / photos.length) * 100);
        setExportProgress(progress);
        
        // Process the image with edits
        const blob = await processImageForExport(photo);
        const filename = generateFilename(photo.name, i, propertyAddress || null);
        
        // Add to zip
        zip.file(filename, blob);
        processedPhotos.push({ blob, filename });
      }
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${propertyAddress || 'property-photos'}_edited.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export photos. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setShowOptions(false);
    }
  };

  const handleExportSingle = async (photoIndex) => {
    const photo = photos[photoIndex];
    if (!photo) return;
    
    setIsExporting(true);
    
    try {
      const blob = await processImageForExport(photo);
      const filename = generateFilename(photo.name, photoIndex, propertyAddress || null);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export photo. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
        size="sm"
        className={cn(
          "gap-1.5 sm:gap-2 h-8 sm:h-9 px-3 sm:px-4",
          "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          "text-white shadow-lg shadow-blue-500/25",
          "transition-all duration-200",
          isExporting && "animate-pulse"
        )}
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
            <span className="hidden sm:inline">{exportProgress}%</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </>
        )}
      </Button>

      {showOptions && !isExporting && (
        <div className="absolute top-full mt-2 right-0 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Export Options</h3>
            <button
              onClick={() => setShowOptions(false)}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Property Address Input */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Property Address (optional)
              </label>
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="e.g., 123 Main Street"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-100 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Used for file naming (123-Main-Street_01.jpg)
              </p>
            </div>

            {/* Export Actions */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handleExportAll}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                size="sm"
              >
                <FolderDown className="w-4 h-4" />
                Download All ({photos.length} photos)
              </Button>
              
              {photos.length > 1 && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">or download individual</span>
                    </div>
                  </div>
                  
                  <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => handleExportSingle(index)}
                        className="w-full px-2.5 py-1.5 text-left text-xs bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md flex items-center gap-2 transition-colors group"
                      >
                        <FileDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        <span className="truncate flex-1">{photo.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Info Box */}
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                <span className="font-semibold">MLS Ready:</span> Photos resized to 1920px max, optimized for web
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
