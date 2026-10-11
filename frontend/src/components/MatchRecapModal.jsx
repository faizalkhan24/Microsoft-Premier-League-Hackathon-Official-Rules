import React from 'react';
import { X, Award, CheckCircle2, FileText, Download } from 'lucide-react';

export default function MatchRecapModal({ recapData, isOpen, onClose }) {
  if (!isOpen || !recapData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-pl-card border-2 border-pl-cyan rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-pl-cyan text-xs font-bold uppercase tracking-wider mb-2">
          <Award className="w-4 h-4" />
          <span>Automated Studio Match Recap</span>
        </div>

        <h2 className="text-xl font-bold text-white font-display mb-3">
          {recapData.title}
        </h2>

        <div className="space-y-4 text-xs text-slate-200">
          <div className="bg-pl-dark/80 border border-pl-border rounded-xl p-3 leading-relaxed">
            <strong className="text-pl-cyan block mb-1">Executive Summary:</strong>
            {recapData.summary}
          </div>

          <div>
            <strong className="text-slate-300 block mb-2 font-bold uppercase tracking-wider text-[11px]">
              Key Turning Points & Milestones:
            </strong>
            <div className="space-y-1.5">
              {recapData.key_milestones?.map((m, idx) => (
                <div key={idx} className="flex items-start space-x-2 bg-pl-dark/60 p-2 rounded-lg border border-pl-border/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-pl-cyan mt-0.5 flex-shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-pl-dark/80 border border-pl-border rounded-xl p-3 leading-relaxed">
            <strong className="text-amber-400 block mb-1">Tactical Verdict:</strong>
            {recapData.tactical_verdict}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(recapData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'premier-league-match-recap.json';
              a.click();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-slate-600 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Recap JSON</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-pl-cyan hover:bg-emerald-400 text-pl-dark font-extrabold rounded-xl text-xs transition shadow-lg"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
