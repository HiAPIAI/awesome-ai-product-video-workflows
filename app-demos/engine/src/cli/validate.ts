import {parseArgs} from 'node:util';
import {validateDemoFile} from '../compiler/validate.js';
import {displayPath, fail} from './common.js';

try {
  const {values, positionals} = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    strict: true,
    options: {help: {type: 'boolean', short: 'h'}},
  });
  if (values.help) {
    console.log('Usage: npm run validate -- <demo.yaml>');
    process.exit(0);
  }
  if (positionals.length !== 1) throw new Error('Exactly one demo.yaml path is required.\nUsage: npm run validate -- <demo.yaml>');
  const result = validateDemoFile(positionals[0]!);
  console.log(JSON.stringify({
    valid: true,
    file: displayPath(positionals[0]!),
    projectId: result.demo.project.id,
    assets: result.demo.assets.length,
    scenes: result.demo.scenes.length,
    durationFrames: result.demo.canvas.durationFrames,
  }, null, 2));
} catch (error) {
  fail(error);
}
