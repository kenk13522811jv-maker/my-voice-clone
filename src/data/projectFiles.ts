/**
 * Full Production Code for the Python Flask Bengali Voice Cloning Project
 * Powered by Coqui XTTS-v2 (Zero-Shot Cross-Lingual Voice Cloning)
 */

export interface ProjectFile {
  name: string;
  path: string;
  language: string;
  descriptionBn: string;
  descriptionEn: string;
  content: string;
}

export const APP_PY_CODE = `"""
বাংলা ভয়েস ক্লোনিং এবং টেক্সট-টু-স্পিচ ফ্লাস্ক ওয়েব অ্যাপ্লিকেশন
মডেল: Coqui XTTS-v2 (ওপেন-সোর্স জিরো-শট ভয়েস ক্লোনিং)
সাপোর্ট: বাংলা (bn) এবং অন্যান্য বহুভাষিক টেক্সট
GitHub Codespaces ও লোকাল GPU/CPU-তে চলার উপযোগী।
"""

import os
import json
import uuid
import time
import torch
import torchaudio
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# TTS ইম্পোর্ট করার আগে Coqui TOS শর্তাবলী স্বয়ংক্রিয়ভাবে গ্রহণ
os.environ["COQUI_TOS_AGREED"] = "1"

try:
    from TTS.api import TTS
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import Xtts
except ImportError:
    print("সতর্কতা: TTS লাইব্রেরি ইনস্টল করা নেই! অনুগ্রহ করে 'pip install TTS' রান করুন।")

app = Flask(__name__)
CORS(app)

# ফোল্ডার ডিরেক্টরি কনফিগারেশন
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads" / "speakers"
OUTPUT_DIR = BASE_DIR / "outputs"
METADATA_FILE = BASE_DIR / "uploads" / "speakers_metadata.json"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg", "flac", "m4a"}

# গ্লোবাল মডেল ভেরিয়েবল
tts_model = None
device = "cuda" if torch.cuda.is_available() else "cpu"

def load_voice_metadata():
    """সংরক্ষিত ভয়েস প্রোফাইল মেটাডাটা লোড করে"""
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_voice_metadata(data):
    """ভয়েস প্রোফাইল মেটাডাটা ফাইলে সংরক্ষণ করে"""
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def init_model():
    """Coqui XTTS-v2 মডেল ইনিশিয়ালাইজ করে"""
    global tts_model
    if tts_model is None:
        print(f"[*] XTTS-v2 মডেল লোড হচ্ছে... ডিভাইস: {device.upper()}")
        start_time = time.time()
        
        # XTTS-v2 মডেল লোড (স্বয়ংক্রিয়ভাবে ডাউনলোড হবে যদি পূর্বে ডাউনলোড না থাকে)
        tts_model = TTS(
            model_name="tts_models/multilingual/multi-dataset/xtts_v2",
            progress_bar=True,
            gpu=(device == "cuda")
        )
        print(f"[✓] মডেল সফলভাবে লোড হয়েছে! সময় লেগেছে: {time.time() - start_time:.2f} সেকেন্ড")

# সার্ভার স্টার্টআপে মডেল লোড
print("সার্ভার প্রস্তুত করা হচ্ছে...")
try:
    init_model()
except Exception as e:
    print(f"[!] মডেল প্রি-লোডিং ব্যর্থ: {e}")
    print("অনুরোধ আসার সময় মডেল লোড করার চেষ্টা করা হবে।")

def preprocess_audio_file(input_path, output_path):
    """
    ১ মিনিটের অডিওকে XTTS-v2 এর উপযোগী স্ট্যান্ডার্ড ফরম্যাটে (24000Hz, Mono, 16-bit WAV) কনভার্ট করে।
    """
    waveform, sample_rate = torchaudio.load(input_path)
    
    # মাল্টি-চ্যানেল হলে মনো চ্যানেলে রূপান্তর
    if waveform.shape[0] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)
    
    # 24kHz স্যাম্পল রেটে রূপান্তর
    if sample_rate != 24000:
        resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=24000)
        waveform = resampler(waveform)
    
    torchaudio.save(output_path, waveform, 24000)
    return output_path

@app.route("/")
def index():
    """প্রধান ওয়েব ইন্টারফেস রেন্ডার করে"""
    return render_template("index.html")

@app.route("/api/voices", methods=["GET"])
def get_voices():
    """সংরক্ষিত সকল ভয়েসের তালিকা রিটার্ন করে"""
    voices = load_voice_metadata()
    return jsonify({"success": True, "voices": voices})

@app.route("/api/upload_voice", methods=["POST"])
def upload_voice():
    """
    ব্যবহারকারীর ১ মিনিটের পরিষ্কার ভয়েস অডিও ফাইল আপলোড করে স্থায়ীভাবে সংরক্ষণ করে।
    """
    if "audio" not in request.files:
        return jsonify({"success": False, "error": "কোনো অডিও ফাইল পাওয়া যায়নি"}), 400
    
    file = request.files["audio"]
    voice_name = request.form.get("voice_name", "").strip() or "কাস্টম ভয়েস"
    
    if file.filename == "":
        return jsonify({"success": False, "error": "ফাইলের নাম খালি"}), 400
    
    if file and allowed_file(file.filename):
        voice_id = str(uuid.uuid4())[:8]
        safe_name = secure_filename(file.filename)
        temp_filename = f"raw_{voice_id}_{safe_name}"
        raw_path = UPLOAD_DIR / temp_filename
        
        file.save(str(raw_path))
        
        # XTTS এর জন্য অপ্টিমাইজড 24kHz WAV ফাইলে সংরক্ষণ
        clean_filename = f"voice_{voice_id}.wav"
        clean_path = UPLOAD_DIR / clean_filename
        
        try:
            preprocess_audio_file(str(raw_path), str(clean_path))
            # কাঁচা ফাইল মুছে ফেলা যায় অথবা ব্যাকআপ রাখা যায়
            if raw_path.exists():
                os.remove(raw_path)
        except Exception as e:
            # অডিও প্রসেসিং লাইব্রেরিতে সমস্যা হলে সরাসরি ফাইল ব্যবহার
            clean_path = raw_path
            clean_filename = temp_filename
            print(f"[!] অডিও প্রিপ্রসেসিং ফলব্যাক: {e}")

        # মেটাডাটা সংরক্ষণ
        voices = load_voice_metadata()
        voice_entry = {
            "id": voice_id,
            "name": voice_name,
            "filename": clean_filename,
            "path": str(clean_path),
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        voices.append(voice_entry)
        save_voice_metadata(voices)
        
        return jsonify({
            "success": True,
            "message": "ভয়েস সফলভাবে আপলোড ও স্থায়ীভাবে সংরক্ষণ করা হয়েছে!",
            "voice": voice_entry
        })
    
    return jsonify({"success": False, "error": "অসমর্থিত ফাইল ফরম্যাট। WAV, MP3, FLAC, M4A দিন।"}), 400

@app.route("/api/delete_voice/<voice_id>", methods=["DELETE"])
def delete_voice(voice_id):
    """নির্দিষ্ট ভয়েস প্রোফাইল মুছে ফেলে"""
    voices = load_voice_metadata()
    updated_voices = []
    deleted_voice = None
    
    for v in voices:
        if v["id"] == voice_id:
            deleted_voice = v
            # ফাইল মুছে ফেলা
            file_path = Path(v["path"])
            if file_path.exists():
                try:
                    os.remove(file_path)
                except Exception as e:
                    print(f"ফাইল মুছতে ত্রুটি: {e}")
        else:
            updated_voices.append(v)
            
    if deleted_voice:
        save_voice_metadata(updated_voices)
        return jsonify({"success": True, "message": "ভয়েস সফলভাবে মুছে ফেলা হয়েছে"})
    return jsonify({"success": False, "error": "ভয়েস পাওয়া যায়নি"}), 404

@app.route("/api/synthesize", methods=["POST"])
def synthesize():
    """
    বাংলা টেক্সট এবং নির্বাচিত ভয়েস থেকে অডিও তৈরি করে।
    """
    global tts_model
    data = request.get_json() or {}
    
    text = data.get("text", "").strip()
    voice_id = data.get("voice_id", "")
    language = data.get("language", "bn")  # ডিফল্ট বাংলা
    speed = float(data.get("speed", 1.0))
    temperature = float(data.get("temperature", 0.75))
    
    if not text:
        return jsonify({"success": False, "error": "অনুগ্রহ করে টেক্সট বক্সে কিছু বাংলা টেক্সট লিখুন"}), 400
        
    voices = load_voice_metadata()
    selected_voice = next((v for v in voices if v["id"] == voice_id), None)
    
    if not selected_voice:
        # কোনো ভয়েস সিলেক্ট না থাকলে প্রথম সংরক্ষিত ভয়েসটি নির্বাচন
        if voices:
            selected_voice = voices[0]
        else:
            return jsonify({"success": False, "error": "প্রথমে আপনার ১ মিনিটের একটি ভয়েস অডিও আপলোড করুন!"}), 400
            
    speaker_wav_path = selected_voice["path"]
    if not os.path.exists(speaker_wav_path):
        return jsonify({"success": False, "error": "ভয়েস রেফারেন্স অডিও ফাইলটি সার্ভারে পাওয়া যায়নি"}), 404

    try:
        # মডেল লোড নিশ্চিতকরণ
        if tts_model is None:
            init_model()
            
        output_filename = f"cloned_{voice_id}_{uuid.uuid4().hex[:6]}.wav"
        output_filepath = OUTPUT_DIR / output_filename
        
        print(f"[*] অডিও তৈরি শুরু: টেক্সট দৈর্ঘ্য={len(text)}, ভাষা={language}, স্পিকার={selected_voice['name']}")
        start_time = time.time()
        
        # XTTS-v2 এর মাধ্যমে ভয়েস ক্লোনিং সিন্থেসিস
        tts_model.tts_to_file(
            text=text,
            speaker_wav=speaker_wav_path,
            language=language,
            file_path=str(output_filepath),
            speed=speed,
            temperature=temperature
        )
        
        elapsed = time.time() - start_time
        print(f"[✓] অডিও সফলভাবে তৈরি হয়েছে! সময়: {elapsed:.2f} সেকেন্ড")
        
        return jsonify({
            "success": True,
            "message": "বাংলা অডিও সফলভাবে তৈরি হয়েছে!",
            "audio_url": f"/outputs/{output_filename}",
            "filename": output_filename,
            "generation_time": f"{elapsed:.2f}s",
            "voice_name": selected_voice["name"]
        })
        
    except Exception as e:
        print(f"[!] সিন্থেসিস ত্রুটি: {str(e)}")
        return jsonify({"success": False, "error": f"অডিও তৈরি করতে সমস্যা হয়েছে: {str(e)}"}), 500

@app.route("/outputs/<path:filename>")
def serve_output(filename):
    """তৈরিকৃত অডিও ফাইল প্লে বা ডাউনলোডের জন্য সরবরাহ করে"""
    return send_from_directory(OUTPUT_DIR, filename, as_attachment=False)

@app.route("/uploads/speakers/<path:filename>")
def serve_speaker(filename):
    """আপলোডকৃত স্পিকার অডিও ফাইল সরবরাহ করে"""
    return send_from_directory(UPLOAD_DIR, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\\n==========================================")
    print(f"  বাংলা ভয়েস ক্লোন সার্ভার চালু হচ্ছে...")
    print(f"  লোকাল লিঙ্ক: http://127.0.0.1:{port}")
    print(f"  ডিভাইস: {device.upper()}")
    print(f"==========================================\\n")
    # GitHub Codespaces এবং রিমোট অ্যাক্সেসের জন্য host='0.0.0.0'
    app.run(host="0.0.0.0", port=port, debug=False)
`;

