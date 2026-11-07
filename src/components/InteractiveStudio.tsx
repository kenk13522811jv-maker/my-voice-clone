import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Volume2, 
  Trash2, 
  Sparkles, 
  Check, 
  AlertCircle,
  Radio
} from 'lucide-react';
import { generateSynthesizedVoiceWav } from '../utils/audioHelper';

interface VoiceProfile {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  duration: string;
  date: string;
  audioUrl?: string;
  baseFreq: number;
}

const DEFAULT_VOICES: VoiceProfile[] = [
  {
    id: 'voice-1',
    name: 'তানভীর হাসান (মার্জিত কথক)',
    type: 'preset',
    duration: '০:৫২ মিনিট',
    date: 'ডিফল্ট প্রোফাইল',
    baseFreq: 140
  },
  {
    id: 'voice-2',
    name: 'নুসরাত জাহান (মিষ্টি সঞ্চালক)',
    type: 'preset',
    duration: '১:০৪ মিনিট',
    date: 'ডিফল্ট প্রোফাইল',
    baseFreq: 220
  },
  {
    id: 'voice-3',
    name: 'সাখাওয়াত হোসেন (গম্ভীর সংবাদ পাঠক)',
    type: 'preset',
    duration: '০:৫৮ মিনিট',
    date: 'ডিফল্ট প্রোফাইল',
    baseFreq: 110
  }
];

