export function segmentClauses(text) {
  // Supports: "1.", "1.1", "(a)", "(i)", "Section 4", "Article V", "Clause 7"
  const clauseRegex = /(?:^|\n)\s*(?:Section\s+\d+|Article\s+[IVX]+|Clause\s+\d+|\d+(?:\.\d+)*\.?|\([a-zivx]+\))\s+([A-Z].*)/gi;
  let clauses = [];
  let lastIndex = 0;
  let match;
  let currentId = 1;
  
  while ((match = clauseRegex.exec(text)) !== null) {
     if (lastIndex < match.index) {
        if (clauses.length === 0) {
           clauses.push({ id: 'Preamble', title: 'Preamble', text: text.substring(0, match.index).trim(), types: [], entities: [] });
        } else {
           clauses[clauses.length - 1].text += '\n' + text.substring(lastIndex, match.index).trim();
        }
     }
     
     // Try to extract a title if it's all caps or followed by a period/colon
     let textContent = match[1].trim();
     let title = `Clause ${currentId}`;
     const titleMatch = textContent.match(/^([A-Z\s]+)[\.:]\s*(.*)/);
     if (titleMatch) {
         title = titleMatch[1].trim();
         textContent = titleMatch[2].trim();
     }
     
     clauses.push({ id: String(currentId++), title, text: textContent, types: [], entities: [] });
     lastIndex = clauseRegex.lastIndex;
  }
  
  if (lastIndex < text.length && clauses.length > 0) {
     clauses[clauses.length - 1].text += '\n' + text.substring(lastIndex).trim();
  }
  
  if (clauses.length === 0) {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    paragraphs.forEach((p, index) => {
       // Only treat substantial paragraphs as clauses to avoid noise
       if (p.trim().length > 30) {
         clauses.push({ id: String(index + 1), title: `Paragraph ${index + 1}`, text: p.trim(), types: [], entities: [] });
       }
    });
    // Ultimate fallback if no paragraphs > 30 chars
    if (clauses.length === 0) {
        clauses.push({ id: '1', title: 'Main Body', text: text, types: [], entities: [] });
    }
  }

  return clauses;
}
