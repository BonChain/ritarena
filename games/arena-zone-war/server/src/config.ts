import dotenv from "dotenv";

dotenv.config();

const num = (key: string, def: number) => Number(process.env[key] ?? def);
const text = (key: string, def: string) => process.env[key] ?? def;

export const config = {
  port: num("PORT", 3000),
  autoSpawnAgents: num("AUTO_SPAWN_AGENTS", 5),

  blockchain: {
    mode: text("ARENA_MODE", "mock"),
    rpcUrl: text("RPC_URL", "https://api.devnet.solana.com"),
    profileName: text("PROFILE_NAME", "ArenaZoneWar"),
    walletPath: text("WALLET_PATH", "./keypair.json"),
    arena: {
      entryFee: num("ARENA_ENTRY_FEE", 1_000),
      duration: num("ARENA_DURATION", 60),
      prizeSplit: [60, 30, 10],
      actionSchema: text("ARENA_ACTION_SCHEMA", "move,attack"),
    },
  },

  game: {
    tickRate: num("TICK_RATE", 60),
    waitTime: num("WAIT_TIME", 5),
    roundTime: num("ROUND_TIME", 60),
    minPlayers: num("MIN_PLAYERS", 5),
    maxPlayers: num("MAX_PLAYERS", 9),

    map: {
      width: num("MAP_WIDTH", 20),
      height: num("MAP_HEIGHT", 20),
    },

    player: {
      speed: num("PLAYER_SPEED", 5),
      friction: num("PLAYER_FRICTION", 0.9),
      radius: num("PLAYER_RADIUS", 0.5),
      defaultHp: num("PLAYER_HP", 100),
      deathPenalty: num("DEATH_PENALTY", 10),
    },

    attack: {
      damage: num("ATTACK_DAMAGE", 20),
      cooldown: num("ATTACK_COOLDOWN", 0.5),
      knockback: num("ATTACK_KNOCKBACK", 10),
      stun: num("ATTACK_STUN", 0.2),
      invuln: num("INVULN_TIME", 0.3),
    },

    zone: {
      radius: num("ZONE_RADIUS", 3),
      scoreRate: num("ZONE_SCORE_RATE", 2),
      spawnInterval: num("ZONE_SPAWN_INTERVAL", 10),
      minDistance: num("ZONE_MIN_DISTANCE", 5),
    },
  },
};