export const REQUIREMENTS_TXT_CODE = `# Coqui XTTS-v2 বাংলা ভয়েস ক্লোনিং ডিপেনডেন্সি তালিকা
# GitHub Codespaces ও Linux GPU পরিবেশের জন্য অপ্টিমাইজড

Flask==3.0.3
Flask-Cors==4.0.1
Werkzeug==3.0.3

# PyTorch (GPU সাপোর্টের সাথে অথবা CPU ফলব্যাক)
torch>=2.1.2
torchaudio>=2.1.2

# কোকি টিটিএস কোর লাইব্রেরি
TTS>=0.22.0

# অডিও প্রসেসিং ও ফরম্যাট কনভার্সন
pydub>=0.25.1
soundfile>=0.12.1
scipy>=1.11.4
numpy>=1.24.3,<2.0.0

# মডেল ওজন ডাউনলোড এবং ইউটিলিটি
requests>=2.31.0
tqdm>=4.66.1

# বাংলা টেক্সট নরমালাইজার ও টোকেনাইজার সাপোর্ট
transformers>=4.38.0
tokenizers>=0.15.0
`;

export const INDEX_HTML_CODE = `<!DOCTYPE html>
<html lang="bn" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>বাংলা ভয়েস ক্লোনিং স্টুডিও | XTTS-v2</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Noto Sans Bengali & Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Noto Sans Bengali', sans-serif;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-full flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">

  <!-- টপ নেভিগেশন বার -->
  <header class="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
          ভ
        </div>
        <div>
          <span class="text-base font-bold text-white tracking-tight">বাংলা ভয়েস ক্লোনিং স্টুডিও</span>
          <span class="hidden sm:inline-block text-xs text-slate-400 ml-2 font-mono">XTTS-v2 Engine</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-400 font-mono hidden md:inline">GitHub Codespaces Ready</span>
        <a href="#upload-section" class="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors">
          নতুন ভয়েস আপলোড
        </a>
      </div>
    </div>
  </header>

  <!-- মূল কন্টেন্ট এরিয়া -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">

    <!-- গ্রিড লেআউট: বামে ভয়েস ফাইল ও ম্যানেজমেন্ট, ডানে বাংলা টেক্সট ও প্লেয়ার -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      <!-- বাম কলাম (৪ কলাম): ১ মিনিটের অডিও আপলোড ও সংরক্ষিত ভয়েসের তালিকা -->
      <div class="lg:col-span-5 space-y-6">

        <!-- কার্ড ১: ১ মিনিটের ভয়েস অডিও আপলোড -->
        <section id="upload-section" class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-white uppercase tracking-wider">১. আপনার ভয়েস আপলোড করুন</h2>
            <span class="text-xs text-cyan-400 font-mono">১ মিনিট রেকমেন্ডেড</span>
          </div>
          <p class="text-xs text-slate-400 mb-4 leading-relaxed">
            আপনার নিজের স্পষ্ট উচ্চারণের ৩০ সেকেন্ড থেকে ১ মিনিটের একটি অডিও ক্লিপ (WAV/MP3) আপলোড করুন। ব্যাকগ্রাউন্ডে কোনো শব্দ বা গান না থাকলে ক্লোনিং সবচেয়ে নিখুঁত হয়।
          </p>

          <form id="uploadForm" class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1">ভয়েসের নাম দিন</label>
              <input 
                type="text" 
                id="voiceNameInput" 
                placeholder="যেমন: আমার স্বাভাবিক কণ্ঠ / উপস্থাপনা" 
                class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              >
            </div>

            <!-- ড্রপজোন / ফাইল সিলেক্ট -->
            <div class="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-lg p-5 text-center cursor-pointer transition-colors bg-slate-950/50" id="dropArea">
              <input type="file" id="audioFileInput" accept=".wav,.mp3,.ogg,.flac,.m4a" class="hidden">
              <svg class="w-8 h-8 mx-auto text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <p class="text-xs font-medium text-slate-300" id="fileStatusText">অডিও ফাইল টেনে আনুন অথবা ক্লিক করে বেছে নিন</p>
              <p class="text-[11px] text-slate-500 mt-1">WAV, MP3, FLAC (সর্বোচ্চ ২৫MB)</p>
            </div>

            <button 
              type="submit" 
              id="uploadBtn" 
              class="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>স্থায়ীভাবে সেভ করুন</span>
            </button>
          </form>

          <div id="uploadAlert" class="mt-3 hidden text-xs p-2.5 rounded-lg border"></div>
        </section>

        <!-- কার্ড ২: স্থায়ীভাবে সংরক্ষিত ভয়েসের তালিকা -->
        <section class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-white uppercase tracking-wider">সংরক্ষিত ভয়েস প্রোফাইল</h2>
            <button id="refreshVoicesBtn" class="text-xs text-slate-400 hover:text-white transition-colors">রিফ্রেশ</button>
          </div>
          <p class="text-xs text-slate-400 mb-3">সিন্থেসিস করার জন্য নিচের যেকোনো একটি ভয়েস নির্বাচন করুন:</p>

          <div id="voicesList" class="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            <p class="text-xs text-slate-500 italic py-3 text-center">কোনো ভয়েস লোড হচ্ছে...</p>
          </div>
        </section>

      </div>

      <!-- ডান কলাম (৭ কলাম): বাংলা টেক্সট ইনপুট ও অডিও প্লেয়ার -->
      <div class="lg:col-span-7 space-y-6">

        <!-- কার্ড ৩: বাংলা টেক্সট ইনপুট ফর্ম -->
        <section class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-sm font-semibold text-white uppercase tracking-wider">২. বাংলা টেক্সট লিখুন</h2>
            <span id="charCounter" class="text-xs font-mono text-slate-400">০ অক্ষর</span>
          </div>
          <p class="text-xs text-slate-400 mb-3">
            আপনি যে কথাটি আপনার ক্লোন করা কণ্ঠে শুনতে চান, তা নিচে বাংলায় লিখুন:
          </p>

          <!-- কুইক স্যাম্পল বাংলা বাক্য -->
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span class="text-[11px] text-slate-500 py-1">নমুনা টেক্সট:</span>
            <button type="button" class="sample-text-btn text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
              আজকের দিনটি সত্যিই অসাধারণ এবং চমৎকার।
            </button>
            <button type="button" class="sample-text-btn text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
              বাংলা ভাষা আমাদের গৌরব ও প্রাণের স্পন্দন।
            </button>
            <button type="button" class="sample-text-btn text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
              প্রযুক্তির অগ্রযাত্রায় কৃত্রিম বুদ্ধিমত্তা আজ মানুষের কণ্ঠকেও নিখুঁতভাবে অনুকরণ করতে সক্ষম।
            </button>
          </div>

          <form id="synthForm" class="space-y-4">
            <textarea 
              id="banglaTextInput" 
              rows="5" 
              placeholder="এখানে আপনার বাংলা বাক্য বা অনুচ্ছেদটি লিখুন..." 
              class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-y leading-relaxed"
              required
            ></textarea>

            <!-- অতিরিক্ত টিউনিং কন্ট্রোল -->
            <div class="grid grid-cols-2 gap-4 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
              <div>
                <div class="flex justify-between text-xs text-slate-300 mb-1">
                  <span>কথার গতি (Speed)</span>
                  <span id="speedVal" class="font-mono text-cyan-400">1.0x</span>
                </div>
                <input type="range" id="speedSlider" min="0.7" max="1.4" step="0.05" value="1.0" class="w-full accent-cyan-500">
              </div>
              <div>
                <div class="flex justify-between text-xs text-slate-300 mb-1">
                  <span>উচ্চারণ গভীরতা (Temp)</span>
                  <span id="tempVal" class="font-mono text-cyan-400">0.75</span>
                </div>
                <input type="range" id="tempSlider" min="0.3" max="1.0" step="0.05" value="0.75" class="w-full accent-cyan-500">
              </div>
            </div>

            <!-- সাবমিট বাটন -->
            <button 
              type="submit" 
              id="synthBtn" 
              class="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
              <span>৩. ভয়েস তৈরি করুন (Generate Audio)</span>
            </button>
          </form>

          <!-- লোডিং স্ট্যাটাস বক্স -->
          <div id="loadingStatus" class="hidden mt-4 p-4 rounded-lg bg-slate-950 border border-cyan-900/50 flex items-center gap-3">
            <div class="animate-spin rounded-full h-5 w-5 border-2 border-cyan-500 border-t-transparent"></div>
            <div class="text-xs">
              <p class="font-semibold text-cyan-300">XTTS-v2 মডেলের মাধ্যমে বাংলা অডিও তৈরি হচ্ছে...</p>
              <p class="text-slate-400">আপনার কণ্ঠের রেফারেন্স মিলিয়ে অডিও রেন্ডার করা হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।</p>
            </div>
          </div>
        </section>

        <!-- কার্ড ৪: আউটপুট অডিও প্লেয়ার এবং ডাউনলোড -->
        <section id="resultSection" class="hidden bg-slate-900/90 border border-cyan-500/30 rounded-xl p-5 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              তৈরিকৃত বাংলা অডিও প্রস্তুত
            </h2>
            <span id="genTimeBadge" class="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2.5 py-1 rounded border border-cyan-800">2.4s</span>
          </div>

          <div class="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-4">
            <p class="text-xs text-slate-400 mb-2">ব্যবহৃত ভয়েস: <strong id="usedVoiceName" class="text-slate-200">কাস্টম ভয়েস</strong></p>
            <audio id="audioPlayer" controls class="w-full mt-2 accent-cyan-500"></audio>
          </div>

          <!-- ডাউনলোড বাটন -->
          <div class="flex items-center gap-3">
            <a 
              id="downloadBtn" 
              href="#" 
              download="bangla_cloned_voice.wav" 
              class="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>ডাউনলোড অডিও (Download WAV)</span>
            </a>
          </div>
        </section>

      </div>
    </div>
  </main>

  <footer class="border-t border-slate-800 py-6 text-center text-xs text-slate-500 mt-auto">
    <p>বাংলা ভয়েস ক্লোনিং সিস্টেম · Coqui XTTS-v2 & Flask ব্যাকএন্ড · ওপেন সোর্স ও প্রাইভেট</p>
  </footer>

  <script>
    // ক্লায়েন্ট-সাইড ইন্টারঅ্যাকশন লজিক
    let selectedVoiceId = null;
    let selectedFile = null;

    const dropArea = document.getElementById('dropArea');
    const audioFileInput = document.getElementById('audioFileInput');
    const fileStatusText = document.getElementById('fileStatusText');
    const uploadForm = document.getElementById('uploadForm');
    const uploadAlert = document.getElementById('uploadAlert');
    const voicesList = document.getElementById('voicesList');
    const synthForm = document.getElementById('synthForm');
    const banglaTextInput = document.getElementById('banglaTextInput');
    const charCounter = document.getElementById('charCounter');
    const speedSlider = document.getElementById('speedSlider');
    const speedVal = document.getElementById('speedVal');
    const tempSlider = document.getElementById('tempSlider');
    const tempVal = document.getElementById('tempVal');
    const loadingStatus = document.getElementById('loadingStatus');
    const resultSection = document.getElementById('resultSection');
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadBtn = document.getElementById('downloadBtn');
    const usedVoiceName = document.getElementById('usedVoiceName');
    const genTimeBadge = document.getElementById('genTimeBadge');

    // ফাইল ড্র্যাগ অ্যান্ড ড্রপ
    dropArea.addEventListener('click', () => audioFileInput.click());
    audioFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        fileStatusText.innerText = \`নির্বাচিত ফাইল: \${selectedFile.name} (\${(selectedFile.size / (1024*1024)).toFixed(2)} MB)\`;
        fileStatusText.classList.add('text-cyan-400');
      }
    });

    // টেক্সট কাউন্টার
    banglaTextInput.addEventListener('input', () => {
      charCounter.innerText = \`\${banglaTextInput.value.length} অক্ষর\`;
    });

    // স্লাইডার আপডেট
    speedSlider.addEventListener('input', () => speedVal.innerText = speedSlider.value + 'x');
    tempSlider.addEventListener('input', () => tempVal.innerText = tempSlider.value);

    // নমুনা টেক্সট বাটনে ক্লিক
    document.querySelectorAll('.sample-text-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        banglaTextInput.value = btn.innerText.trim();
        charCounter.innerText = \`\${banglaTextInput.value.length} অক্ষর\`;
      });
    });

    // সংরক্ষিত ভয়েস লোড ফাংশন
    async function loadVoices() {
      try {
        const res = await fetch('/api/voices');
        const data = await res.json();
        if (data.success && data.voices.length > 0) {
          voicesList.innerHTML = '';
          data.voices.forEach((v, index) => {
            const isSelected = selectedVoiceId === v.id || (!selectedVoiceId && index === 0);
            if (isSelected) selectedVoiceId = v.id;

            const div = document.createElement('div');
            div.className = \`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between \${
              isSelected ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }\`;
            div.innerHTML = \`
              <div class="flex items-center gap-2.5 truncate" onclick="selectVoice('\${v.id}')">
                <div class="w-3 h-3 rounded-full \${isSelected ? 'bg-cyan-400' : 'bg-slate-700'}"></div>
                <div class="truncate">
                  <p class="text-xs font-semibold text-slate-200 truncate">\${v.name}</p>
                  <p class="text-[10px] text-slate-500 font-mono">\${v.created_at}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <audio src="/uploads/speakers/\${v.filename}" preload="none"></audio>
                <button onclick="playSample('/uploads/speakers/\${v.filename}')" class="text-slate-400 hover:text-cyan-400 text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800" title="কণ্ঠ শুনুন">
                  শুনুন
                </button>
              </div>
            \`;
            voicesList.appendChild(div);
          });
        } else {
          voicesList.innerHTML = '<p class="text-xs text-slate-500 italic py-3 text-center">এখনো কোনো ভয়েস আপলোড করা হয়নি। উপরে ফাইল আপলোড করুন।</p>';
        }
      } catch (err) {
        voicesList.innerHTML = '<p class="text-xs text-rose-400 py-2 text-center">ভয়েস তালিকা লোড করতে ব্যর্থ</p>';
      }
    }

    function selectVoice(id) {
      selectedVoiceId = id;
      loadVoices();
    }

    function playSample(url) {
      const a = new Audio(url);
      a.play();
    }

    // ভয়েস আপলোড সাবমিট
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!selectedFile) {
        alert('অনুগ্রহ করে প্রথমে একটি অডিও ফাইল সিলেক্ট করুন');
        return;
      }
      const voiceName = document.getElementById('voiceNameInput').value;
      const formData = new FormData();
      formData.append('audio', selectedFile);
      formData.append('voice_name', voiceName);

      const submitBtn = document.getElementById('uploadBtn');
      submitBtn.disabled = true;
      submitBtn.innerText = 'আপলোড ও প্রসেসিং হচ্ছে...';

      try {
        const res = await fetch('/api/upload_voice', {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        uploadAlert.classList.remove('hidden');
        if (result.success) {
          uploadAlert.className = 'mt-3 text-xs p-2.5 rounded-lg border bg-emerald-950/50 border-emerald-800 text-emerald-300';
          uploadAlert.innerText = result.message;
          selectedVoiceId = result.voice.id;
          uploadForm.reset();
          selectedFile = null;
          fileStatusText.innerText = 'অডিও ফাইল টেনে আনুন অথবা ক্লিক করে বেছে নিন';
          fileStatusText.classList.remove('text-cyan-400');
          loadVoices();
        } else {
          uploadAlert.className = 'mt-3 text-xs p-2.5 rounded-lg border bg-rose-950/50 border-rose-800 text-rose-300';
          uploadAlert.innerText = result.error || 'আপলোড ব্যর্থ';
        }
      } catch (err) {
        uploadAlert.className = 'mt-3 text-xs p-2.5 rounded-lg border bg-rose-950/50 border-rose-800 text-rose-300';
        uploadAlert.innerText = 'সার্ভার যোগাযোগে সমস্যা হয়েছে।';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'স্থায়ীভাবে সেভ করুন';
      }
    });

    // বাংলা সিন্থেসিস সাবমিট
    synthForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = banglaTextInput.value.trim();
      if (!text) return;

      if (!selectedVoiceId) {
        alert('অনুগ্রহ করে বাম পাশ থেকে একটি ভয়েস সিলেক্ট বা আপলোড করুন');
        return;
      }

      const synthBtn = document.getElementById('synthBtn');
      synthBtn.disabled = true;
      loadingStatus.classList.remove('hidden');
      resultSection.classList.add('hidden');

      try {
        const res = await fetch('/api/synthesize', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            text: text,
            voice_id: selectedVoiceId,
            language: 'bn',
            speed: parseFloat(speedSlider.value),
            temperature: parseFloat(tempSlider.value)
          })
        });

        const result = await res.json();
        if (result.success) {
          audioPlayer.src = result.audio_url;
          downloadBtn.href = result.audio_url;
          downloadBtn.download = result.filename;
          usedVoiceName.innerText = result.voice_name;
          genTimeBadge.innerText = result.generation_time;
          resultSection.classList.remove('hidden');
          audioPlayer.play();
        } else {
          alert('ত্রুটি: ' + (result.error || 'অডিও তৈরি করা যায়নি'));
        }
      } catch (err) {
        alert('সার্ভার যোগাযোগে সমস্যা হয়েছে। ব্যাকএন্ড চালু আছে কি না পরীক্ষা করুন।');
      } finally {
        synthBtn.disabled = false;
        loadingStatus.classList.add('hidden');
      }
    });

    // ইনিশিয়াল লোড
    document.getElementById('refreshVoicesBtn').addEventListener('click', loadVoices);
    loadVoices();
  </script>
</body>
</html>
`;

