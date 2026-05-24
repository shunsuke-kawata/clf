export const APP_CONFIG = {
  isProd: process.env.NODE_ENV === "production",
  isLocal: process.env.NODE_ENV !== "production",
  log: {
    level:
      process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase() ??
      process.env.LOG_LEVEL?.toLowerCase() ??
      "info",
  },
  map: {
    defaultCenter: { lat: 35.6812, lng: 139.7671 } as const,
    defaultZoom: 15,
    maxNativeZoom: 19,
    maxZoom: 21,
    currentLocationZoom: 16,
    currentLocationSkipDistanceMeters: 50,
    pickerZoom: 21,
    pickerFlyZoom: 19,
    geolocationTimeout: 10_000,
    tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    tileAttribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    leafletIcons: {
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    },
  },
  auth: {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "30d",
    accessMaxAge: 60 * 15,
    refreshMaxAge: 60 * 60 * 24 * 30,
  },
  photo: {
    maxWidthPx: 1920,
    jpegQuality: 0.85,
    bucket: "locker-photos",
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedExtensions: ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"] as string[],
  },
  geocode: {
    url: "https://photon.komoot.io/api/",
    upstreamLimit: 10,
    resultLimit: 5,
  },
} as const;
