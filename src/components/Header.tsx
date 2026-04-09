'use client';

import { useState, useRef, useEffect } from 'react';
import type { ViewMode } from '@/lib/types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onClose: () => void;
  onExportGif: () => void;
  onExportImages: () => void;
  canExport: boolean;
}

export function Header({
  viewMode,
  onViewModeChange,
  onClose,
  onExportGif,
  onExportImages,
  canExport,
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const viewModes: { mode: ViewMode; icon: React.ReactNode }[] = [
    {
      mode: 'current',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
    },
    {
      mode: 'vs-previous',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      mode: 'vs-original',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="8" height="18" rx="1" />
          <rect x="13" y="3" width="8" height="18" rx="1" />
        </svg>
      ),
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50">
      {/* View mode icons */}
      <div className="flex items-center gap-1">
        {viewModes.map(({ mode, icon }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`p-2 transition-opacity ${
              viewMode === mode ? 'opacity-100' : 'opacity-35 hover:opacity-60'
            }`}
            title={mode === 'current' ? 'Single view' : mode === 'vs-previous' ? 'Comparison slider' : 'Side by side'}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Title - clickable to return to upload */}
      <button
        onClick={onClose}
        className="absolute left-1/2 -translate-x-1/2 hover:opacity-70 transition-opacity"
      >
        <img src="/logo.svg" alt="Infinite Mirror" className="h-3" />
      </button>

      {/* Right icons */}
      <div className="flex items-center gap-1">
        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 opacity-35 hover:opacity-100 transition-opacity"
          title="Start over"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Download button with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => canExport && setShowDropdown(!showDropdown)}
            className={`p-2 transition-opacity ${canExport ? 'opacity-35 hover:opacity-100' : 'opacity-20 cursor-not-allowed'}`}
            title="Export"
            disabled={!canExport}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="6 13 12 19 18 13" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 bg-white/[0.06] backdrop-blur-lg rounded-xl overflow-hidden w-48 z-[60]">
              <button
                onClick={() => {
                  onExportGif();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors"
              >
                Download GIF
              </button>
              <button
                onClick={() => {
                  onExportImages();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition-colors"
              >
                Download all images
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
