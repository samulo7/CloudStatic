import { useState } from 'react';

interface ImageLinkActionsProps {
  url: string;
  width: number;
  height: number;
  alt?: string;
}

type CopyFormat = 'Markdown' | 'HTML' | 'URL';

export default function ImageLinkActions({ url, width, height, alt = 'image' }: ImageLinkActionsProps) {
  const [status, setStatus] = useState<string>('');

  const formats: Array<{ label: CopyFormat; value: string }> = [
    { label: 'Markdown', value: `![${alt}](${url})` },
    { label: 'HTML', value: `<img src="${url}" alt="${alt}" width="${width}" height="${height}" loading="lazy">` },
    { label: 'URL', value: url },
  ];

  async function copyText(label: CopyFormat, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label} copied`);
    } catch {
      setStatus('Copy failed');
    }
  }

  return (
    <div className="copy-actions" aria-live="polite">
      <div className="copy-button-row">
        {formats.map((format) => (
          <button key={format.label} type="button" onClick={() => copyText(format.label, format.value)}>
            Copy {format.label}
          </button>
        ))}
      </div>
      {status && <p className="copy-status">{status}</p>}
    </div>
  );
}
