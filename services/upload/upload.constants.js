// Centralized constants for upload limits and column aliases shared across upload helpers.
export const ALLOWED_EXTENSIONS = ['.csv', '.xls', '.xlsx'];

export const MAX_ROWS = 10000;

export const COLUMN_ALIASES = {
  firstName: ['first name', 'firstname', 'first'],
  lastName: ['last name', 'lastname', 'last'],
  website: ['website', 'domain', 'company website', 'company domain'],
  email: ['email', 'e-mail', 'work email', 'business email'],
};

export const OUTPUT_COLUMNS = ['First Name', 'Last Name', 'Website'];

export const CSV_APPEND_COLUMNS = ['Email', 'Status'];
