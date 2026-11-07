import React from 'react';
import { Mic, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const VoiceTipsSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* হেডার ব্যানার */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Mic className="w-5 h-5 text-cyan-400" />
          <h1 className="text-base font-bold text-white tracking-tight">
            ১ মিনিটের পারফেক্ট ভয়েস স্যাম্পল তৈরির নির্দেশিকা
          </h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          জিরো-শট ভয়েস ক্লোনিং মডেল (XTTS-v2) আপনার আপলোড করা অডিও থেকেই কণ্ঠের ফ্রিকোয়েন্সি, পিচ এবং বাচনভঙ্গির লেটেন্ট ভেক্টর তৈরি করে। আপনার অডিও যত পরিষ্কার হবে, ক্লোন করা বাংলা অডিও তত জীবন্ত ও বাস্তবসম্মত হবে।
        </p>
      </div>

      {/* নির্দেশনামূলক কার্ড গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* যা যা করবেন (করণীয়) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>যা করবেন (সর্বোত্তম ফলাফল পেতে)</span>
          </h2>

          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-slate-100">৩০ সেকেন্ড থেকে ১ মিনিটের সময়সীমা:</strong>
                <p className="text-slate-400 mt-0.5">XTTS-v2 এর জন্য ৩০ থেকে ৬০ সেকেন্ডের একটানা পরিষ্কার কথা সবচেয়ে কার্যকর লেটেন্ট ভেক্টর তৈরি করে।</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-slate-100">স্বাভাবিক গতি ও স্পষ্ট উচ্চারণ:</strong>
                <p className="text-slate-400 mt-0.5">কোনো সংবাদপত্র বা গল্পের বই স্বাভাবিক গলার স্বরে, সঠিক দাঁড়ি-কমা মেনে পড়ুন।</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-slate-100">নিস্তব্ধ পরিবেশ:</strong>
                <p className="text-slate-400 mt-0.5">ফ্যান ও এসি বন্ধ রেখে পর্দা টানা একটি শান্ত রুমে রেকর্ড করুন যাতে প্রতিধ্বনি (Echo) না তৈরি হয়।</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-slate-100">মাইক্রোফোনের সঠিক দূরত্ব:</strong>
                <p className="text-slate-400 mt-0.5">মুখ থেকে ৪-৬ ইঞ্চি দূরে মাইক্রোফোন রাখুন যাতে অতিরিক্ত বাতাসের ফুঁ বা পপ শব্দ তৈরি না হয়।</p>
              </div>
            </li>
          </ul>
        </div>

        {/* যা যা করবেন না (বর্জনীয়) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>যা পরিহার করবেন</span>
          </h2>

          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-slate-100">কোনো ব্যাকগ্রাউন্ড মিউজিক নয়:</strong>
                <p className="text-slate-400 mt-0.5">অডিওতে গান বা মিউজিক থাকলে মডেল মিউজিককেও কণ্ঠের অংশ ভেবে বিকৃত শব্দ তৈরি করতে পারে।</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-slate-100">একাধিক ব্যক্তির কথা নয়:</strong>
                <p className="text-slate-400 mt-0.5">অডিও ফাইলে যেন শুধুমাত্র একজন ব্যক্তির কণ্ঠই থাকে। একাধিক বক্তার কণ্ঠ থাকলে ক্লোনিং বিভ্রান্ত হবে।</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-slate-100">খুব ছোট অডিও (৫-১০ সেকেন্ড):</strong>
                <p className="text-slate-400 mt-0.5">অতিরিক্ত ছোট ক্লিপ দিলে আপনার কণ্ঠের স্বাভাবিক ওঠানামা মডেল অনুধাবন করতে পারে না।</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
              <div>
                <strong className="text-slate-100">অতিরিক্ত আবেগ বা ফিসফিসানি:</strong>
                <p className="text-slate-400 mt-0.5">অতিরিক্ত চিৎকার বা খুব মৃদু ফিসফিসানি এড়িয়ে স্বাভাবিক কথোপকথনের ভঙ্গি বজায় রাখুন।</p>
              </div>
            </li>
          </ul>
        </div>

      </div>

      {/* রেকর্ডিংয়ের জন্য নমুনা স্ক্রিপ্ট */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <span>📖 ১ মিনিট রেকর্ডিং করার জন্য একটি আদর্শ বাংলা অনুচ্ছেদ:</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          আপনার ১ মিনিটের অডিও তৈরির জন্য আপনি নিচের বাংলা অংশটি স্বাভাবিক গতিতে পড়ে রেকর্ড করতে পারেন:
        </p>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans select-all">
          "আমাদের এই সবুজ-শ্যামল বাংলা প্রকৃতির মাঝে জড়িয়ে রয়েছে অপরূপ সৌন্দর্য। ষড়ঋতুর এই দেশে ঋতু পরিবর্তনের সাথে সাথে প্রকৃতির রূপ বদলায়। কখনো ঝুম বৃষ্টি, কখনো সোনালী রোদের ঝিলিক, আবার কখনো বা মিষ্টি শীতের সকাল। বাংলা ভাষা আমাদের প্রাণের ভাষা, মায়ের ভাষা। এই ভাষার প্রতিটি বর্ণে রয়েছে আবেগ, সংগ্রাম আর ভালোবাসা। প্রযুক্তির এই নতুন যুগে আমরা আমাদের ভাষাকে বিশ্বদরবারে পৌঁছে দিতে নিরলস কাজ করে যাচ্ছি। জ্ঞান-বিজ্ঞানের অগ্রগতিতে বাংলা হোক আমাদের প্রথম ভরসা।"
        </div>
      </div>

      {/* গোপনীয়তা ও সুরক্ষা নোট */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-xs text-slate-400">
          <strong className="text-slate-200">ব্যক্তিগত ও সুরক্ষিত:</strong> এই কোডটি আপনার নিজস্ব সার্ভারে বা GitHub Codespaces-এ চলে। আপনার আপলোড করা অডিও অন্য কোনো থার্ড-পার্টি ক্লাউডে পাঠানো হয় না।
        </p>
      </div>
    </div>
  );
};
