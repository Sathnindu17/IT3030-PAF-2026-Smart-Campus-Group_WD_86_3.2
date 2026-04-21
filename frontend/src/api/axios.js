import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
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
    const status = error?.response?.status;

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ============ Auth API ============
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleLogin: (credential) => api.post("/auth/google", { credential }),
  getMe: () => api.get("/auth/me"),
};

// ============ Resources API ============
export const resourcesAPI = {
  getAll: (params) => api.get("/resources", { params }),
  getById: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post("/resources", data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
};

// ============ Bookings API ============
export const bookingsAPI = {
  create: (data) => api.post("/bookings", data),
  getMyBookings: (params) => api.get("/bookings/my", { params }),
  getAllBookings: (params) => api.get("/bookings/admin/all", { params }),
  approve: (id) => api.patch(`/bookings/${id}/approve`),
  reject: (id, reason) => api.patch(`/bookings/${id}/reject`, { reason }),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
};

// ============ Tickets API ============
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
};

// ============ Comments API ============
export const commentsAPI = {
  getByTicket: (ticketId) => api.get(`/comments/ticket/${ticketId}`),
  create: (data) => api.post("/comments", data),
  update: (id, message) => api.put(`/comments/${id}`, { message }),
  delete: (id) => api.delete(`/comments/${id}`),
};

// ============ Notifications API ============
export const notificationsAPI = {
  getAll: () => api.get("/notifications"),
  getUnreadCount: () => api.get("/notifications/unread-count"),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch("/notifications/read-all"),
};

// ============ Upload API ============
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

// ============ Users API ============
export const usersAPI = {
  getTechnicians: () => api.get("/users/technicians"),
};

export default api;