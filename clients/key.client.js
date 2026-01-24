import axios from 'axios';
import { config } from '../config/env.js';

const WAIT_FALLBACK_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractWaitDuration(payload) {
  const rawDelay =
    payload?.waitForMs ??
    payload?.waitMs ??
    payload?.retryAfterMs ??
    payload?.retryInMs ??
    payload?.nextRequestAllowedInMs;
  const parsed = Number(rawDelay);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : WAIT_FALLBACK_MS;
}

function extractKey(data) {
  const candidate = Array.isArray(data?.keys) && data.keys.length > 0 ? data.keys[0] : data;
  const rawKey = candidate?.key ?? candidate?.subscriptionId ?? candidate?.id;
  if (!rawKey) {
    return null;
  }
  return String(rawKey).replace(/[{}]/g, '').trim();
}

/**
 * Fetches a MailTester subscription key from the key-rotation microservice.
 * Always retrieves a fresh allocation and respects "wait" instructions.
 *
 * @returns {Promise<{key: string, status?: string, avgRequestIntervalMs?: number, nextRequestAllowedAt?: string}>}
 */
export async function getMailtesterKey() {
  while (true) {
    try {
      const response = await axios.get(config.keyProviderUrl);
      const payload = response.data || {};
      const normalizedKey = extractKey(payload);
      const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : null;

      if (status === 'wait') {
        const waitMs = extractWaitDuration(payload);
        console.log('[KeyClient] Rotation service asked us to wait', { waitMs });
        await sleep(waitMs);
        continue;
      }

      if (!normalizedKey) {
        throw new Error('Key provider response missing subscription key');
      }

      return {
        ...payload,
        key: normalizedKey,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve MailTester key: ${error.message}`);
    }
  }
}