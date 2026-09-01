type LogLevel = "info" | "warn" | "error" | "debug" | "success";

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  crimson: "\x1b[38;2;128;14;19m",
  rose: "\x1b[38;2;244;63;94m",
  emerald: "\x1b[38;2;16;185;129m",
  amber: "\x1b[38;2;245;158;11m",
  sky: "\x1b[38;2;14;165;233m",
  zinc: "\x1b[38;2;161;161;170m",
};

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace("T", " ").substring(0, 19);
}

export const logger = {
  info(message: string, meta?: any) {
    console.log(
      `${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.sky}ℹ INFO${COLORS.reset}  ${message}`,
      meta ? meta : ""
    );
  },

  success(message: string, meta?: any) {
    console.log(
      `${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.emerald}✓ SUCCESS${COLORS.reset} ${message}`,
      meta ? meta : ""
    );
  },

  warn(message: string, meta?: any) {
    console.warn(
      `${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.amber}⚠ WARN${COLORS.reset}  ${message}`,
      meta ? meta : ""
    );
  },

  error(message: string, error?: any) {
    console.error(
      `${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.rose}✖ ERROR${COLORS.reset} ${message}`,
      error ? error : ""
    );
  },

  http(method: string, path: string, status: number, durationMs: number) {
    const statusColor =
      status < 300
        ? COLORS.emerald
        : status < 400
        ? COLORS.sky
        : status < 500
        ? COLORS.amber
        : COLORS.rose;

    console.log(
      `${COLORS.dim}[${formatTimestamp()}]${COLORS.reset} ${COLORS.bold}${method.padEnd(6)}${COLORS.reset} ${path.padEnd(
        32
      )} ${statusColor}${status}${COLORS.reset} ${COLORS.dim}${durationMs.toFixed(1)}ms${COLORS.reset}`
    );
  },
};
