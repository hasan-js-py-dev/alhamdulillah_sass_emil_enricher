import { generatePatterns } from '../utils/emailPatterns.js';
import { verifyEmail } from '../clients/mailtester.client.js';
import { processContactsInBatches } from './comboProcessor.service.js';

const MAX_COMBOS = 8;

/**
 * Processes a collection of contacts using the batch combo processor and normalizes
 * the final response payload for API consumers.
 *
 * @param {Array<{firstName: string, lastName: string, domain: string}>} contacts
 * @param {{ onResult?: (result: object) => Promise<void>|void }} [options]
 * @returns {Promise<Array<object>>}
 */
export async function enrichContacts(contacts, options = {}) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return [];
  }

  const processed = await processContactsInBatches(contacts, {
    verifyEmail,
    generatePatterns,
    maxCombos: MAX_COMBOS,
    onResult: options.onResult,
  });

  return processed.map((entry) => ({
    firstName: entry.contact.firstName,
    lastName: entry.contact.lastName,
    domain: entry.contact.domain,
    bestEmail: entry.bestEmail,
    status: entry.status,
    details: entry.details,
    allCheckedCandidates: entry.resultsPerCombo,
  }));
}