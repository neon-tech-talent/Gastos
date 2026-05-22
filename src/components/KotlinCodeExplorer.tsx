/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KOTLIN_PROJECT_FILES } from '../data/kotlinCode';
import { Copy, Check, FileCode, HardDrive, Terminal, BookOpen, Layers } from 'lucide-react';

export default function KotlinCodeExplorer() {
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = KOTLIN_PROJECT_FILES[selectedFileIdx];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div id="kotlin-code-explorer" className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full text-slate-300 font-sans">
      
      {/* Header and Branding */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center select-none">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <FileCode size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 tracking-tight leading-tight">Arquitectura Android Kotlin</h3>
            <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">Jetpack Compose + MVVM + Room Offline</span>
          </div>
        </div>

        {/* Action controls */}
        <button
          id="copy-kotlin-code-btn"
          onClick={handleCopyCode}
          className="px-3.5 py-1.5 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              <span className="text-emerald-300">¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={13} className="text-slate-400" />
              <span>Copiar Clase</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="bg-slate-950/60 flex space-x-1 p-2 border-b border-slate-800/60 overflow-x-auto scrollbar-none select-none">
        {KOTLIN_PROJECT_FILES.map((file, idx) => (
          <button
            id={`kotlin-file-tab-${idx}`}
            key={idx}
            onClick={() => {
              setSelectedFileIdx(idx);
              setCopied(false);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
              selectedFileIdx === idx 
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/45'
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>

      {/* File Path representation bar */}
      <div className="bg-slate-900/60 px-5 py-2.5 border-b border-slate-800/30 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
        <span className="truncate">Ruta: <span className="text-slate-300 font-bold">{activeFile.path}</span></span>
        <span className="text-xxs uppercase font-bold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded shrink-0">
          {activeFile.language}
        </span>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto bg-slate-950/80 p-5 font-mono text-[11px] leading-relaxed select-text scrollbar-thin">
        <pre className="text-emerald-400/90 hover:text-emerald-300 transition-colors whitespace-pre overflow-x-auto">
          <code>{activeFile.content}</code>
        </pre>
      </div>

      {/* Instructions / Metafooter footer */}
      <div className="bg-slate-950/95 p-4 border-t border-slate-800/80 select-none">
        <div className="flex items-start space-x-3 text-xs text-slate-400 leading-normal">
          <BookOpen size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="font-medium text-slate-300">
            <span className="font-extrabold text-slate-100 block mb-0.5">Guía de integración en Android Studio:</span>
            Para usar este código, crea los paquetes requeridos e importa las dependencias de <code className="text-emerald-400 bg-slate-900 px-1 rounded">Room</code>, <code className="text-emerald-400 bg-slate-900 px-1 rounded">Navigation-Compose</code> y <code className="text-emerald-400 bg-slate-900 px-1 rounded">Material 3</code> en tu archivo gradle. La persistencia es 100% offline y almacena la información de forma segura en SQLite interna.
          </div>
        </div>
      </div>

    </div>
  );
}
