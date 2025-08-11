import React, { useState, useEffect } from 'react';
import { PhotoProvider, usePhotoContext } from './contexts/PhotoContext';
import { PhotoUploader } from './components/PhotoUploader';
import { PhotoGrid } from './components/PhotoGrid';
import { FilterSelector } from './components/FilterSelector';
import { EditPanelV2 } from './components/EditPanelV2';
import { ExportButton } from './components/ExportButton';
import { Shield, Zap, Clock, TrendingUp, DollarSign, Home, Camera, Users } from 'lucide-react';
import { HouseIcon } from './components/HouseIcon';

function AppContent() {
  const { photos } = usePhotoContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasPhotos = photos.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/25">
                <HouseIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  PropertyPhoto Pro
                </h1>
                <p className="hidden sm:block text-[10px] text-muted-foreground -mt-1">
                  Real Estate Photos, Perfected
                </p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3">
              {hasPhotos && <ExportButton />}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="sm:hidden">
              {hasPhotos && <ExportButton />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Upload Section - Compact when photos exist */}
        <div className={hasPhotos ? "mb-4 sm:mb-6" : "mb-6 sm:mb-8"}>
          <PhotoUploader />
        </div>

        {hasPhotos && (
          <>
            {/* Photo Grid - More compact */}
            <div className="mb-4 sm:mb-6">
              <PhotoGrid />
            </div>

            {/* Editing Section - Optimized layout */}
            <div className="space-y-4 sm:space-y-6">
              {/* Preset Filters */}
              <FilterSelector />

              {/* Manual Editor */}
              <EditPanelV2 />
            </div>
          </>
        )}

        {/* Empty State - Compelling Value for Real Estate Agents */}
        {!hasPhotos && (
          <div className="py-8 sm:py-12">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Sell Homes Faster, Earn More
              </h2>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Professional photos get <span className="font-semibold">61% more views</span> and sell <span className="font-semibold">32% faster</span>. 
                Edit yours in seconds, not hours.
              </p>
            </div>

            {/* Stats Bar */}
            <div className="flex justify-center gap-8 mb-8 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">$47K</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Higher sale price</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-slate-300 dark:bg-slate-700" />
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">2x</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">More inquiries</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-slate-300 dark:bg-slate-700" />
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">89%</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Faster to list</div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* List Same Day */}
              <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">List Properties Same Day</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    No waiting for photographers. Shoot at 2pm, list by 3pm.
                  </p>
                </div>
              </div>

              {/* Save Money */}
              <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Save $300+ Per Listing</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Pro photographers charge $200-500. Do it yourself for free.
                  </p>
                </div>
              </div>

              {/* Win More Listings */}
              <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Win More Listings</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Impress sellers with instant professional photos during listing presentations.
                  </p>
                </div>
              </div>

              {/* MLS Ready */}
              <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">MLS-Compliant Export</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Auto-resize to 1920px, proper naming, batch export as ZIP.
                  </p>
                </div>
              </div>

              {/* Stand Out */}
              <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Beat 87% of Agents</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Most agents use unedited phone photos. Stand out with pro quality.
                  </p>
                </div>
              </div>

              {/* Privacy */}
              <div className="flex gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Celebrity-Safe Privacy</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Photos never leave your device. Perfect for luxury properties.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-8">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Join 10,000+ top-performing agents
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                No signup • No subscription • Works instantly
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <p className="font-medium">
              🔒 Privacy First: All processing happens locally
            </p>
            <p>
              MLS-ready exports • Batch processing
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <PhotoProvider>
      <AppContent />
    </PhotoProvider>
  );
}

export default App;
