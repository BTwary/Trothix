import KnowledgeImporter from './KnowledgeImporter.js';

const importer = new KnowledgeImporter({
    batchId: 'test-batch'
});

await importer.initialize();

// Empty batch for now
const rawFiles = {};

const result = await importer.importBatch(rawFiles);

console.log(JSON.stringify(result.report, null, 2));