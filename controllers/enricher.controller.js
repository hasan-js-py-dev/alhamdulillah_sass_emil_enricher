import { enrichContacts } from '../services/enricher.service.js';

/**
 * Controller to handle POST /v1/scraper/enricher/start requests.
 * Validates the input and returns enriched contact results.
 */
export async function startEnricher(req, res) {
  const { contacts } = req.body;
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: 'contacts array is required' });
  }
  try {
    const results = await enrichContacts(contacts);
    return res.json({ results });
  } catch (error) {
    console.error('Enricher controller error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}