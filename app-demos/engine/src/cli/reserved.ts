import {CLI_CONTRACTS, type CliName} from '../contracts/cli.js';

export function runReservedCli(name: CliName): void {
  const argsContract = CLI_CONTRACTS[name].slice(name.length).trim();
  const usage = `Usage: npm run ${name}${argsContract ? ` -- ${argsContract}` : ''}`;
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(usage);
    console.log('Bootstrap contract only. Implementation is assigned to its owning worktree.');
    return;
  }

  console.error(usage);
  console.error(`The ${name} implementation is reserved for its owning worktree.`);
  process.exitCode = 2;
}
