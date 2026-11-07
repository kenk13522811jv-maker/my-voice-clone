import React from 'react';
import { Download, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'code' | 'studio' | 'guide' | 'tips';
  setActiveTab: (tab: 'code' | 'studio' | 'guide' | 'tips') => void;
  onDownloadZip: () => void;
  isDownloading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
  isDownloading
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <a 
        href="#" 
        onClick={(e) => { e.preventDefault(); setActiveTab('code'); }}
        className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:text-cyan-400 transition-colors"
      >
        <span className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
          ভ
        </span>
        <span>বাংলা ভয়েস ক্লোনিং হাব</span>
      </a>

      {/* Zone 2: 4 concise single-line nav links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('code')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'code' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          প্রজেক্ট কোড ও ফাইলস
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
            activeTab === 'studio' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>লাইভ ভয়েস স্টুডিও</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'guide' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          Codespaces সেটআপ গাইড
        </button>

        <button
          onClick={() => setActiveTab('tips')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
            activeTab === 'tips' ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' : ''
          }`}
        >
          ১-মিনিট অডিও টিপস
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onDownloadZip}
          disabled={isDownloading}
          className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-500 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 flex items-center gap-2 shadow-sm shadow-cyan-950/40 disabled:opacity-60"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isDownloading ? 'প্যাকিং হচ্ছে...' : 'ডাউনলোড প্রজেক্ট (.ZIP)'}</span>
        </button>
      </div>
    </header>
  );
};
