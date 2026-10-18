import React, { useState } from 'react';
import { QrCode, Copy, Check, ExternalLink } from 'lucide-react';

/**
 * Resilient QR Code Display Component with multi-gateway failover and offline fallback.
 * 1st attempt: api.qrserver.com
 * 2nd attempt: quickchart.io
 * Offline fallback: Clean vector representation with 1-click copy & open link
 */
export default function QrCodeDisplay({
  data,
  size = 200,
  alt = 'QR Code',
  showCopyButton = false,
  copyLabel = 'Copy Link',
  style = {},
}) {
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prevData, setPrevData] = useState(data);

  if (data !== prevData) {
    setPrevData(data);
    setGatewayIndex(0);
    setHasFailedAll(false);
  }

  const gateways = [
    (url, s) => `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&margin=8&data=${encodeURIComponent(url)}`,
    (url, s) => `https://quickchart.io/qr?size=${s}&text=${encodeURIComponent(url)}`,
  ];

  const handleImageError = () => {
    if (gatewayIndex + 1 < gateways.length) {
      setGatewayIndex(prev => prev + 1);
    } else {
      setHasFailedAll(true);
    }
  };

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return null;

  if (hasFailedAll) {
    return (
      <div 
        style={{
          width: `${size}px`,
          minHeight: `${size}px`,
          padding: '16px',
          borderRadius: '14px',
          background: '#f8fafc',
          border: '1.5px dashed var(--border-medium)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          boxSizing: 'border-box',
          ...style
        }}
      >
        <div style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>
          <QrCode size={40} />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
          Offline / Local Link
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', maxWidth: '160px', wordBreak: 'break-all' }}>
          External QR service unavailable offline.
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            style={{ fontSize: '11px', padding: '4px 8px', height: '26px' }}
          >
            {copied ? <Check size={12} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy URL'}</span>
          </button>
          {data.startsWith('http') && (
            <a
              href={data}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '4px 8px', height: '26px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ExternalLink size={12} />
              <span>Open</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  const currentSrc = gateways[gatewayIndex](data, size);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', ...style }}>
      <img
        src={currentSrc}
        alt={alt}
        onError={handleImageError}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'block',
          borderRadius: '8px',
          imageRendering: 'crisp-edges',
        }}
      />
      {showCopyButton && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleCopy}
          style={{ marginTop: '8px', fontSize: '11px', height: '26px', gap: '4px' }}
        >
          {copied ? <Check size={12} style={{ color: 'var(--color-emerald)' }} /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : copyLabel}</span>
        </button>
      )}
    </div>
  );
}
