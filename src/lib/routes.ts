export const API_ROUTES = {
  lockers: {
    list: "/api/lockers",
    create: "/api/lockers",
    detail: (id: string) => `/api/lockers/${id}`,
    update: (id: string) => `/api/lockers/${id}`,
    delete: (id: string) => `/api/lockers/${id}`,
  },
  photos: {
    upload: "/api/photos",
    proxy: (key: string) => `/api/photos/proxy?key=${encodeURIComponent(key)}`,
  },
  geocode: {
    search: (q: string) => `/api/geocode?q=${encodeURIComponent(q)}`,
  },
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
  },
  admin: {
    reset: "/api/admin/reset",
  },
} as const;

export const PAGE_ROUTES = {
  home: "/",
  login: "/login",
  adminLogin: "/login/admin",
  admin: "/admin",
  newLocker: "/new",
  lockerDetail: (id: string) => `/lockers/${id}`,
  lockerEdit: (id: string) => `/lockers/${id}/edit`,
} as const;
