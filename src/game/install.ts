export type InstallPlatform = 'installed' | 'ios' | 'android' | 'desktop';

export interface InstallGuideInfo {
  platform: InstallPlatform;
  headline: string;
  bengaliSummary: string;
  steps: string[];
  supportsOffline: boolean;
}

export function detectInstallPlatform(
  userAgent: string,
  isStandalone: boolean
): InstallPlatform {
  if (isStandalone) return 'installed';
  const ua = (userAgent || '').toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

export function getInstallInstructions(
  platform: InstallPlatform,
  inIframe: boolean
): InstallGuideInfo {
  if (platform === 'installed') {
    return {
      platform,
      headline: 'App Installed',
      bengaliSummary: 'গেমটি ইতিমধ্যে অ্যাপ হিসেবে ইনস্টল করা আছে — এখন ফুল-স্ক্রিন ও অফলাইনে খেলা যাবে।',
      steps: [
        'NaBil-BOT: Cyber Protocol is already installed and ready for offline play.',
      ],
      supportsOffline: true,
    };
  }

  if (platform === 'ios') {
    const steps: string[] = [];
    if (inIframe) {
      steps.push('Tap "Open Full Game Tab" below to open the game directly in Safari.');
    }
    steps.push('Tap the Share icon in the Safari toolbar.');
    steps.push('Scroll down and tap "Add to Home Screen", then tap "Add".');
    return {
      platform,
      headline: 'Download & Install on iPhone / iPad',
      bengaliSummary: 'iPhone/iPad-এ ইনস্টল করতে নিচের "Open Full Game Tab" খুলে Share → Add to Home Screen চাপুন, বা লঞ্চার ফাইল ডাউনলোড করুন।',
      steps,
      supportsOffline: true,
    };
  }

  if (platform === 'android') {
    const steps: string[] = [];
    if (inIframe) {
      steps.push('Tap "Open Full Game Tab" below so Chrome can trigger direct app install.');
    }
    steps.push('Tap the Chrome menu (⋮) in the top-right corner.');
    steps.push('Tap "Install app" or "Add to Home screen" and confirm.');
    return {
      platform,
      headline: 'Download & Install on Android',
      bengaliSummary: 'ফোনে সরাসরি ডাউনলোড করতে নিচে "Download Game File" চাপুন, অথবা "Open Full Game Tab" খুলে Chrome মেনু (⋮) → "Install app" দিন।',
      steps,
      supportsOffline: true,
    };
  }

  const steps: string[] = [];
  if (inIframe) {
    steps.push('Click "Open Full Game Tab" below to launch outside the embedded preview.');
  }
  steps.push('Click the Install icon in the right side of the Chrome or Edge address bar.');
  steps.push('Or open browser menu (⋮) → "Apps" / "Save and share" → "Install NaBil-BOT".');
  return {
    platform,
    headline: 'Download & Install on PC / Mac',
    bengaliSummary: 'পিসিতে ডাউনলোড করতে "Download Game File" চাপুন অথবা "Open Full Game Tab" খুলে এড্রেস বার থেকে অ্যাপ ইনস্টল করুন।',
    steps,
    supportsOffline: true,
  };
}

export function buildStandaloneInstallUrl(origin: string): string {
  const cleanOrigin = (origin || '').replace(/\/+$/, '');
  if (!cleanOrigin) return '/';
  return `${cleanOrigin}/`;
}

export function sanitizeLauncherUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '/';
  if (trimmed === '/') return '/';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return '/';
  } catch {
    return '/';
  }
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildPlayableLauncherHtml(gameUrl: string): string {
  const safeUrl = sanitizeLauncherUrl(gameUrl);
  const attrUrl = escapeHtmlAttr(safeUrl);
  const jsonUrl = JSON.stringify(safeUrl).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NaBil-BOT: Cyber Protocol — Game Launcher</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at top, #0c1b2e 0%, #05060a 70%);
        color: #e2e8f0;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        padding: 20px;
      }
      .card {
        max-width: 460px;
        width: 100%;
        background: rgba(10, 18, 32, 0.94);
        border: 1px solid rgba(34, 211, 238, 0.45);
        border-radius: 16px;
        padding: 28px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 243, 255, 0.16);
      }
      .badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #22d3ee;
        background: rgba(34, 211, 238, 0.12);
        border: 1px solid rgba(34, 211, 238, 0.35);
        padding: 4px 10px;
        border-radius: 6px;
      }
      h1 {
        margin: 14px 0 8px;
        font-size: 24px;
        letter-spacing: 0.04em;
        color: #ffffff;
      }
      p {
        margin: 0 0 20px;
        font-size: 14px;
        line-height: 1.5;
        color: #94a3b8;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        box-sizing: border-box;
        padding: 13px 18px;
        border-radius: 10px;
        background: #22d3ee;
        color: #020617;
        font-weight: 800;
        font-size: 14px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        text-decoration: none;
      }
      .btn:hover { background: #67e8f9; }
      .sub {
        margin-top: 14px;
        font-size: 12px;
        color: #64748b;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="badge">CYBER PROTOCOL · LAUNCHER</div>
      <h1>NaBil-BOT</h1>
      <p>Launching NaBil-BOT: Cyber Protocol in full screen. If it does not open automatically, click Launch Game below.</p>
      <a class="btn" href="${attrUrl}" rel="noopener noreferrer">Launch NaBil-BOT Game</a>
      <div class="sub">${attrUrl}</div>
    </main>
    <script>
      (function () {
        var target = ${jsonUrl};
        if (target && target !== '/') {
          window.setTimeout(function () {
            window.location.replace(target);
          }, 250);
        }
      })();
    </script>
  </body>
</html>
`;
}
