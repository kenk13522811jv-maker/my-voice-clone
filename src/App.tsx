import React, { useState } from 'react';
import { Header } from './components/Header';
import { CodeViewer } from './components/CodeViewer';
import { InteractiveStudio } from './components/InteractiveStudio';
import { CodespacesGuide } from './components/CodespacesGuide';
import { VoiceTipsSection } from './components/VoiceTipsSection';
import { downloadProjectZip } from './utils/zipGenerator';
import { FileCode, Sparkles, Terminal, Mic } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'code' | 'studio' | 'guide' | 'tips'>('code');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      await downloadProjectZip();
      setDownloadToast(true);
      setTimeout(() => setDownloadToast(false), 3500);
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* শীর্ষ নেভিগেশন বার (Top Bar Contract Compliant) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        isDownloading={isDownloading}
      />

      {/* মোবাইল সাব-নেভ বার */}
      <div className="flex md:hidden items-center justify-around border-b border-slate-800 bg-slate-900/80 px-2 py-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'code' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>কোড ফাইল</span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'studio' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>স্টুডিও</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'guide' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Codespaces</span>
        </button>

        <button
          onClick={() => setActiveTab('tips')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'tips' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>টিপস</span>
        </button>
      </div>

      {/* ডাউনলোড টোস্ট নোটিফিকেশন */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>প্রজেক্টের সম্পূর্ণ ZIP ফাইল সফলভাবে ডাউনলোড হয়েছে!</span>
        </div>
      )}

      {/* মূল কন্টেন্ট কনটেইনার */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'code' && <CodeViewer />}
        {activeTab === 'studio' && <InteractiveStudio />}
        {activeTab === 'guide' && <CodespacesGuide />}
        {activeTab === 'tips' && <VoiceTipsSection />}
      </main>

      {/* ফুটার */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Coqui XTTS-v2</span>
            <span aria-hidden="true">·</span>
            <span>Python Flask</span>
            <span aria-hidden="true">·</span>
            <span>বাংলা টেক্সট-টু-স্পিচ ও ভয়েস ক্লোনিং</span>
          </div>
          <div>
            <span>GitHub Codespaces ও লোকাল GPU রেডি</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
