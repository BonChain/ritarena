import { useState } from 'preact/hooks';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export function AgentConnect() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = SERVER_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div class="azw-agent-connect">
      <div class="azw-agent-connect-title">Agent Server</div>
      <div class="azw-agent-connect-row">
        <code class="azw-agent-url">{SERVER_URL}</code>
        <button
          class={`azw-copy-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy URL"
        >
          {copied ? '✓' : '📋'}
        </button>
      </div>
      <div class="azw-agent-connect-hint">Connect agents here</div>
    </div>
  );
}