export const DEVCONTAINER_JSON_CODE = `{
  "name": "Bengali Voice Clone Codespace (XTTS-v2)",
  "image": "mcr.microsoft.com/devcontainers/python:3.10-bookworm",
  "features": {
    "ghcr.io/devcontainers/features/nvidia-cuda:1": {
      "installCuda": true
    }
  },
  "postCreateCommand": "sudo apt-get update && sudo apt-get install -y ffmpeg libsndfile1 && pip install --upgrade pip && pip install -r requirements.txt",
  "forwardPorts": [5000],
  "portsAttributes": {
    "5000": {
      "label": "Bangla Voice Cloning Studio",
      "onAutoForward": "openBrowser"
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance"
      ]
    }
  }
}
`;

export const README_MD_CODE = `# বাংলা ভয়েস ক্লোনিং ফ্লাস্ক প্রজেক্ট (XTTS-v2 Voice Cloning)

এই প্রজেক্টটিতে Coqui XTTS-v2 জিরো-শট ভয়েস ক্লোনিং মডেল এবং Python Flask ব্যবহার করে একটি সম্পূর্ণ ওয়েব অ্যাপ্লিকেশন তৈরি করা হয়েছে। এখানে আপনি নিজের ১ মিনিটের পরিষ্কার অডিও আপলোড করে স্থায়ীভাবে সংরক্ষণ করতে পারবেন এবং যেকোনো বাংলা টেক্সট লিখে সেই কণ্ঠস্বরে তাৎক্ষণিক অডিও তৈরি ও ডাউনলোড করতে পারবেন।

---

## 📁 প্রজেক্ট স্ট্রাকচার

\`\`\`
bengali-voice-cloning/
├── app.py                     # মূল Flask ব্যাকএন্ড ও XTTS-v2 মডেল হ্যান্ডলার
├── requirements.txt           # প্রয়োজনীয় পাইথন প্যাকেজ তালিকা
├── templates/
│   └── index.html             # আধুনিক বাংলা ওয়েব ইন্টারফেস (Tailwind CSS)
├── uploads/
│   └── speakers/              # আপনার আপলোডকৃত স্থায়ী ভয়েস ফাইল
├── outputs/                   # তৈরিকৃত বাংলা অডিও ফাইল
└── .devcontainer/
    └── devcontainer.json      # GitHub Codespaces এর জন্য অটো-কনফিগ
\`\`\`

---

## 🚀 GitHub Codespaces-এ চালানোর নিয়ম (ধাপে ধাপে)

GitHub Codespaces-এ এই প্রজেক্ট চালানো খুবই সহজ:

### ধাপ ১: রিপোজিটরি তৈরি ও Codespaces ওপেন করুন
1. GitHub-এ একটি নতুন রিপোজিটরি খুলুন এবং এই প্রজেক্টের ফাইলগুলো পুশ করুন (অথবা ডাউনলোড করা জিপ ফাইল আপলোড করুন)।
2. রিপোজিটরির সবুজ **Code** বাটনে ক্লিক করে **Codespaces** ট্যাবে যান এবং **Create codespace on main** নির্বাচন করুন।
*(পরামর্শ: সম্ভব হলে GPU সম্বলিত Codespace মেশিন নির্বাচন করুন, তাহলে ভয়েস ক্লোনিং ৩-৫ সেকেন্ডে হয়ে যাবে। CPU মেশিনেও কাজ করবে তবে ১৫-৩০ সেকেন্ড লাগতে পারে।)*

### ধাপ ২: প্রয়োজনীয় সিস্টেম লাইব্রেরি ইনস্টল করুন
Codespaces-এর টার্মিনালে নিচের কমান্ডটি রান করুন:
\`\`\`bash
sudo apt update && sudo apt install -y ffmpeg libsndfile1
\`\`\`

### ধাপ ৩: পাইথন প্যাকেজ ইনস্টল করুন
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### ধাপ ৪: Flask অ্যাপ্লিকেশন চালু করুন
\`\`\`bash
python app.py
\`\`\`
*(প্রথমবার চালু হওয়ার সময় XTTS-v2 মডেলের ওজন ফাইল স্বয়ংক্রিয়ভাবে ডাউনলোড হবে, এতে ১-২ মিনিট সময় লাগতে পারে।)*

### ধাপ ৫: ব্রাউজারে অ্যাপ ওপেন করুন
- Codespaces স্বয়ংক্রিয়ভাবে পোর্ট \`5000\` ফরওয়ার্ড করবে এবং নিচে একটি পপআপ দেখাবে: **"Open in Browser"**।
- পপআপে ক্লিক করুন অথবা Codespaces-এর **PORTS** ট্যাবে গিয়ে 5000 পোর্টের পাশে গ্লোব আইকনে ক্লিক করুন।
- ইন্টারফেসে আপনার ১ মিনিটের অডিও আপলোড করুন, বাংলা লিখুন এবং "ভয়েস তৈরি করুন" বাটনে চাপ দিন!

---

## 💡 সেরা ভয়েস ক্লোনিংয়ের জন্য টিপস (১ মিনিটের অডিও)
1. **পরিষ্কার ও নিঃশব্দ পরিবেশ**: রেকর্ডিংয়ের সময় ফ্যান, ট্রাফিক বা এসির কোনো ব্যাকগ্রাউন্ড নয়েজ যেন না থাকে।
2. **স্বাভাবিক কথা বলার ছন্দ**: কোনো বই বা সংবাদ ধীরে ধীরে এবং স্বাভাবিক উচ্চারণে পড়ুন।
3. **ফর্ম্যাট**: WAV বা MP3 ফরম্যাটে আপলোড করুন। অ্যাপ স্বয়ংক্রিয়ভাবে এটিকে 24kHz মনো ফাইলে প্রসেস করে সংরক্ষণ করবে।
`;

