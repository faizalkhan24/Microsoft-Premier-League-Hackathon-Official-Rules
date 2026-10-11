import React from 'react';
import { Globe } from 'lucide-react';

export default function MultiLanguageTicker({ insights, currentLang, onSelectLang }) {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
  ];

  const isRtl = currentLang === 'ar';
  const filtered = insights.filter((i) => i.language === currentLang || (!i.language && currentLang === 'en'));
  const latestInsight = filtered.length > 0 ? filtered[filtered.length - 1] : null;

  return (
    <div className="w-full bg-pl-card border border-pl-border rounded-xl p-3 shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Language Selector */}
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Globe className="w-4 h-4 text-pl-cyan" />
        <span className="text-xs font-bold text-slate-300 mr-1">BROADCAST AUDIO / TEXT:</span>
        <div className="flex items-center space-x-1">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => onSelectLang(l.code)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                currentLang === l.code
                  ? 'bg-pl-cyan text-pl-dark border-pl-cyan'
                  : 'bg-pl-dark/80 text-slate-400 border-pl-border hover:text-white'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live Commentary Ticker with RTL support */}
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="flex-1 w-full bg-pl-dark/80 px-3 py-1.5 rounded-lg border border-pl-border/60 text-xs overflow-hidden flex items-center space-x-2"
      >
        <span className="w-2 h-2 rounded-full bg-pl-cyan animate-ping flex-shrink-0 mx-1"></span>
        <p className={`text-slate-200 truncate ${isRtl ? 'font-serif text-[13px]' : 'font-sans'}`}>
          {latestInsight ? (
            <span>
              <strong className="text-pl-cyan mx-1.5">[{latestInsight.minute}']</strong>
              {latestInsight.content}
            </span>
          ) : (
            <span className="text-slate-400 italic">Listening for live multilingual feed...</span>
          )}
        </p>
      </div>
    </div>
  );
}
