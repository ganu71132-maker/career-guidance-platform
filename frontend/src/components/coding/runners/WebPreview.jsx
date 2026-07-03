import React, { useEffect, useRef } from 'react';

export default function WebPreview({ html, css }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    const documentContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>${css}</style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    const iframe = iframeRef.current;
    const blob = new Blob([documentContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    
    iframe.src = blobUrl;

    return () => {
      URL.revokeObjectURL(blobUrl);
    };
  }, [html, css]);

  return (
    <div className="w-full h-full bg-white rounded-xl overflow-hidden border border-slate-700/50">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="Live Preview"
        sandbox="allow-scripts allow-modals allow-popups"
      />
    </div>
  );
}