export const PROJECT_FILES: ProjectFile[] = [
  {
    name: "app.py",
    path: "/app.py",
    language: "python",
    descriptionBn: "প্রধান Flask ব্যাকএন্ড: অডিও সংরক্ষণ, XTTS-v2 বাংলা মডেল লোডিং ও সিন্থেসিস API",
    descriptionEn: "Main Flask backend: audio storage, XTTS-v2 Bengali model loading and synthesis API",
    content: APP_PY_CODE
  },
  {
    name: "requirements.txt",
    path: "/requirements.txt",
    language: "text",
    descriptionBn: "পাইথন লাইব্রেরি ও ডিপেনডেন্সি তালিকা (TTS, PyTorch, Torchaudio, Flask)",
    descriptionEn: "Python dependencies pinned for GitHub Codespaces and Linux GPU",
    content: REQUIREMENTS_TXT_CODE
  },
  {
    name: "templates/index.html",
    path: "/templates/index.html",
    language: "html",
    descriptionBn: "স্ট্যান্ডঅ্যালন এইচটিএমএল ওয়েব ইন্টারফেস: অডিও আপলোড, বাংলা টেক্সট বক্স, প্লেয়ার ও ডাউনলোড",
    descriptionEn: "Complete standalone web UI with audio upload, Bangla text box, audio player & download",
    content: INDEX_HTML_CODE
  },
  {
    name: ".devcontainer/devcontainer.json",
    path: "/.devcontainer/devcontainer.json",
    language: "json",
    descriptionBn: "GitHub Codespaces এক-ক্লিকে GPU ও ডিপেনডেন্সি অটো-সেটআপ কনফিগারেশন",
    descriptionEn: "GitHub Codespaces 1-click devcontainer configuration with CUDA & port forwarding",
    content: DEVCONTAINER_JSON_CODE
  },
  {
    name: "README.md",
    path: "/README.md",
    language: "markdown",
    descriptionBn: "সম্পূর্ণ বাংলায় Codespaces ও লোকাল সার্ভারে চালানোর গাইড ও অডিও টিপস",
    descriptionEn: "Step-by-step Bengali execution guide for GitHub Codespaces and voice dataset tips",
    content: README_MD_CODE
  }
];
