import axios from "axios";

const resolveApiBaseUrl = () => {
  if (import.meta?.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const host = window.location.hostname;
  const port = window.location.port;
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  const usesViteProxyPort = port === "5173" || port === "5174" || port === "3000";

  if (isLocalHost && usesViteProxyPort) {
    return "/api";
  }

  if (isLocalHost) {
    return "http://localhost:8088/api";
  }

  return "/api";
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    const isAuthRoute =
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/google");

    if (token && !isAuthRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleLogin: (credential) => api.post("/auth/google", { credential }),
  getMe: () => api.get("/auth/me"),
  deviceAlert: (data) => api.post("/auth/device-alert", data),
  getNotificationPreferences: () => api.get("/auth/notification-preferences"),
  updateNotificationPreferences: (data) => api.put("/auth/notification-preferences", data),
};

export const resourcesAPI = {
  getAll: (params) => api.get("/resources", { params }),
  recommend: (params) => api.get("/resources/recommendations", { params }),
  getMapAvailability: (params) => api.get("/resources/map-availability", { params }),
  getById: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post("/resources", data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
};

export const bookingsAPI = {
  create: (data) => api.post("/bookings", data),
  getMyBookings: (params) => api.get("/bookings/my", { params }),
  getAllBookings: (params) => api.get("/bookings/admin/all", { params }),
  getSuggestions: (params) => api.get("/bookings/suggestions", { params }),
  approve: (id) => api.patch(`/bookings/${id}/approve`),
  reject: (id, reason) => api.patch(`/bookings/${id}/reject`, { reason }),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  checkAvailability: (params) =>
    api.get("/bookings/check-availability", { params }),
};

export const ticketsAPI = {
  create: (data) => api.post("/tickets", data),
  getById: (id) => api.get(`/tickets/${id}`),
  getMyTickets: () => api.get("/tickets/my"),
  getAllTickets: (params) => api.get("/tickets/admin/all", { params }),
  getAssignedTickets: () => api.get("/tickets/assigned"),
  assignTechnician: (id, technicianId) =>
    api.patch(`/tickets/${id}/assign`, { technicianId }),
  updateStatus: (id, status) =>
    api.patch(`/tickets/${id}/status`, { status }),
  addResolutionNotes: (id, resolutionNotes) =>
    api.patch(`/tickets/${id}/resolve`, { resolutionNotes }),
  delete: (id) => api.delete(`/tickets/${id}`),
  update: (id, data) => api.patch(`/tickets/${id}`, data),
};

export const commentsAPI = {
  getByTicket: (ticketId) => api.get(`/comments/ticket/${ticketId}`),
  create: (data) => api.post("/comments", data),
  update: (id, message) => api.put(`/comments/${id}`, { message }),
  delete: (id) => api.delete(`/comments/${id}`),
};

export const notificationsAPI = {
  getAll: () => api.get("/notifications"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
};

export const uploadAPI = {
  uploadFiles: (files) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    return api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const usersAPI = {
  getTechnicians: () => api.get("/users/technicians"),
};

export default api;