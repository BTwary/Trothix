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
    // No numbered-clause structure found at all (common for Terms of
    // Service, privacy policies, EULAs, and other paragraph-style
    // documents). Previously this collapsed the whole document into a
    // single "Main Body" blob, which meant clause classification, risk
    // attribution, and exception detection could only ever report one
    // undifferentiated chunk — a 500-word ToS and a 5,000-word one looked
    // identical to every downstream step. Split on paragraph breaks
    // instead so each paragraph can be classified and flagged on its own.
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length > 1) {
      paragraphs.forEach((p, i) => {
        clauses.push({ id: String(i + 1), title: `Paragraph ${i + 1}`, text: p, types: [], entities: [] });
      });
    } else {
      clauses.push({ id: '1', title: 'Main Body', text: text, types: [], entities: [] });
    }
  }

  return clauses;
}
