import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const count = Number(process.env.AGENT_COUNT || 9);
const serverUrl = process.env.SERVER_URL || "http://localhost:3000";
const agentDir = path.dirname(fileURLToPath(import.meta.url));

for (let index = 0; index < count; index++) {
  const keypairPath = path.join(agentDir, "bots", `bot-${index}.json`);

  const child = spawn(process.execPath, ["index.js"], {
    env: {
      ...process.env,
      SERVER_URL: serverUrl,
      AGENT_NAME: `bot-${index}`,
      AGENT_INDEX: String(index),
      AGENT_KEYPAIR_PATH: keypairPath,
    },
    stdio: "inherit",
  });

  console.log("spawn agent", index);

  child.on("exit", (code) => {
    console.log(`agent ${index} exited with code ${code}`);
  });
}
