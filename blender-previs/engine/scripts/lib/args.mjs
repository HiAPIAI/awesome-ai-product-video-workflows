export function parseArgs(argv, booleanNames = new Set(), allowedNames = null) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const raw = arg.slice(2);
    const equal = raw.indexOf("=");
    const name = equal === -1 ? raw : raw.slice(0, equal);
    if (!name || (allowedNames && !allowedNames.has(name))) throw new Error(`Unknown option --${name || "<empty>"}.`);
    if (Object.hasOwn(options, name)) throw new Error(`Option --${name} may only be provided once.`);
    if (booleanNames.has(name)) {
      if (equal !== -1) throw new Error(`Boolean option --${name} does not take a value.`);
      options[name] = true;
      continue;
    }
    const value = equal === -1 ? argv[++index] : raw.slice(equal + 1);
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for --${name}.`);
    }
    options[name] = value;
  }
  return { options, positionals };
}
