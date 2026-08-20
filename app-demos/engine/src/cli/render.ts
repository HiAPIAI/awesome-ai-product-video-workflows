import {pathToFileURL} from 'node:url';
import {renderProject} from '../render/renderer.js';

const USAGE = 'Usage: npm run render -- --compiled <compiled-demo-v1.json> --out-dir <directory>';

interface RenderArguments {
  compiledPath: string;
  outputDirectory: string;
}

export function parseRenderArguments(args: readonly string[]): RenderArguments | 'help' {
  if (args.includes('--help') || args.includes('-h')) return 'help';
  let compiledPath: string | undefined;
  let outputDirectory: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];
    if (argument === '--compiled' && value && !value.startsWith('-')) {
      compiledPath = value;
      index += 1;
    } else if (argument === '--out-dir' && value && !value.startsWith('-')) {
      outputDirectory = value;
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete render argument: ${argument ?? ''}`);
    }
  }
  if (!compiledPath || !outputDirectory) throw new Error('Both --compiled and --out-dir are required.');
  return {compiledPath, outputDirectory};
}

export async function main(args: readonly string[] = process.argv.slice(2)): Promise<void> {
  let parsed: RenderArguments | 'help';
  try {
    parsed = parseRenderArguments(args);
  } catch (error) {
    console.error(USAGE);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
    return;
  }
  if (parsed === 'help') {
    console.log(USAGE);
    console.log('Renders deterministic local UI layers, validates media with FFprobe, and creates review artifacts.');
    return;
  }
  try {
    await renderProject({
      compiledPath: parsed.compiledPath,
      outputDirectory: parsed.outputDirectory,
      onProgress: (message) => console.log(message),
    });
  } catch (error) {
    console.error(`Render failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

const entryPoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;
if (entryPoint === import.meta.url) {
  void main();
}
