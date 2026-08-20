import { spawn } from "node:child_process";

export async function runProcess(executable, args, label, options = {}) {
  const capture = Boolean(options.capture);
  return await new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      callback(value);
    };
    if (capture) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.stdout.on("error", (error) => settle(reject, new Error(`${label} stdout failed: ${error.message}`)));
      child.stderr.on("error", (error) => settle(reject, new Error(`${label} stderr failed: ${error.message}`)));
    }
    child.on("error", (error) => settle(reject, new Error(`Failed to start ${label}: ${error.message}`)));
    child.on("close", (code, signal) => {
      if (code === 0) settle(resolve, { stdout, stderr });
      else settle(reject, new Error(`${label} exited with ${signal ? `signal ${signal}` : `code ${code ?? "unknown"}`}${stderr.trim() ? `: ${stderr.trim()}` : "."}`));
    });
  });
}
