import { generatePatterns } from '../utils/emailPatterns.js';
import { verifyEmail } from '../clients/mailtester.client.js';
import { processContactsInBatches } from './comboProcessor.service.js';
import { DELIVERY_STATUS } from './upload/status.utils.js';

const MAX_COMBOS = 8;

/**
 * Processes contacts with dual-domain support.
 * D1 = contact.domain (Website), D2 = contact.domain2 (Website_one, optional).
 *
 * Precedence:
 *   D1 valid          -> return immediately (Valid, Website)
 *   D1 catch-all      -> try D2 if available:
 *       D2 valid      -> return D2 email (Valid, Website_one)
 *       D2 else       -> return firstname@D1 (CatchAll, Website)
 *   D1 not-found      -> try D2 if available:
 *       D2 valid      -> return D2 email (Valid, Website_one)
 *       D2 catch-all  -> return D2 catch-all email (CatchAll, Website_one)
 *       D2 not-found  -> return Not Found
 *
 * @param {Array<{firstName: string, lastName: string, domain: string, domain2?: string, rowId?: number}>} contacts
 * @param {{ onResult?: (result: object) => Promise<void>|void }} [options]
 * @returns {Promise<Array<object>>}
 */
export async function enrichContacts(contacts, options = {}) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return [];
  }

  const dualDomainRowIds = new Set(
    contacts.filter((c) => c.domain2).map((c) => c.rowId),
  );

  const finalResults = new Array(contacts.length);

  // Phase 1: Process ALL contacts with D1 (primary domain).
  // For dual-domain contacts with non-valid D1, we buffer the result and do NOT stream yet.
  const d1ResultsByRowId = new Map();

  const d1OnResult = async (result) => {
    const rowId = result?.contact?.rowId;

    if (dualDomainRowIds.has(rowId)) {
      d1ResultsByRowId.set(rowId, result);

      // D1 valid on a dual-domain contact: final answer, stream immediately.
      if (result.status === DELIVERY_STATUS.VALID) {
        if (options.onResult) {
          await options.onResult({
            ...result,
            domainUsed: 'Website',
            notes: '',
          });
        }
      }
      // Non-valid D1 dual-domain: wait for Phase 2 before streaming.
    } else {
      // Single-domain contact: stream immediately.
      if (options.onResult) {
        await options.onResult({
          ...result,
          domainUsed: 'Website',
          notes: '',
        });
      }
    }
  };

  const d1Processed = await processContactsInBatches(contacts, {
    verifyEmail,
    generatePatterns,
    maxCombos: MAX_COMBOS,
    onResult: d1OnResult,
  });

  // Classify D1 results.
  const d2Candidates = [];

  contacts.forEach((contact, index) => {
    const d1Result = d1Processed[index];

    if (!contact.domain2 || d1Result.status === DELIVERY_STATUS.VALID) {
      finalResults[index] = {
        ...formatResult(d1Result),
        domainUsed: 'Website',
        notes: '',
      };
    } else {
      d2Candidates.push({ originalIndex: index, contact, d1Result });
    }
  });

  // Phase 2: Process dual-domain contacts that need D2 fallback.
  if (d2Candidates.length > 0) {
    const d2Contacts = d2Candidates.map(({ contact }) => ({
      ...contact,
      domain: contact.domain2,
    }));

    const d2Processed = await processContactsInBatches(d2Contacts, {
      verifyEmail,
      generatePatterns,
      maxCombos: MAX_COMBOS,
    });

    for (let i = 0; i < d2Candidates.length; i++) {
      const { originalIndex, contact, d1Result } = d2Candidates[i];
      const d2Result = d2Processed[i];

      const merged = applyDualDomainPrecedence(contact, d1Result, d2Result);
      finalResults[originalIndex] = merged;

      if (options.onResult) {
        await options.onResult({
          contact,
          bestEmail: merged.bestEmail,
          status: merged.status,
          details: merged.details,
          resultsPerCombo: merged.allCheckedCandidates || [],
          domainUsed: merged.domainUsed,
          notes: merged.notes,
        });
      }
    }
  }

  return finalResults;
}

function applyDualDomainPrecedence(originalContact, d1Result, d2Result) {
  const d1Status = d1Result.status;
  const d2Status = d2Result?.status;
  const base = {
    firstName: originalContact.firstName,
    lastName: originalContact.lastName,
    domain: originalContact.domain,
  };

  if (d1Status === DELIVERY_STATUS.CATCH_ALL) {
    if (d2Status === DELIVERY_STATUS.VALID) {
      return {
        ...base,
        bestEmail: d2Result.bestEmail,
        status: DELIVERY_STATUS.VALID,
        details: d2Result.details,
        allCheckedCandidates: [...d1Result.resultsPerCombo, ...d2Result.resultsPerCombo],
        domainUsed: 'Website_one',
        notes: 'Valid email found on second domain',
      };
    }
    return {
      ...base,
      bestEmail: d1Result.bestEmail,
      status: DELIVERY_STATUS.CATCH_ALL,
      details: { reason: 'Primary domain catch-all; second domain did not yield valid email' },
      allCheckedCandidates: [
        ...d1Result.resultsPerCombo,
        ...(d2Result?.resultsPerCombo || []),
      ],
      domainUsed: 'Website',
      notes: 'Catch-all on primary domain; second domain did not resolve',
    };
  }

  // D1 was NOT_FOUND (MX missing, timeout, all combos rejected).
  if (d2Status === DELIVERY_STATUS.VALID) {
    return {
      ...base,
      bestEmail: d2Result.bestEmail,
      status: DELIVERY_STATUS.VALID,
      details: d2Result.details,
      allCheckedCandidates: [...d1Result.resultsPerCombo, ...d2Result.resultsPerCombo],
      domainUsed: 'Website_one',
      notes: 'Valid email found on second domain',
    };
  }

  if (d2Status === DELIVERY_STATUS.CATCH_ALL) {
    return {
      ...base,
      bestEmail: d2Result.bestEmail,
      status: DELIVERY_STATUS.CATCH_ALL,
      details: d2Result.details,
      allCheckedCandidates: [...d1Result.resultsPerCombo, ...d2Result.resultsPerCombo],
      domainUsed: 'Website_one',
      notes: 'Primary domain not found; second domain is catch-all',
    };
  }

  return {
    ...base,
    bestEmail: null,
    status: DELIVERY_STATUS.NOT_FOUND,
    details: { reason: 'No valid email found on either domain' },
    allCheckedCandidates: [
      ...d1Result.resultsPerCombo,
      ...(d2Result?.resultsPerCombo || []),
    ],
    domainUsed: '',
    notes: 'Both domains exhausted',
  };
}

function formatResult(entry) {
  return {
    firstName: entry.contact.firstName,
    lastName: entry.contact.lastName,
    domain: entry.contact.domain,
    bestEmail: entry.bestEmail,
    status: entry.status,
    details: entry.details,
    allCheckedCandidates: entry.resultsPerCombo,
  };
}
