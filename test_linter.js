import { KnowledgeLinter } from './assets/js/engine/knowledge/KnowledgeLinter.js';

async function test() {
  const linter = new KnowledgeLinter(process.cwd() + '/assets/js/engine/knowledge/v1');
  const issues = await linter.lint();
  console.log("LINTER OUTPUT:");
  console.log(issues.length === 0 ? "No issues found! KB is pristine." : issues.join('\n'));

  const blocking = issues.filter(i => i.startsWith('[ERROR]') || i.startsWith('[FATAL]'));
  if (blocking.length > 0) {
    console.error(`\n${blocking.length} blocking issue(s) found (ERROR/FATAL). Failing build.`);
    process.exit(1);
  }
}

test();