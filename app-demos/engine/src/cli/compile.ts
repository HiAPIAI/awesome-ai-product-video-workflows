import {parseArgs} from 'node:util';
import {compileDemoFile, writeCompiledDemo} from '../compiler/compile.js';
import {displayPath, fail} from './common.js';

try {
  const {values, positionals} = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: true,
    options: {
      help: {type: 'boolean', short: 'h'},
      'out-dir': {type: 'string'},
    },
  });
  if (values.help) {
    console.log('Usage: npm run compile -- <demo.yaml> --out-dir <directory>');
    process.exit(0);
  }
  if (positionals.length !== 1 || !values['out-dir']) {
    throw new Error('A demo.yaml path and --out-dir are required.\nUsage: npm run compile -- <demo.yaml> --out-dir <directory>');
  }
  const result = compileDemoFile(positionals[0]!);
  const files = writeCompiledDemo(result, values['out-dir']);
  console.log(JSON.stringify({
    compiled: true,
    projectId: result.compiled.project.id,
    sourceSha256: result.compiled.source.sha256,
    files: files.map(displayPath),
  }, null, 2));
} catch (error) {
  fail(error);
}
