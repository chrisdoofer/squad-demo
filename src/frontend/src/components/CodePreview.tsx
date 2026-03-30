import { useState } from 'react';

interface CodePreviewProps {
  code: string;
  language: string;
}

function CodePreview({ code, language }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        // Clipboard API not available — silent fallback
      },
    );
  };

  return (
    <div className="code-preview">
      <div className="code-header">
        <span className="code-language">{language}</span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleCopy}
          type="button"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code-block">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default CodePreview;
