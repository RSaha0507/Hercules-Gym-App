/**
 * Hercules Gym Web API Service
 * Connects the Web Admin Dashboard to the live FastAPI backend on Google Cloud Run.
 */

const DEFAULT_BACKEND_URL = "https://hercules-gym-api-847366288287.asia-southeast1.run.app";

export function getBackendUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_BACKEND_URL;
}

export const BACKEND_URL = getBackendUrl();
export const API_BASE_URL = `${BACKEND_URL}/api`;

class WebApiService {
  private token: string | null = null;

  constructor() {
    // Retrieve stored token if available
    try {
      this.token = localStorage.getItem('hercules_auth_token');
    } catch {
      this.token = null;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        localStorage.setItem('hercules_auth_token', token);
      } else {
        localStorage.removeItem('hercules_auth_token');
      }
    } catch (e) {
      console.warn('Unable to persist auth token', e);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Support either /api prefix or relative path
    const url = cleanEndpoint.startsWith('/api')
      ? `${BACKEND_URL}${cleanEndpoint}`
      : `${API_BASE_URL}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let errDetail = `HTTP ${res.status} ${res.statusText}`;
        try {
          const errJson = await res.json();
          if (errJson.detail) {
            errDetail = typeof errJson.detail === 'string'
              ? errJson.detail
              : JSON.stringify(errJson.detail);
          }
        } catch {
          // ignore non-json error responses
        }
        const error: any = new Error(errDetail);
        error.status = res.status;
        throw error;
      }

      // If empty response or 204
      if (res.status === 204) {
        return null as unknown as T;
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The server may be waking up.');
      }
      throw err;
    }
  }

  // Health / Ping
  async ping(): Promise<boolean> {
    try {
      await this.request('/openapi.json');
      return true;
    } catch {
      return false;
    }
  }

  // Auth
  async login(identifier: string, pass: string) {
    const trimmed = identifier.trim();
    const payload: Record<string, string> = { identifier: trimmed, password: pass };
    if (trimmed.includes('@')) {
      payload.email = trimmed.toLowerCase();
    } else {
      payload.phone = trimmed;
    }
    const data = await this.request<{ access_token: string; token_type: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (data?.access_token) {
      this.setToken(data.access_token);
    }
    return data;
  }

  async register(userData: any) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async logout() {
    this.setToken(null);
  }

  async requestForgotPasswordOtp(identifier: string) {
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const payload = isEmail ? { email: trimmed.toLowerCase() } : { phone: trimmed };
    return await this.request<any>('/auth/forgot-password/request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resetForgotPassword(
    identifier: string,
    otp: string,
    new_password: string,
    confirm_password: string
  ) {
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const payload: any = {
      otp: otp.trim(),
      new_password,
      confirm_password,
    };
    if (isEmail) {
      payload.email = trimmed.toLowerCase();
    } else {
      payload.phone = trimmed;
    }
    return await this.request<any>('/auth/forgot-password/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Members
  async getMembers() {
    return await this.request<any[]>('/members');
  }

  async getMember(id: string) {
    return await this.request<any>(`/members/${id}`);
  }

  async createMember(data: any) {
    return await this.request<any>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMember(id: string, data: any) {
    return await this.request<any>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMember(id: string) {
    return await this.request<any>(`/members/${id}`, {
      method: 'DELETE',
    });
  }

  // Approvals
  async getPendingApprovals() {
    return await this.request<any[]>('/approvals/pending');
  }

  async approveRequest(requestId: string) {
    return await this.request(`/approvals/${requestId}/approve`, {
      method: 'POST',
    });
  }

  async rejectRequest(requestId: string, reason?: string) {
    return await this.request(`/approvals/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Not approved by gym administrator' }),
    });
  }

  // Attendance
  async getTodayAttendance() {
    return await this.request<any[]>('/attendance/today');
  }

  async getAttendanceHistory(userId: string) {
    return await this.request<any[]>(`/attendance/history/${userId}`);
  }

  async checkIn(data: {
    user_id?: string;
    center: string;
    method?: string;
    notes?: string;
  }) {
    return await this.request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({
        center: data.center,
        method: data.method || 'manual',
        user_id: data.user_id,
        notes: data.notes,
      }),
    });
  }

  async checkOut(userId: string) {
    return await this.request(`/attendance/check-out/${userId}`, {
      method: 'POST',
    });
  }

  async getQrCode() {
    return await this.request<{ qr_code: string; date: string }>('/attendance/qr-code');
  }

  async scanQr(code: string, center?: string) {
    return await this.request('/attendance/qr-scan', {
      method: 'POST',
      body: JSON.stringify({ qr_data: code, center }),
    });
  }

  // Merchandise / Store
  async getMerchandise() {
    return await this.request<any[]>('/merchandise');
  }

  async createMerchandise(data: any) {
    return await this.request<any>('/merchandise', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMerchandise(id: string, data: any) {
    return await this.request<any>(`/merchandise/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMerchandise(id: string) {
    return await this.request<any>(`/merchandise/${id}`, {
      method: 'DELETE',
    });
  }

  async createOrder(orderData: any) {
    return await this.request<any>('/merchandise/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Master Product Catalog
  async getMasterCatalog() {
    return await this.request<any[]>('/catalog');
  }

  async createCatalogItem(data: any) {
    return await this.request<any>('/catalog', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCatalogItem(id: string, data: any) {
    return await this.request<any>(`/catalog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCatalogItem(id: string) {
    return await this.request<any>(`/catalog/${id}`, {
      method: 'DELETE',
    });
  }

  // Announcements
  async getAnnouncements() {
    return await this.request<any[]>('/announcements');
  }

  async createAnnouncement(data: {
    title: string;
    content: string;
    target?: string;
    category?: string;
    is_pinned?: boolean;
  }) {
    return await this.request<any>('/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id: string) {
    return await this.request(`/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // Messages
  async getMessages(otherUserId: string) {
    return await this.request<any[]>(`/messages/${otherUserId}`);
  }

  async sendMessage(receiverId: string, content: string) {
    return await this.request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify({
        receiver_id: receiverId,
        content,
        message_type: 'text',
      }),
    });
  }

  async getMessageContacts() {
    return await this.request<any[]>('/messages/contacts');
  }

  // HG.AI Chat
  async chatWithAI(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: { member_name?: string; branch?: string }
  ) {
    return await this.request<{ response: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        context: context || {},
      }),
    });
  }

  // Workout Logs
  async getWorkoutLogs() {
    return await this.request<any[]>('/workout-logs');
  }

  async createWorkoutLog(items: Array<{ exercise: string; sets: number; reps: number; weight: number }>) {
    return await this.request<any>('/workout-logs', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  // Progress Analytics
  async getMyProgressAnalytics() {
    return await this.request<any>('/my/progress-analytics');
  }
}

export const webApi = new WebApiService();
