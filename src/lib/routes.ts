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
  },
  geocode: {
    search: (q: string) => `/api/geocode?q=${encodeURIComponent(q)}`,
  },
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
  },
} as const;

export const PAGE_ROUTES = {
  home: "/",
  login: "/login",
  lockerDetail: (id: string) => `/lockers/${id}`,
  adminNew: "/admin/new",
  adminEdit: (id: string) => `/admin/${id}/edit`,
} as const;
