type Level = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function resolveCurrentLevel(): number {
  const raw =
    process.env.LOG_LEVEL?.toLowerCase() ??
    (process.env.NODE_ENV === "production" ? "info" : "debug");
  return LEVEL_ORDER[raw as Level] ?? LEVEL_ORDER.info;
}

const currentLevel = resolveCurrentLevel();
const isProd = process.env.NODE_ENV === "production";

function serializeMeta(meta: unknown): Record<string, unknown> {
  if (meta === undefined) return {};
  if (meta instanceof Error) {
    return {
      error: {
        name: meta.name,
        message: meta.message,
        stack: meta.stack,
      },
    };
  }
  if (typeof meta === "object" && meta !== null) {
    return meta as Record<string, unknown>;
  }
  return { meta };
}

function format(level: Level, msg: string, meta?: unknown): string {
  const time = new Date().toISOString();
  if (isProd) {
    return JSON.stringify({ level, time, msg, ...serializeMeta(meta) });
  }
  if (meta === undefined) return `[${level.toUpperCase()}] ${time} ${msg}`;
  const metaStr =
    typeof meta === "string"
      ? meta
      : meta instanceof Error
        ? `${meta.name}: ${meta.message}\n${meta.stack ?? ""}`
        : JSON.stringify(meta);
  return `[${level.toUpperCase()}] ${time} ${msg} ${metaStr}`;
}

function emit(level: Level, msg: string, meta?: unknown): void {
  if (LEVEL_ORDER[level] < currentLevel) return;
  const out = format(level, msg, meta);
  if (level === "debug") console.log(out);
  else if (level === "info") console.info(out);
  else if (level === "warn") console.warn(out);
  else console.error(out);
}

export const logger = {
  debug: (msg: string, meta?: unknown) => emit("debug", msg, meta),
  info: (msg: string, meta?: unknown) => emit("info", msg, meta),
  warn: (msg: string, meta?: unknown) => emit("warn", msg, meta),
  error: (msg: string, meta?: unknown) => emit("error", msg, meta),
};
