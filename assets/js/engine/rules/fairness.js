export function calculateFairness(obligations) {
  const counts = {};
  
  obligations.forEach(o => {
    // Normalize names to Party A / Party B conceptually
    let partyName = o.subject.toLowerCase();
    
    // Alias mapping
    if (partyName.includes("receiving") || partyName.includes("tenant") || partyName.includes("consultant")) {
       partyName = "Party A";
    } else if (partyName.includes("disclosing") || partyName.includes("landlord") || partyName.includes("client")) {
       partyName = "Party B";
    }
    
    counts[partyName] = (counts[partyName] || 0) + 1;
  });
  
  const parties = Object.keys(counts);
  if (parties.length === 0) return "Unknown (0 obligations detected)";
  if (parties.length === 1) return `Highly Asymmetric (Favors ${parties[0]} with 0 obligations for counterparty)`;
  
  const countA = counts[parties[0]];
  const countB = counts[parties[1]];
  
  const diff = Math.abs(countA - countB);
  
  if (diff <= 2) return `Balanced (${countA} vs ${countB})`;
  
  const favored = countA > countB ? parties[1] : parties[0]; // The one with FEWER obligations is favored
  return `Asymmetric (Favors ${favored} - ${countA} vs ${countB} obligations)`;
}
