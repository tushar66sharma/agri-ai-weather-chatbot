import React, { useEffect, useRef, useState } from 'react';

export default function MicCapture({ onTranscript, onFinal, language = 'ja' }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }

    const r = new SpeechRecognition();
    const langMap = { ja: 'ja-JP', en: 'en-US', hi: 'hi-IN' };
    r.lang = langMap[language] || 'ja-JP';
    r.interimResults = true;
    r.continuous = false;

    let finalTranscript = '';

    r.onstart = () => { finalTranscript = ''; setListening(true); if (onTranscript) onTranscript(''); };

    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      const composed = (finalTranscript + interim).trim();
      if (onTranscript) onTranscript(composed);
    };

    r.onend = () => {
      setListening(false);
      const finalText = (finalTranscript || '').trim();
      if (onFinal) onFinal(finalText);
      if (onTranscript) onTranscript(finalText);
      finalTranscript = '';
    };

    r.onerror = (ev) => {
      console.error('SpeechRecognition error', ev);
      setListening(false);
      const finalText = (finalTranscript || '').trim();
      if (onFinal) onFinal(finalText);
      if (onTranscript) onTranscript(finalText);
      finalTranscript = '';
    };

    recognitionRef.current = r;
    return () => { try { recognitionRef.current?.stop(); } catch(e) {} };
  }, [language, onTranscript, onFinal]);

  const startStop = () => {
    const r = recognitionRef.current; if (!r) return;
    if (listening) { try { r.stop(); } catch(e){console.warn(e);} setListening(false); return; }
    try { r.start(); } catch(err) { console.warn('start failed', err); alert('Mic failed — allow microphone'); }
  };

  if (!supported) return <div className="text-sm text-red-600">Speech recognition not supported — use Chrome.</div>;

  const label = listening
    ? (language === 'ja'? '録音中 — 停止' : (language === 'hi' ? 'रिकॉर्डिंग — रोकें' : 'Recording — Stop'))
    : (language === 'ja' ? 'マイクをオン (日本語)' : (language === 'hi' ? 'माइक चालू करें (हिंदी)' : 'Mic On (English)'));

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={startStop}
        className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors duration-150 focus:outline-none ${
          listening ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        aria-pressed={listening}
      >
        {label}
      </button>

      <div className="text-sm text-gray-600 flex items-center gap-3">
        <div className="min-w-[48px]">
          {listening ? (
            <span aria-hidden className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full animate-pulse bg-white/90 shadow"></span>
              <span className="text-xs">Listening</span>
            </span>
          ) : (
            <span className="text-xs muted">Click to speak ({language})</span>
          )}
        </div>
      </div>
    </div>
  );
}
