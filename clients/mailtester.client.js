import axios from 'axios';
import { config } from '../config/env.js';
import { getMailtesterKey } from './key.client.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Verifies an email address using MailTester Ninja.
 * Enforces a minimum delay between calls via the rate limiter.
 *
 * @param {string} email The email address to verify.
 * @returns {Promise<{email: string, code: string|null, message: string|null, raw: any, error?: string}>}
 */
export async function verifyEmail(email) {
  try {
    // Obtain a fresh API key allocation for every verification.
    const keyInfo = await getMailtesterKey();
    const key = keyInfo.key;
    if (!key) {
      throw new Error('Missing MailTester key');
    }

    const nextAllowedAt = toNumber(keyInfo.nextRequestAllowedAt);
    const avgIntervalMs = toNumber(keyInfo.avgRequestIntervalMs) ?? 0;
    const waitUntilMs = nextAllowedAt ? Math.max(0, nextAllowedAt - Date.now()) : 0;
    const waitMs = Math.max(waitUntilMs, avgIntervalMs);
    if (waitMs > 0) {
      console.log('[MailTester] Waiting before verification', {
        email,
        key,
        waitMs,
        avgRequestIntervalMs: avgIntervalMs,
        nextRequestAllowedAt: nextAllowedAt,
      });
      await sleep(waitMs);
    }

    // Prepare the request URL with encoded query parameters.
    const url = `${config.mailTesterBaseUrl}?email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}`;
    console.log('[MailTester] Requesting verification', {
      email,
      url,
      key,
      avgRequestIntervalMs: keyInfo.avgRequestIntervalMs,
      nextRequestAllowedAt: keyInfo.nextRequestAllowedAt,
    });
    const response = await axios.get(url);
    const data = response.data || {};

    console.log('[MailTester] Response received', { email, code: data.code, message: data.message });

    return {
      email,
      code: data.code || null,
      message: data.message || null,
      raw: data,
    };
  } catch (error) {
    console.error('[MailTester] Verification failed', { email, error: error.message, response: error.response?.data });
    // Capture any error, including HTTP errors, and include in returned object.
    return {
      email,
      code: null,
      message: null,
      raw: error.response?.data,
      error: error.message,
    };
  }
}