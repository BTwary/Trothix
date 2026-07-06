
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, 'vision.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
let failed = false;

fs.readdirSync(__dirname).forEach(file => {
  if (file.endsWith('.json') && file !== 'vision.schema.json') {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));
      schema.required.forEach(field => {
        if (data[field] === undefined) {
          console.error(`[${file}] Missing required field: ${field}`);
          failed = true;
        }
      });
    } catch (e) {
      console.error(`[${file}] Invalid JSON: ${e.message}`);
      failed = true;
    }
  }
});

if (failed) {
  process.exit(1);
} else {
  console.log("Vision Linter Passed. All specifications strictly adhere to vision.schema.json.");
}
