export const APP_CONFIG = {
  isProd: process.env.NODE_ENV === "production",
  log: {
    level:
      process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase() ??
      process.env.LOG_LEVEL?.toLowerCase() ??
      (process.env.NODE_ENV === "production" ? "info" : "debug"),
  },
  map: {
    defaultCenter: { lat: 35.6812, lng: 139.7671 } as const,
    defaultZoom: 15,
    geolocationTimeout: 10_000,
  },
  photo: {
    maxWidthPx: 1920,
    jpegQuality: 0.85,
  },
} as const;
