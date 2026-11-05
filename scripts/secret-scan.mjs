import { execSync } from "child_process";
import fs from "fs";
import path from "path";

let fail = false;

// 1. Check for tracked .env files
try {
  const tracked = execSync("git ls-files", { encoding: "utf8" }).split("\n");
  for (const file of tracked) {
    const trimmed = file.trim();
    if (!trimmed) continue;
    if (/(^|\/)\.env/.test(trimmed) && !trimmed.endsWith(".env.example")) {
      console.error(`ERROR: an env file is tracked by git: ${trimmed}`);
      fail = true;
    }
  }
} catch (e) {
  console.error("Failed to list git files", e);
}

// 2. Check for secret values in tracked files
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf8");
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    if (/(KEY|SECRET|CLIENT_ID)/.test(key)) {
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val.length >= 8) {
        try {
          execSync(`git grep -I -F -q -- "${val}" -- . ":!.env.local"`, {
            stdio: "ignore",
          });
          // If git grep succeeds (exit code 0), the secret was found!
          console.error(`ERROR: value of ${key} appears in tracked files`);
          fail = true;
        } catch {
          // git grep exits with 1 when pattern is not found (which is good)
        }
      }
    }
  }
}

if (!fail) {
  console.log("secret-scan: OK");
  process.exit(0);
} else {
  process.exit(1);
}

