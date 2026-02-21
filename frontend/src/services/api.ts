import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config/backend';

export const GYM_CENTERS = ['Ranaghat', 'Chakdah', 'Madanpur'] as const;
export type CenterType = typeof GYM_CENTERS[number];

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async ping() {
    const response = await this.client.get('/health', { timeout: 12000 });
    return response.data;
  }

  // Auth
  async login(identifier: string, password: string) {
    const trimmed = identifier.trim();
    const payload: Record<string, string> = { identifier: trimmed, password };
    if (trimmed.includes('@')) {
      payload.email = trimmed.toLowerCase();
    } else {
      payload.phone = trimmed;
    }
    const response = await this.client.post('/auth/login', payload);
    return response.data;
  }

  async register(data: {
    email?: string;
    password: string;
    full_name: string;
    phone: string;
    role: string;
    center?: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: { full_name?: string; phone?: string; profile_image?: string }) {
    const response = await this.client.put('/auth/profile', null, { params: data });
    return response.data;
  }

  async updatePushToken(pushToken: string) {
    const response = await this.client.put('/auth/push-token', null, { params: { push_token: pushToken } });
    return response.data;
  }

  // Centers
  async getCenters() {
    const response = await this.client.get('/centers');
    return response.data;
  }

  // Approvals
  async getPendingApprovals() {
    const response = await this.client.get('/approvals/pending');
    return response.data;
  }

  async approveRequest(requestId: string) {
    const response = await this.client.post(`/approvals/${requestId}/approve`);
    return response.data;
  }

  async rejectRequest(requestId: string, reason?: string) {
    const response = await this.client.post(`/approvals/${requestId}/reject`, null, { params: { reason } });
    return response.data;
  }

  // Members
  async getMembers(center?: string) {
    const response = await this.client.get('/members', { params: { center } });
    return response.data;
  }

  async getMember(userId: string) {
    const response = await this.client.get(`/members/${userId}`);
    return response.data;
  }

  async createMember(data: any) {
    const response = await this.client.post('/members', data);
    return response.data;
  }

  async updateMember(userId: string, data: any) {
    const response = await this.client.put(`/members/${userId}`, data);
    return response.data;
  }

  async deleteMember(userId: string) {
    const response = await this.client.delete(`/members/${userId}`);
    return response.data;
  }

  async changeMemberCenter(userId: string, newCenter: string) {
    const response = await this.client.put(`/members/${userId}/center`, null, { params: { new_center: newCenter } });
    return response.data;
  }

  async addBodyMetrics(userId: string, data: any) {
    const response = await this.client.post(`/members/${userId}/metrics`, data);
    return response.data;
  }

  async updateBodyMetrics(userId: string, metricIndex: number, data: any) {
    const response = await this.client.put(`/members/${userId}/metrics/${metricIndex}`, data);
    return response.data;
  }

  async deleteBodyMetrics(userId: string, metricIndex: number) {
    const response = await this.client.delete(`/members/${userId}/metrics/${metricIndex}`);
    return response.data;
  }

  // Trainers
  async getTrainers(center?: string) {
    const response = await this.client.get('/trainers', { params: { center } });
    return response.data;
  }

  async createTrainer(data: any) {
    const response = await this.client.post('/trainers', data);
    return response.data;
  }

  async changeTrainerCenter(userId: string, newCenter: string) {
    const response = await this.client.put(`/trainers/${userId}/center`, null, { params: { new_center: newCenter } });
    return response.data;
  }

  // Attendance
  async checkIn(userId: string, method: string = 'manual') {
    const response = await this.client.post('/attendance/check-in', { user_id: userId, method });
    return response.data;
  }

  async checkOut(userId: string) {
    const response = await this.client.post(`/attendance/check-out/${userId}`);
    return response.data;
  }

  async getTodayAttendance(center?: string) {
    const response = await this.client.get('/attendance/today', { params: { center } });
    return response.data;
  }

  async getAttendanceHistory(userId: string, startDate?: string, endDate?: string) {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await this.client.get(`/attendance/history/${userId}`, { params });
    return response.data;
  }

  async getQrCode() {
    const response = await this.client.get('/attendance/qr-code');
    return response.data;
  }

  async qrCheckIn(code: string) {
    const response = await this.client.post('/attendance/qr-check-in', null, { params: { code } });
    return response.data;
  }

  // Notifications
  async getNotifications() {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  async markNotificationRead(notificationId: string) {
    const response = await this.client.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  async getUnreadNotificationCount() {
    const response = await this.client.get('/notifications/unread-count');
    return response.data;
  }

  // Messages
  async sendMessage(receiverId: string, content: string, messageType: string = 'text') {
    const response = await this.client.post('/messages', {
      receiver_id: receiverId,
      content,
      message_type: messageType,
    }, { timeout: 30000 });
    return response.data;
  }

  async getMessages(otherUserId: string) {
    const response = await this.client.get(`/messages/${otherUserId}`);
    return response.data;
  }

  async getMessageContacts() {
    const response = await this.client.get('/messages/contacts');
    return response.data;
  }

  async deleteSelectedMessages(messageIds: string[]) {
    const response = await this.client.post('/messages/delete-selected', {
      message_ids: messageIds,
    });
    return response.data;
  }

  async deleteConversation(otherUserId: string) {
    const response = await this.client.delete(`/messages/conversations/${otherUserId}`);
    return response.data;
  }

  async getConversations() {
    const response = await this.client.get('/conversations');
    return response.data;
  }

  // Announcements
  async createAnnouncement(data: {
    title: string;
    content: string;
    target: string;
    target_center?: string;
    target_users?: string[];
  }) {
    const response = await this.client.post('/announcements', data);
    return response.data;
  }

  async updateAnnouncement(id: string, data: {
    title?: string;
    content?: string;
    target?: string;
    target_center?: string;
    target_users?: string[];
  }) {
    const response = await this.client.put(`/announcements/${id}`, data);
    return response.data;
  }

  async getAnnouncements() {
    const response = await this.client.get('/announcements');
    return response.data;
  }

  async deleteAnnouncement(id: string) {
    const response = await this.client.delete(`/announcements/${id}`);
    return response.data;
  }

  // Merchandise
  async getMerchandise() {
    const response = await this.client.get('/merchandise');
    return response.data;
  }

  async getMerchandiseItem(itemId: string) {
    const response = await this.client.get(`/merchandise/${itemId}`);
    return response.data;
  }

  async createMerchandise(data: any) {
    const response = await this.client.post('/merchandise', data);
    return response.data;
  }

  async updateMerchandise(itemId: string, data: any) {
    const response = await this.client.put(`/merchandise/${itemId}`, data);
    return response.data;
  }

  async deleteMerchandise(itemId: string) {
    const response = await this.client.delete(`/merchandise/${itemId}`);
    return response.data;
  }

  async createMerchandiseOrder(items: { merchandise_id: string; size: string; quantity: number }[], notes?: string) {
    const response = await this.client.post('/merchandise/order', { items, notes });
    return response.data;
  }

  async getMyMerchandiseOrders() {
    const response = await this.client.get('/merchandise/orders/my');
    return response.data;
  }

  async getAllMerchandiseOrders(center?: string, status?: string) {
    const response = await this.client.get('/merchandise/orders/all', { params: { center, status } });
    return response.data;
  }

  async updateMerchandiseOrderStatus(orderId: string, newStatus: string) {
    const response = await this.client.put(`/merchandise/orders/${orderId}/status`, null, { params: { new_status: newStatus } });
    return response.data;
  }

  // Workouts
  async createWorkout(data: any) {
    const response = await this.client.post('/workouts', data);
    return response.data;
  }

  async getWorkouts(memberId: string) {
    const response = await this.client.get(`/workouts/${memberId}`);
    return response.data;
  }

  async updateWorkout(workoutId: string, data: any) {
    const response = await this.client.put(`/workouts/${workoutId}`, data);
    return response.data;
  }

  async deleteWorkout(workoutId: string) {
    const response = await this.client.delete(`/workouts/${workoutId}`);
    return response.data;
  }

  async completeExercise(workoutId: string, exerciseIndex: number) {
    const response = await this.client.put(`/workouts/${workoutId}/complete`, null, {
      params: { exercise_index: exerciseIndex },
    });
    return response.data;
  }

  // Diets
  async createDiet(data: any) {
    const response = await this.client.post('/diets', data);
    return response.data;
  }

  async getDiets(memberId: string) {
    const response = await this.client.get(`/diets/${memberId}`);
    return response.data;
  }

  async updateDiet(dietId: string, data: any) {
    const response = await this.client.put(`/diets/${dietId}`, data);
    return response.data;
  }

  async deleteDiet(dietId: string) {
    const response = await this.client.delete(`/diets/${dietId}`);
    return response.data;
  }

  // Payments
  async createPayment(data: any) {
    const response = await this.client.post('/payments', data);
    return response.data;
  }

  async getPayments(memberId: string) {
    const response = await this.client.get(`/payments/${memberId}`);
    return response.data;
  }

  // Dashboard
  async getAdminDashboard(center?: string) {
    const response = await this.client.get('/dashboard/admin', { params: { center } });
    return response.data;
  }

  async getTrainerDashboard() {
    const response = await this.client.get('/dashboard/trainer');
    return response.data;
  }

  async getMemberDashboard() {
    const response = await this.client.get('/dashboard/member');
    return response.data;
  }
}

export const api = new ApiService();
