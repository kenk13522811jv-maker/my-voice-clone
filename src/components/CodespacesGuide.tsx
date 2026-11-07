import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, Cpu, CheckCircle } from 'lucide-react';

export const CodespacesGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      step: '০১',
      title: 'GitHub রিপোজিটরি তৈরি ও Codespaces ওপেন করুন',
      desc: 'আপনার GitHub অ্যাকাউন্টে একটি নতুন রিপোজিটরি খুলুন এবং প্রজেক্টের ফাইলগুলো আপলোড করুন। এরপর সবুজ "Code" বাটনে ক্লিক করে Codespaces তৈরি করুন।',
      command: null,
      tip: 'টিপ: যদি সম্ভব হয়, Codespaces মেশিনের আকার নির্ধারণে 4-core বা GPU ইনস্ট্যান্স বেছে নিন। সাধারণ CPU ইনস্ট্যান্সেও কাজ করবে।'
    },
    {
      step: '০২',
      title: 'লিনাক্স অডিও ও সিস্টেম প্যাকেজ ইনস্টল করুন',
      desc: 'Codespaces-এর টার্মিনাল উইন্ডো খুলুন এবং লিনাক্স অডিও প্রসেসিং লাইব্রেরি (ffmpeg এবং libsndfile1) ইনস্টল করুন:',
      command: 'sudo apt update && sudo apt install -y ffmpeg libsndfile1',
      tip: 'এটি অডিও রূপান্তর এবং 24kHz মনো ফরম্যাটে রূপান্তরের জন্য অপরিহার্য।'
    },
    {
      step: '০৩',
      title: 'প্রয়োজনীয় পাইথন প্যাকেজসমূহ ইনস্টল করুন',
      desc: 'requirements.txt থেকে Coqui TTS, PyTorch, Torchaudio এবং Flask ইনস্টল করুন:',
      command: 'pip install -r requirements.txt',
      tip: 'ডিপেনডেন্সি ফাইলটি লিনাক্স এনভায়রনমেন্টের সাথে সর্বোচ্চ সামঞ্জস্য রেখে সাজানো হয়েছে।'
    },
    {
      step: '০৪',
      title: 'ফ্লাস্ক সার্ভার চালু করুন',
      desc: 'টার্মিনালে অ্যাপ্লিকেশনটি চালু করুন। প্রথমবার চালুর সময় Coqui XTTS-v2 এর মডেল স্বয়ংক্রিয়ভাবে ডাউনলোড হয়ে যাবে:',
      command: 'python app.py',
      tip: 'app.py ফাইলে host="0.0.0.0" এবং port=5000 সেট করা আছে, যা Codespaces পোর্ট ফরওয়ার্ডিংয়ের জন্য উপযোগী।'
    },
    {
      step: '০৫',
      title: 'ব্রাউজারে ওয়েব ইন্টারফেস ওপেন করুন',
      desc: 'সার্ভার চালু হওয়া মাত্র Codespaces নিচে একটি নোটিফিকেশন দেখাবে: "Your application running on port 5000 is available". সেখানে "Open in Browser" এ চাপুন।',
      command: null,
      tip: 'যদি নোটিফিকেশন না আসে, তবে Codespaces-এর "PORTS" ট্যাবে গিয়ে পোর্ট 5000 এর পাশের "Open in Browser" আইকন চাপুন এবং পোর্ট ভিজিবিলিটি Public রাখুন।'
    }
  ];

  return (
    <div className="space-y-6">
      {/* হেডার ব্যানার */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h1 className="text-base font-bold text-white tracking-tight">
                GitHub Codespaces-এ প্রজেক্ট চালানোর সহজ গাইডলাইন
              </h1>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              GitHub Codespaces সম্পূর্ণ ক্লাউড ভিত্তিক ভিজ্যুয়াল স্টুডিও কোড পরিবেশ সরবরাহ করে। কোনো লোকাল শক্তিশালী পিসি বা কনফিগারেশন ছাড়াই সরাসরি ব্রাউজার থেকে বাংলা ভয়েস ক্লোনিং সার্ভার রান করুন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/codespaces"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <span>GitHub Codespaces ড্যাশবোর্ড</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* স্টেপ বাই স্টেপ কার্ড গ্রিড */}
      <div className="space-y-4">
        {steps.map((item, idx) => (
          <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </span>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.desc}
                </p>

                {item.command && (
                  <div className="mt-2 bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between font-mono text-xs text-cyan-300">
                    <span className="truncate pr-2">{item.command}</span>
                    <button
                      onClick={() => copyToClipboard(item.command!, idx)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans flex items-center gap-1 shrink-0 transition-colors"
                      title="কমান্ড কপি করুন"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>কপি</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {item.tip && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded border border-slate-800/60 mt-1">
                    💡 <span className="text-slate-300 font-medium">{item.tip}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GPU বনাম CPU পারফরম্যান্স ও মেমরি নোট */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>হার্ডওয়্যার ও মডেল পারফরম্যান্স তথ্য</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-emerald-400 block">NVIDIA GPU ইনস্ট্যান্সে (প্রস্তাবিত)</span>
            <p className="text-slate-400 leading-relaxed">
              CUDA সাপোর্টের কারণে ১টি বাংলা বাক্য ক্লোন করতে সাধারণত মাত্র ২ থেকে ৫ সেকেন্ড সময় নেয়। Coqui XTTS-v2 এর জন্য প্রায় 3.5GB VRAM প্রয়োজন হয়।
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-amber-400 block">স্ট্যান্ডার্ড CPU ইনস্ট্যান্সে</span>
            <p className="text-slate-400 leading-relaxed">
              যদি আপনার Codespaces-এ GPU সক্রিয় না থাকে, তবে কোডটি স্বয়ংক্রিয়ভাবে CPU ফলব্যাক মোডে চলবে। বাক্য সিন্থেসিস হতে সাধারণত ১৫ থেকে ৩৫ সেকেন্ড লাগতে পারে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
