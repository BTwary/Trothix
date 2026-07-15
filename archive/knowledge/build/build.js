import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { runValidator } from './validator/validator.js';
import { runLinter } from './linter/linter.js';
import { runNormalizer } from './normalizer/normalizer.js';
import { runCompiler } from './compiler/compiler.js';
import { runLinker } from './linker/linker.js';
import { runOptimizer } from './optimizer/optimizer.js';
import { runCoverageAnalyzer } from './coverage/coverage.js';
import { runDiagnostics } from './diagnostics/diagnostics.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..', '..');
const sourceDir = path.join(rootDir, 'knowledge', 'source', 'domains');
const compiledDir = path.join(rootDir, 'knowledge', 'compiled');
const reportsDir = path.join(rootDir, 'knowledge', 'build', 'reports');

const target = process.argv[2] || 'all';
console.log("\\nTrothix Knowledge Build System\\nTarget: " + target + "\\n----------------------------------");

const computeFingerprint = (dir) => crypto.createHash('sha256').update(dir).digest('hex');

const domains = target === 'all' ? fs.readdirSync(sourceDir) : [target];
const fingerprints = {};
const bundle = { version: "1.3.2", domains: {} };

domains.forEach(domain => {
    const domainPath = path.join(sourceDir, domain);
    fingerprints[domain] = computeFingerprint(domainPath);
    
    // 1. Validate
    const vResult = runValidator(domainPath);
    if (!vResult.success) process.exit(1);
    
    // 2. Lint
    runLinter(domainPath);
    
    const rawKnowledge = {};
    const localManifestPath = path.join(domainPath, 'knowledge.json');
    if (fs.existsSync(localManifestPath)) {
        const localManifest = JSON.parse(fs.readFileSync(localManifestPath, 'utf8'));
        for (const [key, filename] of Object.entries(localManifest)) {
            if (key !== 'version') {
                const filePath = path.join(domainPath, filename);
                if (fs.existsSync(filePath)) {
                    rawKnowledge[key] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
            }
        }
    } else {
        // Fallback: load all JSON files directly
        const files = fs.readdirSync(domainPath);
        files.forEach(file => {
            if (file.endsWith('.json') && file !== 'package.json') {
                const key = path.basename(file, '.json');
                const filePath = path.join(domainPath, file);
                rawKnowledge[key] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        });
    }
    
    // 3. Normalize
    const normalized = runNormalizer(rawKnowledge);
    
    // 4. Compile
    const compiled = runCompiler(normalized);
    
    // Write runtime files back to assets v1 domains folder to ensure engine runtime loads the compiled rules.
    const runtimeDomainDir = path.join(rootDir, 'assets', 'js', 'engine', 'knowledge', 'v1', 'domains', domain);
    if (fs.existsSync(runtimeDomainDir)) {
        const sourceHasRules = fs.existsSync(path.join(domainPath, 'rules.json'));
        if (!sourceHasRules && compiled.decisionTables && compiled.decisionTables.length > 0) {
            // Write compiled decision tables to rules.json for engine runtime
            fs.writeFileSync(path.join(runtimeDomainDir, 'rules.json'), JSON.stringify(compiled.decisionTables, null, 2));
        }
        if (compiled.mutationTests && compiled.mutationTests.length > 0) {
            const testsDir = path.join(runtimeDomainDir, 'tests');
            if (!fs.existsSync(testsDir)) {
                fs.mkdirSync(testsDir, { recursive: true });
            }
            fs.writeFileSync(path.join(testsDir, 'mutation_tests.json'), JSON.stringify(compiled.mutationTests, null, 2));
        }
    }
    
    // 6. Optimize
    const optimized = runOptimizer(compiled);
    
    bundle.domains[domain] = optimized;
});

// 5. Link
runLinker(bundle);

// 7. Coverage
const coverage = runCoverageAnalyzer(bundle);

// 8. Diagnostics
runDiagnostics(reportsDir, { status: "Success", coverage, domains: domains.length });

// Emit Runtime Bundle
fs.writeFileSync(path.join(compiledDir, 'knowledge.bundle.json'), JSON.stringify(bundle, null, 2));
fs.writeFileSync(path.join(compiledDir, 'manifest.json'), JSON.stringify({ knowledgeVersion: "1.3.2", compiledAt: new Date().toISOString(), domains: domains.length }, null, 2));
fs.writeFileSync(path.join(compiledDir, 'fingerprints.json'), JSON.stringify(fingerprints, null, 2));
fs.writeFileSync(path.join(compiledDir, 'dependency-graph.json'), JSON.stringify({ Termination: ["Notice"] }, null, 2));
fs.writeFileSync(path.join(compiledDir, 'coverage.json'), JSON.stringify(coverage, null, 2));

console.log("\\nBuild Successful. Bundle written to " + compiledDir);
