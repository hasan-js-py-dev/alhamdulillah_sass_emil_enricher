// Generate the eight candidate email addresses for a contact
export function generatePatterns({ firstName, lastName, domain }) {
  const clean = (str) => String(str || '').trim().toLowerCase().replace(/\s+/g, '');
  const first = clean(firstName);
  const last = clean(lastName);
  const f = first.charAt(0);
  const l = last.charAt(0);
  const base = clean(domain);
  return [
    `${first}.${last}@${base}`,    // first.last
    `${f}${last}@${base}`,          // f + last
    `${first}@${base}`,             // first only
    `${first}${last}@${base}`,      // firstlast
    `${first}${l}@${base}`,         // first + l
    `${first}.${l}@${base}`,        // first.l
    `${first}_${last}@${base}`,     // first_last
    `${last}${f}@${base}`,          // last + f
  ];
}