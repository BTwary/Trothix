export const riskRules = [
  // Liability & Risk
  { "pattern": "indemnify", "score": 20, "level": "High" },
  { "pattern": "hold harmless", "score": 20, "level": "High" },
  { "pattern": "liquidated damages", "score": 15, "level": "Medium" },
  { "pattern": "liability shall be limited", "score": 15, "level": "Medium" },
  { "pattern": "maximum liability", "score": 15, "level": "Medium" },
  { "pattern": "shall not exceed", "score": 10, "level": "Medium" },
  
  // Dispute Resolution / Waivers
  { "pattern": "binding arbitration", "score": 15, "level": "Medium" },
  { "pattern": "class action waiver", "score": 15, "level": "Medium" },
  { "pattern": "waives any right to a jury", "score": 15, "level": "Medium" },
  { "pattern": "injunct", "score": 10, "level": "Medium" },
  { "pattern": "equitable relief", "score": 10, "level": "Medium" },
  
  // IP / Licenses
  { "pattern": "perpetual", "score": 20, "level": "High" },
  { "pattern": "irrevocable", "score": 15, "level": "Medium" },
  
  // Termination & Renewals
  { "pattern": "automatically renew", "score": 10, "level": "Medium" },
  { "pattern": "terminate at any time", "score": 15, "level": "Medium" },
  { "pattern": "terminate without cause", "score": 15, "level": "Medium" },
  
  // Warranties
  { "pattern": "as is", "score": 10, "level": "Medium" },
  { "pattern": "without warranty", "score": 10, "level": "Medium" },
  { "pattern": "disclaims all warranties", "score": 15, "level": "Medium" }
];
