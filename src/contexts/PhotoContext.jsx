import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const PhotoContext = createContext();

export const usePhotoContext = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotoContext must be used within a PhotoProvider');
  }
  return context;
};

export const PhotoProvider = ({ children }) => {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [projects, setProjects] = useLocalStorage('projects', {});
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [copiedEdits, setCopiedEdits] = useState(null);

  // Clean up old sessions (older than 7 days)
  useEffect(() => {
    const cleanupOldSessions = () => {
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const updatedProjects = { ...projects };
      
      Object.keys(updatedProjects).forEach(key => {
        const sessionTime = parseInt(key.split('-')[1]);
        if (sessionTime < sevenDaysAgo) {
          delete updatedProjects[key];
        }
      });
      
      setProjects(updatedProjects);
    };

    cleanupOldSessions();
  }, []);

  // Save current session to localStorage
  useEffect(() => {
    if (photos.length > 0) {
      setProjects(prev => ({
        ...prev,
        [sessionId]: { photos }
      }));
    }
  }, [photos, sessionId]);

  const addPhotos = (newPhotos) => {
    const processedPhotos = newPhotos.map((file, index) => ({
      id: `img-${Date.now()}-${index}`,
      file,
      original: URL.createObjectURL(file),
      name: file.name,
      edits: {
        preset: null,
        autoAdjusted: false,
        exposure: 0,
        highlights: 0,
        shadows: 0,
        contrast: 100,
        brightness: 0,
        saturation: 100,
        vibrance: 0,
        warmth: 0,
        tint: 0,
        sharpness: 0,
        vignette: 0,
        appliedTo: []
      }
    }));
    
    setPhotos(prev => [...prev, ...processedPhotos]);
    
    // Select first photo if none selected
    if (!selectedPhotoId && processedPhotos.length > 0) {
      setSelectedPhotoId(processedPhotos[0].id);
    }
  };

  const updatePhotoEdits = (photoId, edits) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, edits: { ...photo.edits, ...edits } }
        : photo
    ));
  };

  const applyEditsToPhotos = (sourcePhotoId, targetPhotoIds) => {
    const sourcePhoto = photos.find(p => p.id === sourcePhotoId);
    if (!sourcePhoto) return;

    const editsToApply = { ...sourcePhoto.edits };
    editsToApply.appliedTo = targetPhotoIds;

    setPhotos(prev => prev.map(photo => {
      if (targetPhotoIds.includes(photo.id)) {
        return {
          ...photo,
          edits: {
            ...editsToApply,
            appliedTo: photo.edits.appliedTo
          }
        };
      }
      if (photo.id === sourcePhotoId) {
        return {
          ...photo,
          edits: {
            ...photo.edits,
            appliedTo: targetPhotoIds
          }
        };
      }
      return photo;
    }));
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== photoId);
      
      // Clean up blob URL
      const photo = prev.find(p => p.id === photoId);
      if (photo?.original) {
        URL.revokeObjectURL(photo.original);
      }
      
      return filtered;
    });
    
    // Select next photo if current was removed
    if (selectedPhotoId === photoId) {
      const remainingPhotos = photos.filter(p => p.id !== photoId);
      setSelectedPhotoId(remainingPhotos.length > 0 ? remainingPhotos[0].id : null);
    }
  };

  const clearAll = () => {
    // Clean up all blob URLs
    photos.forEach(photo => {
      if (photo.original) {
        URL.revokeObjectURL(photo.original);
      }
    });
    
    setPhotos([]);
    setSelectedPhotoId(null);
    setCopiedEdits(null);
  };

  const value = {
    photos,
    selectedPhotoId,
    setSelectedPhotoId,
    copiedEdits,
    setCopiedEdits,
    addPhotos,
    updatePhotoEdits,
    applyEditsToPhotos,
    removePhoto,
    clearAll,
    sessionId
  };

  return (
    <PhotoContext.Provider value={value}>
      {children}
    </PhotoContext.Provider>
  );
};
