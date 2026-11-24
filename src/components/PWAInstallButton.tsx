import React, { useState } from 'react';
import {
  Download,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  X,
  WifiOff,
  FileDown,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { buildPlayableLauncherHtml, getInstallInstructions } from '../game/install';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'primary' | 'modal-action';
  label?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  label,
}) => {
  const { isInstallable, isInstalled, platform, inIframe, installUrl, install } =
    usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadedFile, setDownloadedFile] = useState(false);

  if (isInstalled && !inIframe) {
    return null;
  }

  const guide = getInstallInstructions(platform, inIframe);

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(installUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked in restricted sandbox
    }
  };

  const handleDownloadLauncher = () => {
    try {
      const html = buildPlayableLauncherHtml(installUrl);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'NaBil-BOT-Cyber-Protocol.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      setDownloadedFile(true);
    } catch {
      // Fallback handled by server route link
      window.location.assign('/api/download-launcher');
    }
  };

  const buttonText =
    label || (isInstallable ? 'Install App' : variant === 'primary' ? 'Download Game / App' : 'Download');

  const buttonClassName =
    variant === 'primary'
      ? 'pointer-events-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-950 via-slate-900 to-emerald-950 hover:from-cyan-900 hover:to-emerald-900 text-cyan-200 border border-cyan-400/75 hover:border-cyan-300 font-bold text-xs sm:text-sm tracking-wider uppercase rounded shadow-[0_0_18px_rgba(0,243,255,0.28)] transition-all cursor-pointer whitespace-nowrap shrink-0'
      : variant === 'modal-action'
      ? 'w-full py-3 bg-cyan-950/90 hover:bg-cyan-900 text-cyan-200 border border-cyan-400/70 hover:border-cyan-300 font-bold text-sm uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer'
      : 'px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/25 to-emerald-500/20 hover:from-cyan-500/40 hover:to-emerald-500/35 text-cyan-100 border border-cyan-300/80 hover:border-cyan-200 font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_14px_rgba(0,243,255,0.3)] whitespace-nowrap shrink-0';

  return (
    <>
      <button
        type="button"
        data-testid={variant === 'compact' ? 'pwa-install-btn' : `pwa-install-btn-${variant}`}
        onClick={handleClick}
        className={buttonClassName}
        aria-label="Download or Install NaBil-BOT Game"
        title={
          isInstallable
            ? 'Install NaBil-BOT App directly'
            : 'Download NaBil-BOT Game / Install on Mobile or PC'
        }
      >
        <Download className="w-4 h-4 shrink-0 text-cyan-300" />
        <span>{buttonText}</span>
      </button>

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-dialog-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/88 p-4 pointer-events-auto"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-slate-900 border border-cyan-500/50 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="pwa-install-dialog-title"
                    className="text-base font-bold text-white"
                  >
                    {guide.headline}
                  </h2>
                  <p className="text-xs text-slate-400">
                    NaBil-BOT: Cyber Protocol · App &amp; Launcher
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close download guide"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 rounded-lg bg-cyan-950/50 border border-cyan-400/35 px-3 py-2 text-xs text-cyan-100 leading-relaxed">
              {guide.bengaliSummary}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {isInstallable && (
                <button
                  type="button"
                  data-testid="pwa-native-install-trigger"
                  onClick={install}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now (1-Tap)</span>
                </button>
              )}

              <button
                type="button"
                data-testid="download-launcher-file-btn"
                onClick={handleDownloadLauncher}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-[0_0_14px_rgba(16,185,129,0.3)]"
              >
                <FileDown className="w-4 h-4 shrink-0" />
                <span>Download Game File (.html Launcher)</span>
              </button>

              {downloadedFile && (
                <div
                  data-testid="download-launcher-confirmed"
                  className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-lg px-3 py-2"
                >
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    Downloaded <strong>NaBil-BOT-Cyber-Protocol.html</strong>! Open it from Downloads to launch anytime.
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/25 rounded-lg px-3 py-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>PWA installation supports offline play &amp; full-screen launch.</span>
            </div>

            <ol className="mt-3 space-y-2 text-xs sm:text-sm text-slate-200">
              {guide.steps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 rounded-lg bg-slate-950/70 border border-slate-800 px-3 py-2"
                >
                  <span className="font-mono text-xs font-bold text-cyan-400 mt-0.5 shrink-0">
                    0{index + 1}.
                  </span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <a
                href={installUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Open Full Game Tab</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
