import type {HiapiRequest} from '../contracts/types.js';

export interface PreflightSummary {
  endpoint: string;
  method: 'POST';
  requestId: string;
  model: string;
  purpose: HiapiRequest['purpose'];
  bodyBytes: number;
  bodySha256: string;
}

export interface PreparedHiapiRequest {
  request: HiapiRequest;
  baseUrl: string;
  endpoint: string;
  preflightToken: string;
  requestHash: string;
  summary: PreflightSummary;
}

export interface HiapiClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

export interface PollConfig extends HiapiClientConfig {
  pollIntervalMs?: number;
  pollTimeoutMs?: number;
  retries?: number;
}

export interface PendingJournal {
  schemaVersion: 'hiapi-pending-v1';
  state: 'pending_submit';
  endpoint: string;
  preflightToken: string;
  requestHash: string;
  apiIdentityBinding: string;
  firstAttemptAt: string;
  retrySafeUntil: string;
}

export interface DownloadResult {
  destination: string;
  bytes: number;
  sha256: string;
}
