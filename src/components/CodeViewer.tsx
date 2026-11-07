import React, { useState } from 'react';
import { PROJECT_FILES, ProjectFile } from '../data/projectFiles';
import { Copy, Check, Download, FileCode, Terminal, FileText, CheckCircle2 } from 'lucide-react';

export const CodeViewer: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentFile: ProjectFile = PROJECT_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Extract base filename
    const filename = currentFile.name.split('/').pop() || currentFile.name;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.py')) return <FileCode className="w-4 h-4 text-emerald-400" />;
    if (fileName.endsWith('.html')) return <FileCode className="w-4 h-4 text-amber-400" />;
    if (fileName.endsWith('.json')) return <Terminal className="w-4 h-4 text-cyan-400" />;
    if (fileName.endsWith('.txt')) return <FileText className="w-4 h-4 text-slate-400" />;
    return <FileText className="w-4 h-4 text-sky-400" />;
  };

  return (
    <div className="space-y-6">
      {/* হেডার ও ফাইল সিলেক্টর বার */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              বাংলা ভয়েস ক্লোনিং প্রজেক্ট কোডবেস (XTTS-v2 & Flask)
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>Python 3.10+</span>
              <span aria-hidden="true">·</span>
              <span>Coqui XTTS-v2</span>
              <span aria-hidden="true">·</span>
              <span>GitHub Codespaces রেডি</span>
              <span aria-hidden="true">·</span>
              <span>বাংলা (bn) সমর্থিত</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>কোড কপি করুন</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSingle}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700"
              title="এই ফাইলটি ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* ফাইল নেভিগেশন ট্যাব */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-800/80 pt-3">
          {PROJECT_FILES.map((file, idx) => {
            const isSelected = selectedFileIndex === idx;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 font-medium'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {getFileIcon(file.name)}
                <span>{file.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ফাইলের বর্ণনা ও কারিগরি বিবরণ */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-semibold text-cyan-400">{currentFile.path}</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {currentFile.content.split('\n').length} lines
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{currentFile.descriptionBn}</p>
          </div>
        </div>
      </div>

      {/* কোড এডিটর ভিউয়ার */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
        {/* উইন্ডো কন্ট্রোল বার */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="ml-2 text-slate-300">{currentFile.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>UTF-8</span>
            <span>{currentFile.language.toUpperCase()}</span>
          </div>
        </div>

        {/* কোড টেক্সট এরিয়া */}
        <div className="max-h-[640px] overflow-y-auto overflow-x-auto p-4 font-mono text-xs leading-relaxed text-slate-200 selection:bg-cyan-500/30 selection:text-white">
          <pre className="table w-full">
            <code>
              {currentFile.content.split('\n').map((line, i) => (
                <div key={i} className="table-row hover:bg-slate-900/40">
                  <span className="table-cell select-none text-right pr-4 text-slate-600 font-mono text-[11px] w-10">
                    {i + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>

      {/* ব্যবহারকারীর ৩টি মূল প্রয়োজনীয়তার ম্যাপিং ও ব্যাখ্যা */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>আপনার অনুরোধকৃত ৩টি প্রধান ফিচারের কোড বাস্তবায়নের বিবরণ:</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5">
            <span className="font-semibold text-cyan-300 block">১. স্থায়ী অডিও সংরক্ষণ</span>
            <p className="text-slate-400 leading-relaxed">
              <code className="text-cyan-400 font-mono">/api/upload_voice</code> রুটে ১ মিনিটের ফাইল <code className="text-slate-300 font-mono">uploads/speakers/</code> ফোল্ডারে স্থায়ীভাবে জমা হয় এবং <code className="text-slate-300 font-mono">speakers_metadata.json</code> ফাইলে তালিকা সংরক্ষিত থাকে।
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5">
            <span className="font-semibold text-cyan-300 block">২. বাংলা টেক্সট প্রসেসিং</span>
            <p className="text-slate-400 leading-relaxed">
              <code className="text-cyan-400 font-mono">language="bn"</code> প্যারামিটারের মাধ্যমে Coqui XTTS-v2 মডেলের বাংলা টোকেনাইজার কার্যকর হয়, যা খাঁটি বাংলা লিপি ও বাক্য সাবলীলভাবে প্রসেস করে।
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5">
            <span className="font-semibold text-cyan-300 block">৩. ভয়েস প্লেয়ার ও ডাউনলোড</span>
            <p className="text-slate-400 leading-relaxed">
              তৈরিকৃত অডিও <code className="text-cyan-400 font-mono">/outputs/*.wav</code> ফাইলে এক্সপোর্ট হয়ে সরাসরি ওয়েব ইন্টারফেসের প্লেয়ারে তাৎক্ষণিক বাজে এবং ব্রাউজারে সেভ করার জন্য ওয়ান-ক্লিক ডাউনলোড অপশন পাওয়া যায়।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
