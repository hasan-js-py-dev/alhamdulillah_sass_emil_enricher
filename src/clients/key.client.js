import axios from 'axios';
import { config } from '../config/env.js';

// Simple in-memory cache for the MailTester key.  The key provider is called
// only once per process lifetime.  Subsequent calls return the cached key.
let cachedKeyInfo = null;

/**
 * Fetches a MailTester subscription key from the internal key provider.
 * Caches the key for subsequent calls.
 *
 * @returns {Promise<{key: string, subscriptionId?: string, plan?: string}>}
 */
export async function getMailtesterKey() {
  if (cachedKeyInfo) {
    return cachedKeyInfo;
  }
  try {
    const response = await axios.get(config.keyProviderUrl);
    // The API returns an object with a `key` field (and maybe other fields).
    cachedKeyInfo = response.data;
    return cachedKeyInfo;
  } catch (error) {
    // Provide a clear error for upstream handlers.
    throw new Error(`Failed to retrieve MailTester key: ${error.message}`);
  }
}