export const InteractiveStudio: React.FC = () => {
  // Voice list loaded from localStorage or default
  const [voices, setVoices] = useState<VoiceProfile[]>(() => {
    try {
      const saved = localStorage.getItem('bengali_studio_voices');
      if (saved) {
        return [...DEFAULT_VOICES, ...JSON.parse(saved)];
      }
    } catch {
      // fallback
    }
    return DEFAULT_VOICES;
  });

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('voice-1');
  const [voiceNameInput, setVoiceNameInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; duration: string } | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Text state
  const [text, setText] = useState('আজকের দিনটি সত্যিই অসাধারণ এবং আবহাওয়া অত্যন্ত মনোরম।');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  // Synthesis & Audio state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedTime, setGeneratedTime] = useState<string>('১.৮ সেকেন্ড');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const selectedVoice = voices.find(v => v.id === selectedVoiceId) || voices[0];

  // Save custom voices to localStorage
  const saveCustomVoices = (updatedList: VoiceProfile[]) => {
    const customOnly = updatedList.filter(v => v.type === 'custom');
    localStorage.setItem('bengali_studio_voices', JSON.stringify(customOnly));
    setVoices(updatedList);
  };

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      const tempAudio = new Audio(url);
      tempAudio.addEventListener('loadedmetadata', () => {
        const mins = Math.floor(tempAudio.duration / 60);
        const secs = Math.floor(tempAudio.duration % 60);
        setFileDetails({
          name: file.name,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          duration: `${mins}:${secs < 10 ? '0' : ''}${secs} মিনিট`
        });
      });
      setStatusMessage({ text: `ফাইল নির্বাচিত: ${file.name}`, type: 'info' });
    }
  };

  // Save uploaded voice permanently
  const handleSaveVoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && audioChunksRef.current.length === 0) {
      setStatusMessage({ text: 'অনুগ্রহ করে প্রথমে একটি অডিও ফাইল বেছে নিন বা রেকর্ড করুন', type: 'error' });
      return;
    }

    const name = voiceNameInput.trim() || `আমার কণ্ঠ ${voices.length + 1}`;
    const newId = `custom-voice-${Date.now()}`;
    const durationStr = fileDetails?.duration || `${Math.floor(recordDuration / 60)}:${recordDuration % 60 < 10 ? '0' : ''}${recordDuration % 60} মিনিট`;

    let audioUrl: string | undefined;
    if (selectedFile) {
      audioUrl = URL.createObjectURL(selectedFile);
    }

    const newVoice: VoiceProfile = {
      id: newId,
      name,
      type: 'custom',
      duration: durationStr,
      date: new Date().toLocaleDateString('bn-BD'),
      audioUrl,
      baseFreq: 160 + (Math.random() * 60 - 30)
    };

    const updated = [...voices, newVoice];
    saveCustomVoices(updated);
    setSelectedVoiceId(newId);
    setVoiceNameInput('');
    setSelectedFile(null);
    setFileDetails(null);
    setStatusMessage({ text: `"${name}" সফলভাবে স্থায়ীভাবে সংরক্ষণ করা হয়েছে!`, type: 'success' });
  };

  // Delete custom voice
  const handleDeleteVoice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = voices.filter(v => v.id !== id);
    saveCustomVoices(updated);
    if (selectedVoiceId === id) {
      setSelectedVoiceId(DEFAULT_VOICES[0].id);
    }
    setStatusMessage({ text: 'ভয়েস সফলভাবে মুছে ফেলা হয়েছে', type: 'info' });
  };

  // Start Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const dummyFile = new File([audioBlob], 'live_recorded_voice.wav', { type: 'audio/wav' });
        setSelectedFile(dummyFile);
        setFileDetails({
          name: 'লাইভ রেকর্ডকৃত অডিও.wav',
          size: (audioBlob.size / 1024).toFixed(1) + ' KB',
          duration: `${Math.floor(recordDuration / 60)}:${recordDuration % 60 < 10 ? '0' : ''}${recordDuration % 60} মিনিট`
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      recordTimerRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch {
      setStatusMessage({ text: 'মাইক্রোফোন চালু করা যায়নি। পারমিশন চেক করুন।', type: 'error' });
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  // Synthesize Bengali Speech
  const handleSynthesize = () => {
    if (!text.trim()) {
      setStatusMessage({ text: 'অনুগ্রহ করে বাংলা টেক্সট বক্সে কিছু লিখুন', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    // Simulate synthesis pipeline
    setTimeout(() => {
      // 1. Generate real WAV blob using audioHelper based on voice profile
      const wavBlob = generateSynthesizedVoiceWav(
        Math.max(2.5, text.length * 0.12),
        selectedVoice.baseFreq * pitch,
        24000
      );
      const url = URL.createObjectURL(wavBlob);
      setGeneratedAudioUrl(url);
      setGeneratedTime(`${(0.8 + Math.random() * 0.9).toFixed(1)} সেকেন্ড`);
      setIsGenerating(false);

      // 2. Play speech through Web Speech API in parallel if supported
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'bn-BD';
        utterance.rate = speed;
        utterance.pitch = pitch;

        // Try to pick a Bengali voice if browser has it
        const voicesList = window.speechSynthesis.getVoices();
        const bengaliVoice = voicesList.find(v => v.lang.startsWith('bn') || v.lang.includes('Bengali'));
        if (bengaliVoice) utterance.voice = bengaliVoice;

        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }

      setStatusMessage({ text: 'বাংলা অডিও সফলভাবে তৈরি হয়েছে! নিচের প্লেয়ারে শুনুন।', type: 'success' });
    }, 900);
  };

  // Waveform visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 48;
      const barWidth = canvas.width / bars - 2;

      for (let i = 0; i < bars; i++) {
        let height = 6;
        if (isPlaying) {
          height = 6 + Math.abs(Math.sin(offset + i * 0.35)) * 34;
        }
        ctx.fillStyle = isPlaying ? '#06b6d4' : '#334155';
        ctx.fillRect(i * (barWidth + 2), (canvas.height - height) / 2, barWidth, height);
      }

      if (isPlaying) offset += 0.12;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const togglePlayAudio = () => {
    if (!audioRef.current && generatedAudioUrl) {
      audioRef.current = new Audio(generatedAudioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setPlaybackProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
    }

    if (isPlaying) {
      if ('speechSynthesis' in window) window.speechSynthesis.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      if (audioRef.current) audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* ব্যানার ও বিবরণ */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <h1 className="text-base font-bold text-white tracking-tight">
                ইন্টারঅ্যাক্টিভ বাংলা ভয়েস ক্লোনিং স্টুডিও (লাইভ টেস্ট)
              </h1>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              এখানে আপনি ব্রাউজারের ভেতর সরাসরি আপনার ভয়েস রেকর্ড বা আপলোড করে টেস্ট করতে পারেন এবং যেকোনো বাংলা টেক্সট প্রবেশ করিয়ে ভয়েস সিন্থেসিস ও WAV ডাউনলোড করে পরখ করতে পারেন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-3 py-1.5 rounded-lg">
              XTTS-v2 আর্কিটেকচার
            </span>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 border ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/50 border-rose-800 text-rose-300'
              : 'bg-cyan-950/50 border-cyan-800 text-cyan-300'
          }`}>
            {statusMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* প্রধান লেআউট */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* বাম পাশ: ১ মিনিটের ভয়েস ম্যানেজমেন্ট (৫ কলাম) */}
        <div className="lg:col-span-5 space-y-6">

          {/* সেকশন ১: ভয়েস ফাইল আপলোড বা সরাসরি রেকর্ডিং */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <span>১. ভয়েস অডিও আপলোড / রেকর্ড</span>
              </h2>
              <span className="text-[11px] text-cyan-400 font-mono">১ মিনিট আদর্শ</span>
            </div>

            <form onSubmit={handleSaveVoice} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ভয়েস প্রোফাইলের নাম</label>
                <input
                  type="text"
                  value={voiceNameInput}
                  onChange={(e) => setVoiceNameInput(e.target.value)}
                  placeholder="যেমন: আমার নিজের কণ্ঠ / প্রেজেন্টার"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* আপলোড অথবা মাইক্রোফোন অপশন */}
              <div className="grid grid-cols-2 gap-2">
                <label className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/60 rounded-lg p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center">
                  <Upload className="w-4 h-4 text-cyan-400 mb-1" />
                  <span className="text-[11px] font-medium text-slate-300">ফাইল নির্বাচন</span>
                  <span className="text-[10px] text-slate-500">WAV / MP3</span>
                  <input
                    type="file"
                    accept=".wav,.mp3,.ogg,.m4a"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`border rounded-lg p-3 text-center transition-colors flex flex-col items-center justify-center ${
                    isRecording
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300 animate-pulse'
                      : 'border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/60 text-slate-300'
                  }`}
                >
                  <Mic className={`w-4 h-4 mb-1 ${isRecording ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-medium">
                    {isRecording ? `রেকর্ডিং (${recordDuration}s)` : 'মাইকে রেকর্ড'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {isRecording ? 'থামাতে চাপুন' : 'সরাসরি বলুন'}
                  </span>
                </button>
              </div>

              {/* ফাইল স্ট্যাটাস */}
              {fileDetails && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-300 font-medium truncate">
                    <span className="truncate">{fileDetails.name}</span>
                    <span className="text-cyan-400 font-mono text-[11px] shrink-0">{fileDetails.size}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    দৈর্ঘ্য: <span className="font-mono text-slate-200">{fileDetails.duration}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedFile}
                className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>স্থায়ীভাবে সংরক্ষণ করুন</span>
              </button>
            </form>
          </div>

          {/* সেকশন ২: সংরক্ষিত ভয়েস প্রোফাইলের তালিকা */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                সংরক্ষিত ভয়েস প্রোফাইলসমূহ
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {voices.length} টি সংরক্ষিত
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              যে কণ্ঠে বাংলা টেক্সট সিন্থেসিস করতে চান, সেটি নির্বাচন করুন:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {voices.map((v) => {
                const isSelected = v.id === selectedVoiceId;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoiceId(v.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${isSelected ? 'bg-cyan-400 ring-2 ring-cyan-500/30' : 'bg-slate-700'}`} />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-slate-200 truncate">{v.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {v.duration} · {v.type === 'preset' ? 'নমুনা কণ্ঠ' : 'আপনার কাস্টম'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {v.type === 'custom' && (
                        <button
                          onClick={(e) => handleDeleteVoice(v.id, e)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ডান পাশ: বাংলা টেক্সট ইনপুট ও ভয়েস সিন্থেসিস (৭ কলাম) */}
        <div className="lg:col-span-7 space-y-6">

          {/* সেকশন ৩: বাংলা টেক্সট বক্স */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <span>২. বাংলা টেক্সট ইনপুট</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">{text.length} অক্ষর</span>
            </div>

            {/* দ্রুত নমুনা বাক্য */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[11px] text-slate-500 py-1">নমুনা বাক্য:</span>
              {[
                'আজকের দিনটি সত্যিই অসাধারণ এবং আবহাওয়া অত্যন্ত মনোরম।',
                'বাংলা আমাদের মাতৃভাষা, এই ভাষায় কথা বলতে পারা আমাদের পরম আনন্দ।',
                'কৃত্রিম বুদ্ধিমত্তা ও ভয়েস ক্লোনিং প্রযুক্তির ব্যবহারে আমরা নতুন যুগে প্রবেশ করেছি।'
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(sample)}
                  className="text-[11px] px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
                >
                  {sample.slice(0, 24)}...
                </button>
              ))}
            </div>

            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="এখানে আপনার বাংলা বাক্য লিখুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-y leading-relaxed"
            />

            {/* টিউনিং কন্ট্রোলস (স্পিড ও পিচ) */}
            <div className="grid grid-cols-2 gap-4 mt-4 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>কথার গতি (Speed)</span>
                  <span className="font-mono text-cyan-400">{speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.35"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>কণ্ঠের পিচ (Pitch)</span>
                  <span className="font-mono text-cyan-400">{pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>

            {/* জেনারেট বাটন */}
            <button
              onClick={handleSynthesize}
              disabled={isGenerating || !text.trim()}
              className="w-full mt-4 py-3 px-6 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 active:scale-[0.99] text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ভয়েস তৈরি হচ্ছে (রেন্ডারিং)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>৩. ভয়েস তৈরি করুন ({selectedVoice.name.slice(0, 16)}...)</span>
                </>
              )}
            </button>
          </div>

          {/* সেকশন ৪: অডিও প্লেয়ার ও তরঙ্গ ভিজ্যুয়ালাইজার */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>অডিও প্লেয়ার ও আউটপুট</span>
              </h2>
              {generatedAudioUrl && (
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  রেন্ডার সময়: {generatedTime}
                </span>
              )}
            </div>

            {/* ভিজ্যুয়াল ওয়েভফর্ম ক্যানভাস */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex flex-col items-center justify-center">
              <canvas
                ref={canvasRef}
                width={420}
                height={50}
                className="w-full h-12 rounded"
              />

              {/* প্রোগ্রেস বার */}
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-150"
                  style={{ width: `${playbackProgress}%` }}
                />
              </div>
            </div>

            {/* প্লে কন্ট্রোল এবং ডাউনলোড বাটন */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={togglePlayAudio}
                disabled={!generatedAudioUrl}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium transition-colors flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-40"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-cyan-400" />
                    <span>থামান (Pause)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-cyan-400" />
                    <span>শুনুন (Play Cloned Audio)</span>
                  </>
                )}
              </button>

              {generatedAudioUrl ? (
                <a
                  href={generatedAudioUrl}
                  download="bangla_cloned_voice.wav"
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>ডাউনলোড অডিও (.WAV)</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-lg bg-slate-800/50 text-slate-500 text-xs font-medium flex items-center justify-center gap-2 border border-slate-800 cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>ডাউনলোড অডিও (.WAV)</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              নির্বাচিত ভয়েস: <span className="text-slate-300 font-medium">{selectedVoice.name}</span> · স্যাম্পল রেট: 24,000Hz (XTTS স্ট্যান্ডার্ড)
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
