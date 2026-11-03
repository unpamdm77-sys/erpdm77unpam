import React, { useState } from 'react';
import { Globe, X, Check, Copy, ExternalLink, Terminal, CheckCircle2, ArrowRight } from 'lucide-react';

interface VercelDeployModalProps {
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({ onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black">
              ▲
            </div>
            <div>
              <h3 className="font-bold text-base">Konfigurasi Online Vercel.app</h3>
              <p className="text-xs text-slate-400">Siap online gratis & otomatis di Vercel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto bg-slate-50">
          {/* Status Badge */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-3 text-emerald-800">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">File `vercel.json` Telah Selesai Dibuat!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Konfigurasi SPA routing, rewrite, build Vite, dan dist directory sudah terkonfigurasi optimal.
              </p>
            </div>
          </div>

          {/* Metode 1: GitHub to Vercel (Paling Mudah) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                <span>Cara 1: Deploy Otomatis via GitHub (Rekomendasi)</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Paling Praktis</span>
            </div>

            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
              <li>Push / simpan project ini ke repository akun <strong>GitHub</strong> Anda.</li>
              <li>Buka website <strong>vercel.com</strong> dan login dengan akun GitHub Anda.</li>
              <li>Klik tombol <strong>"Add New..." &gt; "Project"</strong>, lalu klik <strong>"Import"</strong> pada repository project ini.</li>
              <li>Vercel akan otomatis mendeteksi framework <strong>Vite</strong> dan membaca file <strong>vercel.json</strong>.</li>
              <li>Klik tombol <strong>"Deploy"</strong>. Website akan online dalam ~30 detik di domain <code>*.vercel.app</code>!</li>
            </ol>

            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              <span>Buka Vercel Dashboard</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Metode 2: CLI Terminal */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                <span>Cara 2: Deploy Cepat via Terminal (Vercel CLI)</span>
              </span>
              <Terminal size={16} className="text-slate-400" />
            </div>

            <p className="text-[11px] text-slate-600">
              Jalankan perintah ini di terminal / command prompt komputer Anda pada folder project:
            </p>

            <div className="flex items-center justify-between bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px]">
              <span>npx vercel --prod</span>
              <button
                onClick={() => copyCommand('npx vercel --prod')}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-sans font-bold"
              >
                {copiedCmd ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCmd ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Detail File vercel.json */}
          <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
            <p className="font-bold text-slate-800 text-[11px]">Rangkuman Isi vercel.json yang Terpasang:</p>
            <pre className="text-[10px] font-mono text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 overflow-x-auto">
{`{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`}
            </pre>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
