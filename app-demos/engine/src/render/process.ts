import {spawn} from 'node:child_process';

export interface ProcessResult {
  stdout: string;
  stderr: string;
}
export async function runProcess(
  command: string,
  args: readonly string[],
  options: {cwd?: string} = {},
): Promise<ProcessResult> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.once('error', (error) => {
      reject(new Error(`Unable to start ${command}: ${error.message}`));
    });
    child.once('close', (code) => {
      if (code === 0) {
        resolve({stdout, stderr});
        return;
      }
      const details = stderr.trim() || stdout.trim() || `exit code ${code ?? 'unknown'}`;
      reject(new Error(`${command} failed: ${details}`));
    });
  });
}
