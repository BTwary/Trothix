import { Trothix } from './assets/js/engine/Trothix.js';

async function testApi() {
  console.log("Initializing Trothix API...");
  const engine = new Trothix();
  await engine.initialize();
  
  const text = "The Company shall make payment of USD 50,000 within 30 days, provided that the Client has accepted delivery, except where Clause 7 applies. Mutual confidentiality obligations exist.";
  const metadata = { category: "Mutual NDA", parties: ["Company", "Client"] };

  console.log("Analyzing document...");
  const report = await engine.analyze(text, metadata);
  
  console.log("\n====== FINAL TROTHIX REPORT ======");
  console.log(JSON.stringify(report, null, 2));
}

testApi().catch(console.error);
