export function verifyChecklist(clauses, manifest) {
  const expected = manifest.required || [];
  
  const foundTypes = new Set();
  clauses.forEach(c => {
     c.types.forEach(t => foundTypes.add(t));
  });
  
  const missing = expected.filter(t => !foundTypes.has(t));
  return { missing };
}
