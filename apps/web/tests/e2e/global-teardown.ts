import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_STATE_PATH = path.join(__dirname, ".auth/user.json");

export default async function globalTeardown() {
  if (fs.existsSync(AUTH_STATE_PATH)) {
    fs.rmSync(AUTH_STATE_PATH, { force: true });
  }
}
