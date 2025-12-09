export const DELIVERY_STATUS = {
  VALID: 'valid',
  CATCH_ALL: 'catch_all',
  NOT_FOUND: 'not_found',
};

const STATUS_ALIAS_MAP = new Map([
  ['valid', DELIVERY_STATUS.VALID],
  ['catch_all', DELIVERY_STATUS.CATCH_ALL],
  ['catchall', DELIVERY_STATUS.CATCH_ALL],
  ['catchall_default', DELIVERY_STATUS.CATCH_ALL],
  ['catch-all', DELIVERY_STATUS.CATCH_ALL],
  ['not_found', DELIVERY_STATUS.NOT_FOUND],
  ['not_found_valid_emails', DELIVERY_STATUS.NOT_FOUND],
  ['valid_email_not_found', DELIVERY_STATUS.NOT_FOUND],
  ['mx_not_found', DELIVERY_STATUS.NOT_FOUND],
  ['skipped_missing_fields', DELIVERY_STATUS.NOT_FOUND],
  ['error', DELIVERY_STATUS.NOT_FOUND],
  ['other', DELIVERY_STATUS.NOT_FOUND],
]);

export function normalizeDeliveryStatus(status) {
  if (!status) {
    return DELIVERY_STATUS.NOT_FOUND;
  }
  const normalized = String(status)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (STATUS_ALIAS_MAP.has(normalized)) {
    return STATUS_ALIAS_MAP.get(normalized);
  }
  if (normalized.includes('catch')) {
    return DELIVERY_STATUS.CATCH_ALL;
  }
  if (normalized === DELIVERY_STATUS.VALID) {
    return DELIVERY_STATUS.VALID;
  }
  return DELIVERY_STATUS.NOT_FOUND;
}
