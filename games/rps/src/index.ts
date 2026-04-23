import "dotenv/config";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { WebSocketServer } from "ws";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { RpsOracle } from "./oracle-client.js";
import { RpsGameRunner } from "./game-runner.js";
import { attachSocket } from "./human-actions.js";
import { LogWriter } from "./log-writer.js";
import { loadBotKeypairs, ensureBotProfiles } from "./bot-keypairs.js";

const PORT = Number(process.env.PORT ?? 3001);
const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
const LOG_DIR = process.env.LOG_DIR ?? "./arena-logs";
const ORACLE_KEYPAIR_PATH = process.env.ORACLE_KEYPAIR_PATH;
if (!ORACLE_KEYPAIR_PATH) {
  throw new Error("ORACLE_KEYPAIR_PATH env var is required");
}

const connection = new Connection(RPC_URL, "confirmed");
const oracleKp = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(readFileSync(ORACLE_KEYPAIR_PATH, "utf-8")) as number[])
);
const oracle = new RpsOracle(connection, oracleKp);
const logWriter = new LogWriter(LOG_DIR);

const botKeypairs = loadBotKeypairs();
await ensureBotProfiles(connection, botKeypairs);

// arenaId → runner
const runners = new Map<string, RpsGameRunner>();

const http = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }

  // POST /arenas → create an arena, pre-enter bots, return arenaId.
  if (req.method === "POST" && req.url === "/arenas") {
    try {
      const body = await readBody(req);
      const { humanPubkey } = JSON.parse(body) as { humanPubkey: string };
      if (!humanPubkey) throw new Error("humanPubkey required");

      const { arenaId } = await oracle.createRpsArena();

      // Enter each bot. (Bot enters via its own keypair.)
      for (const kp of botKeypairs) {
        const { RitArena } = await import("@ritarena/sdk");
        const botSdk = RitArena.fromKeypair(connection, kp);
        await botSdk.enterArena(Number(arenaId));
      }

      const runner = new RpsGameRunner(
        connection,
        oracle,
        arenaId,
        botKeypairs,
        new PublicKey(humanPubkey)
      );

      runner.on("round-result", (e) => {
        logWriter.appendRound(arenaId, e.round, e.pubkeys, e.choices, e.scores).catch(() => {});
      });

      runners.set(arenaId, runner);

      // Don't start the runner yet — wait for the human to enter on-chain and
      // connect the WS. The WS handler kicks off runner.run().

      res.writeHead(200, { "Content-Type": "application/json" }).end(
        JSON.stringify({ arenaId })
      );
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" }).end(
        JSON.stringify({ error: String(err) })
      );
      return;
    }
  }

  // GET /arenas/:id/log.jsonl → serve per-arena log.
  const logMatch = req.url?.match(/^\/arenas\/([^/]+)\/log\.jsonl$/);
  if (req.method === "GET" && logMatch) {
    const [, arenaId] = logMatch;
    try {
      const content = readFileSync(`${LOG_DIR}/${arenaId}.jsonl`, "utf-8");
      res.writeHead(200, { "Content-Type": "application/x-ndjson" }).end(content);
    } catch {
      res.writeHead(404).end("Not found");
    }
    return;
  }

  res.writeHead(404).end();
});

const wss = new WebSocketServer({ noServer: true });

http.on("upgrade", (req, socket, head) => {
  const match = req.url?.match(/^\/arenas\/([^/]+)$/);
  if (!match) {
    socket.destroy();
    return;
  }
  const [, arenaId] = match;
  const runner = runners.get(arenaId);
  if (!runner) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    attachSocket(ws, runner);
    // Kick off the match when the human is connected.
    // In a real implementation you'd first confirm the human's on-chain entry
    // has landed. For MVP we trust the web client to only connect after entry.
    runner.run().catch((err) => {
      ws.send(JSON.stringify({ type: "error", message: String(err) }));
    });
  });
});

http.listen(PORT, () => {
  console.log(`[rps-server] listening on :${PORT}`);
});

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
