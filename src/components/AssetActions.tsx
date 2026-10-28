'use client';

import { useState } from 'react';
import type { AnalyzeResponse } from '@/lib/types';

interface AssetActionsProps {
  analysis: AnalyzeResponse;
}

type ReportStatus = 'idle' | 'loading' | 'error';

export default function AssetActions({ analysis }: AssetActionsProps) {
  const [copied, setCopied] = useState(false);
  const [reportStatus, setReportStatus] = useState<ReportStatus>('idle');

  async function handleCopy() {
    const link = window.location.href;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', link);
    }
  }

  async function handleReport() {
    setReportStatus('loading');

    try {
      const { downloadReport } = await import('@/lib/report');
      await downloadReport(analysis);
      setReportStatus('idle');
    } catch (error) {
      console.error('Report generation failed:', error);
      setReportStatus('error');
      window.setTimeout(() => setReportStatus('idle'), 3000);
    }
  }

  return (
    <div className="asset-actions">
      <button
        type="button"
        className="action-button"
        onClick={handleCopy}
        aria-live="polite"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <button
        type="button"
        className="action-button primary"
        onClick={handleReport}
        disabled={reportStatus === 'loading'}
        aria-live="polite"
      >
        {reportStatus === 'loading'
          ? 'Building PDF…'
          : reportStatus === 'error'
            ? 'Report failed'
            : 'Download report'}
      </button>
    </div>
  );
}
