import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Modality } from '@google/genai';

// --- Constants & Config ---
const DEV_IMAGE = "https://itzshibrul.netlify.app/assets/images/profile.jpg";
const DEV_PORTFOLIO = "https://itzshibrul.netlify.app/";

const SUPPORTED_LANGUAGES = [
  { code: 'English', name: 'English (US)', flag: '🇺🇸' },
  { code: 'Bengali', name: 'Bengali (BD)', flag: '🇧🇩' },
  { code: 'Spanish', name: 'Spanish', flag: '🇪🇸' },
  { code: 'French', name: 'French', flag: '🇫🇷' },
  { code: 'German', name: 'German', flag: '🇩🇪' },
  { code: 'Hindi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'Arabic', name: 'Arabic', flag: '🇸🇦' },
  { code: 'Mandarin', name: 'Chinese', flag: '🇨🇳' },
  { code: 'Japanese', name: 'Japanese', flag: '🇯🇵' },
];

const THEMES = {
  Midnight: { primary: 'indigo-600', secondary: 'indigo-950', accent: 'indigo-400', bg: 'bg-[#020617]', glass: 'bg-white/5', hex: '#4f46e5' },
  Sakura: { primary: 'pink-500', secondary: 'pink-900', accent: 'pink-400', bg: 'bg-[#1a0b12]', glass: 'bg-pink-500/10', hex: '#ec4899' },
  Emerald: { primary: 'emerald-600', secondary: 'emerald-950', accent: 'emerald-400', bg: 'bg-[#061a11]', glass: 'bg-emerald-500/10', hex: '#10b981' },
  Cyber: { primary: 'fuchsia-600', secondary: 'purple-950', accent: 'cyan-400', bg: 'bg-[#0f051a]', glass: 'bg-purple-500/10', hex: '#c026d3' },
  Classic: { primary: 'slate-700', secondary: 'slate-900', accent: 'slate-400', bg: 'bg-[#0f172a]', glass: 'bg-slate-500/10', hex: '#334155' },
};

// --- Audio Utilities ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

function createBlob(data: Float32Array) {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

// --- Components ---

const AppDetailsModal = ({ onClose, theme }: { onClose: () => void, theme: keyof typeof THEMES }) => {
  const colors = THEMES[theme];
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`glass max-w-2xl w-full p-8 rounded-[2.5rem] border-${colors.accent}/30 shadow-2xl relative overflow-hidden text-left`}>
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <i className="fas fa-times"></i>
        </button>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
          <i className={`fas fa-circle-info text-${colors.accent}`}></i> About LinguoBD
        </h2>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
            <h3 className={`text-${colors.accent} font-black uppercase text-xs tracking-widest mb-2`}>English Details</h3>
            <p className="text-gray-300 leading-relaxed font-medium">
              <span className="text-[#10b981] font-bold">LinguoBD</span> is a high-performance live translation application designed for seamless communication. Built by <span className="text-white">MD Shibrul Alom</span>, it uses Gemini 2.5 Flash Native Audio for instant, real-time speech translation.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
            <h3 className={`text-${colors.accent} font-black uppercase text-xs tracking-widest mb-2`}>বাংলা বিস্তারিত (Bengali)</h3>
            <p className="text-gray-300 leading-relaxed font-medium">
              <span className="text-[#10b981] font-bold">LinguoBD</span> হলো একটি উচ্চ-ক্ষমতাসম্পন্ন লাইভ অনুবাদ অ্যাপ্লিকেশন যা তাৎক্ষণিক রিয়েল-টাইম অনুবাদ প্রদান করে। এটি এমডি শিবরুল আলম দ্বারা বাংলাদেশের মানুষের জন্য তৈরি করা হয়েছে।
            </p>
          </div>
          <div className="flex items-center gap-4 pt-4">
            <img src={DEV_IMAGE} className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover" alt="Dev" />
            <div>
              <p className="text-white font-bold text-sm">MD Shibrul Alom</p>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Developer of this tools</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OnboardingModal = ({ onClose, theme }: { onClose: () => void, theme: keyof typeof THEMES }) => {
  const [step, setStep] = useState(1);
  const colors = THEMES[theme];
  const handleFinish = () => { localStorage.setItem('linguo_onboarded', 'true'); onClose(); };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className={`glass max-w-lg w-full p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border-${colors.accent}/40 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden`}>
        <div className={`absolute top-8 flex gap-2`}>
          {[1, 2, 3].map(i => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${step === i ? 'w-12 bg-' + colors.primary : 'w-3 bg-white/10'}`}></div>)}
        </div>
        {step === 1 && (
          <div className="animate-in pt-8">
            <img src={DEV_IMAGE} alt="Dev" className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-${colors.primary} mb-6 object-cover mx-auto`} />
            <h2 className="text-3xl font-black text-white mb-2">MD Shibrul Alom</h2>
            <p className={`text-${colors.accent} font-black mb-4 uppercase text-[10px]`}>Developer of this tools</p>
            <p className="text-gray-300 italic mb-8">"I built this app for my <span className="text-emerald-500 font-black">Bangladesh</span> as an expression of love."</p>
            <button onClick={() => setStep(2)} className={`w-full bg-${colors.primary} text-white font-black py-4 rounded-3xl shadow-2xl`}>Check Features</button>
          </div>
        )}
        {step === 2 && (
          <div className="animate-in pt-8 w-full">
            <h2 className="text-2xl font-black text-white mb-6">App Mastery</h2>
            <div className="space-y-3 mb-8 text-left">
              <div className="p-4 bg-white/5 rounded-2xl">Smart Song & Outdoor Modes</div>
              <div className="p-4 bg-white/5 rounded-2xl">Location Language Sync</div>
              <div className="p-4 bg-white/5 rounded-2xl">Zero-Latency Audio Stream</div>
            </div>
            <button onClick={() => setStep(3)} className={`w-full bg-${colors.primary} text-white font-black py-4 rounded-3xl shadow-xl`}>Final Step</button>
          </div>
        )}
        {step === 3 && (
          <div className="animate-in pt-8">
            <div className="text-7xl mb-8 animate-bounce">🇧🇩 🌍</div>
            <h2 className="text-2xl font-black text-white mb-3">Love for BD</h2>
            <p className="text-gray-400 mb-10">Direct Voice link is ready. High accuracy.</p>
            <button onClick={handleFinish} className={`w-full bg-${colors.primary} text-white font-black py-4 rounded-3xl shadow-2xl uppercase tracking-[0.2em]`}>Launch Now</button>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [theme, setTheme] = useState<keyof typeof THEMES>('Midnight');
  const [status, setStatus] = useState('DISCONNECTED');
  const [langA, setLangA] = useState(SUPPORTED_LANGUAGES[1]); // Bengali
  const [langB, setLangB] = useState(SUPPORTED_LANGUAGES[0]); // English
  const [mode, setMode] = useState('CONVERSATION');
  const [noiseGuard, setNoiseGuard] = useState(true);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAppDetails, setShowAppDetails] = useState(false);

  const audioInRef = useRef<AudioContext | null>(null);
  const audioOutRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef('');
  const outputRef = useRef('');

  const colors = THEMES[theme];

  useEffect(() => {
    if (!localStorage.getItem('linguo_onboarded')) setShowOnboarding(true);
  }, []);

  useEffect(() => { inputRef.current = currentInput; }, [currentInput]);
  useEffect(() => { outputRef.current = currentOutput; }, [currentOutput]);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcriptions, currentInput, currentOutput]);

  const speakText = (text: string, langName: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langName.includes('Bengali') ? 'bn-BD' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const startSession = async () => {
    try {
      setStatus('CONNECTING');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      audioInRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: noiseGuard } });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          systemInstruction: `You are a PURE TRANSLATION ENGINE. STRICT: Only direct translation from ${langA.name} to ${langB.name} or vice-versa. NO SYMOPATHY. NO SMALL TALK.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus('CONNECTED');
            const source = audioInRef.current!.createMediaStreamSource(stream);
            const processor = audioInRef.current!.createScriptProcessor(2048, 1, 1);
            processor.onaudioprocess = (e) => {
              const data = e.inputBuffer.getChannelData(0);
              sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(data) }));
            };
            source.connect(processor);
            processor.connect(audioInRef.current!.destination);
            (window as any)._stream = stream; (window as any)._proc = processor;
          },
          onmessage: async (msg) => {
            if (msg.serverContent?.inputTranscription) setCurrentInput(prev => prev + msg.serverContent!.inputTranscription!.text);
            if (msg.serverContent?.outputTranscription) setCurrentOutput(prev => prev + msg.serverContent!.outputTranscription!.text);
            if (msg.serverContent?.turnComplete) {
              const i = inputRef.current, o = outputRef.current;
              if (i || o) setTranscriptions(prev => [...prev, { role: 'user', text: i }, { role: 'model', text: o }]);
              setCurrentInput(''); setCurrentOutput('');
            }
            const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64 && audioOutRef.current) {
              const ctx = audioOutRef.current;
              nextStartRef.current = Math.max(nextStartRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
              const source = ctx.createBufferSource(); source.buffer = buffer; source.connect(ctx.destination);
              source.start(nextStartRef.current); nextStartRef.current += buffer.duration;
            }
          },
          onerror: () => setStatus('ERROR'),
          onclose: () => setStatus('DISCONNECTED')
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { setStatus('ERROR'); }
  };

  const stopSession = () => { sessionRef.current?.close(); setStatus('DISCONNECTED'); };

  return (
    <div className={`min-h-screen flex flex-col p-4 md:p-10 max-w-7xl mx-auto ${colors.bg} text-white transition-colors duration-1000`}>
      {showOnboarding && <OnboardingModal theme={theme} onClose={() => setShowOnboarding(false)} />}
      {showAppDetails && <AppDetailsModal theme={theme} onClose={() => setShowAppDetails(false)} />}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-${colors.primary} to-${colors.secondary} rounded-3xl flex items-center justify-center shadow-2xl`}><i className="fas fa-bolt-lightning text-3xl"></i></div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-1">LinguoBD</h1>
            <p className={`text-[10px] font-black text-${colors.accent} uppercase tracking-[0.5em] px-2 py-0.5 bg-${colors.primary}/10 rounded-full border border-${colors.primary}/10 inline-block`}>ITZSHIBRUL ENGINE</p>
          </div>
        </div>
        <div className="flex items-center gap-4 self-end md:self-auto">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-indigo-400 uppercase mb-1">Love for BD</span>
              <a href={DEV_PORTFOLIO} target="_blank" rel="noopener noreferrer" className="text-xl font-black">MD Shibrul Alom</a>
              <button onClick={() => setShowAppDetails(true)} className="text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 bg-white/5 rounded-full border border-white/5 mt-2">Details / বিস্তারিত</button>
           </div>
           <img src={DEV_IMAGE} className={`w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-${colors.primary} p-1 object-cover`} alt="itzshibrul" />
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className={`${colors.glass} rounded-full p-2 flex gap-2 border border-white/5`}>
          {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(t => <button key={t} onClick={() => setTheme(t)} className={`w-8 h-8 rounded-full border-2 ${theme === t ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50'} transition-all`} style={{ backgroundColor: THEMES[t].hex }}></button>)}
        </div>
        <div className={`${colors.glass} rounded-3xl p-3 flex-1 flex justify-around border border-white/5`}>
           {['CONVERSATION', 'OUTDOOR', 'SONG'].map(m => <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === m ? 'bg-' + colors.primary : 'text-gray-500'}`}>{m}</button>)}
        </div>
        <div className={`${colors.glass} rounded-3xl p-3 flex items-center gap-4 px-6 border border-white/5`}>
           <i className={`fas fa-shield-halved ${noiseGuard ? 'text-' + colors.accent : 'text-gray-600'}`}></i>
           <button onClick={() => setNoiseGuard(!noiseGuard)} className={`w-10 h-5 rounded-full relative ${noiseGuard ? 'bg-' + colors.primary : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${noiseGuard ? 'right-0.5' : 'left-0.5'}`}></div>
           </button>
        </div>
      </div>
      <main className={`${colors.glass} rounded-[3rem] p-6 md:p-12 mb-10 flex-1 flex flex-col shadow-2xl relative bg-white/5`}>
        <div className="flex items-center justify-between gap-4 mb-10 bg-black/40 p-6 rounded-[2.5rem]">
          <div className="flex-1 flex flex-col items-center">
            <div className="text-5xl md:text-7xl mb-2">{langA.flag}</div>
            <select value={langA.code} onChange={e => setLangA(SUPPORTED_LANGUAGES.find(l => l.code === e.target.value)!)} className="bg-transparent font-black text-xs uppercase tracking-widest text-center w-full outline-none">
              {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-slate-900">{l.name}</option>)}
            </select>
          </div>
          <button onClick={() => { const t = langA; setLangA(langB); setLangB(t); }} className={`w-14 h-14 md:w-20 md:h-20 rounded-full bg-${colors.primary} flex items-center justify-center border border-white/20 hover:rotate-180 transition-all shadow-2xl group shrink-0`}>
            <i className="fas fa-shuffle text-white text-xl"></i>
          </button>
          <div className="flex-1 flex flex-col items-center">
            <div className="text-5xl md:text-7xl mb-2">{langB.flag}</div>
            <select value={langB.code} onChange={e => setLangB(SUPPORTED_LANGUAGES.find(l => l.code === e.target.value)!)} className="bg-transparent font-black text-xs uppercase tracking-widest text-center w-full outline-none">
              {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-slate-900">{l.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-8 px-2 custom-scrollbar pb-10">
          {transcriptions.length === 0 && !currentInput && !currentOutput && (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
              <i className={`fas fa-microphone-lines text-8xl text-${colors.accent} mb-8 animate-pulse`}></i>
              <h2 className="text-3xl font-black tracking-tight">Direct Link Ready</h2>
              <p className="text-sm font-medium">Strict translation-only mode active. No conversation.</p>
            </div>
          )}
          {transcriptions.map((item, idx) => (
            <div key={idx} className={`flex ${item.role === 'user' ? 'justify-start' : 'justify-end'} animate-in`}>
              <div className={`max-w-[85%] p-6 rounded-[2.5rem] shadow-2xl border relative ${item.role === 'user' ? 'bg-white/5 border-white/10 rounded-tl-none' : 'bg-' + colors.primary + ' border-white/20 rounded-tr-none'}`}>
                <div className="flex items-center justify-between mb-3 opacity-60">
                   <span className="text-[10px] font-black uppercase tracking-widest">{item.role === 'user' ? 'Input' : 'Output'}</span>
                   <button onClick={() => speakText(item.text, item.role === 'user' ? langA.name : langB.name)}><i className="fas fa-volume-high text-xs"></i></button>
                </div>
                <p className="text-xl md:text-2xl font-bold">{item.text || "..."}</p>
              </div>
            </div>
          ))}
          {currentInput && <div className="flex justify-start opacity-60 italic text-xl p-6 bg-white/5 rounded-2xl">... {currentInput}</div>}
          {currentOutput && <div className="flex justify-end opacity-60 italic text-xl p-6 bg-indigo-900/30 rounded-2xl text-right">... {currentOutput}</div>}
          <div ref={scrollRef} />
        </div>
      </main>
      <footer className="flex flex-col items-center gap-8 py-8">
        <button onClick={status === 'CONNECTED' ? stopSession : startSession} disabled={status === 'CONNECTING'} className={`group relative w-28 h-28 md:w-36 md:h-36 rounded-[3rem] md:rounded-[4rem] flex items-center justify-center transition-all transform active:scale-95 ${status === 'CONNECTED' ? 'bg-rose-600' : 'bg-' + colors.primary}`}>
          {status === 'CONNECTED' ? <i className="fas fa-stop text-4xl"></i> : <i className="fas fa-microphone-alt text-4xl"></i>}
          {status === 'CONNECTED' && <div className="absolute inset-[-15px] rounded-[4rem] border-4 border-rose-500/30 animate-ping"></div>}
        </button>
        <div className="text-center">
           <h3 className="text-white font-black uppercase tracking-[0.4em] text-xs mb-2">{status === 'CONNECTED' ? 'Translating Direct' : status === 'CONNECTING' ? 'Establishing Link...' : 'Tap to Connect Live'}</h3>
           <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Universal Link • Direct Voice Stream • Built for Love BD</p>
        </div>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
