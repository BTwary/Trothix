export function extractEntities(clauses) {
  const entities = new Set();
  clauses.forEach(c => {
     // Naive entity extraction (Capitalized words like Receiving Party, Disclosing Party, Tenant)
     const match = c.text.match(/(?:Receiving Party|Disclosing Party|Tenant|Landlord|Company|Client|Consultant|Contractor)/gi);
     if (match) {
        match.forEach(m => entities.add(m));
     }
  });
  return Array.from(entities);
}

export function extractObligations(clauses) {
  const obligations = [];
  const modalRegex = /([A-Z][a-zA-Z\s]+?)\s+(shall|must|will|may|cannot|only|unless)\s+([a-z]+)\s+([^\.\,;]+)/gi;
  
  clauses.forEach(c => {
    let match;
    while ((match = modalRegex.exec(c.text)) !== null) {
       const subject = match[1].trim();
       // Only accept valid entity subjects to reduce noise
       if (/(Party|Tenant|Landlord|Company|Client|Consultant|Contractor)/i.test(subject)) {
           obligations.push({
             subject: subject,
             verb: match[3],
             object: match[4].trim(),
             clauseId: c.id
           });
       }
    }
  });
  
  return obligations;
}

export function extractExceptions(clauses) {
  const exceptions = [];
  clauses.forEach(c => {
    if (/however|except|unless|provided that|notwithstanding|shall not include/i.test(c.text)) {
      exceptions.push({ clauseId: c.id, text: c.text.substring(0, 150) + "..." });
    }
  });
  return exceptions;
}

export function extractDeadlines(text) {
  const deadlines = [];
  const regex = /(\d+|one|two|three|four|five|ten|thirty|sixty|ninety)\s+(days|months|years)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    deadlines.push(match[0]);
  }
  return [...new Set(deadlines)];
}

export function extractPlaceholders(text) {
  const placeholders = [];
  const regex = /_{3,}|\[[A-Za-z\s]+\]|<[A-Za-z\s]+>|TBD|Please Fill|Lorem Ipsum/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    placeholders.push(match[0]);
  }
  return [...new Set(placeholders)];
}
