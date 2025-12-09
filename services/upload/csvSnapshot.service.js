// Builds CSV column order and maintains an append-friendly snapshot writer for job outputs.
import fs from 'fs/promises';
import { OUTPUT_COLUMNS, CSV_APPEND_COLUMNS } from './upload.constants.js';

export function buildCsvColumnOrder() {
  return [...OUTPUT_COLUMNS, ...CSV_APPEND_COLUMNS];
}

export function createCsvSnapshotWriter(filePath, columns, initialRows) {
  let rows = initialRows.slice();
  let writeQueue = Promise.resolve();

  const scheduleWrite = () => {
    const payload = serializeCsv(columns, rows);
    writeQueue = writeQueue.then(() => fs.writeFile(filePath, payload, 'utf-8'));
    return writeQueue;
  };

  return {
    async writeSnapshot() {
      await scheduleWrite();
    },
    async setRow(rowId, newRow) {
      rows[rowId] = newRow;
      await scheduleWrite();
    },
  };
}

export function composeCsvRowData(baseRow, overrides = {}) {
  const row = { ...baseRow };
  CSV_APPEND_COLUMNS.forEach((column) => {
    row[column] = overrides[column] ?? '';
  });
  return row;
}

function serializeCsv(columns, rows) {
  const headerLine = columns.map((column) => escapeCsvValue(column)).join(',');
  const bodyLines = rows.map((row) => columns.map((column) => escapeCsvValue(row?.[column] ?? '')).join(','));
  const lines = [headerLine, ...bodyLines];
  return `${lines.join('\n')}\n`;
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
