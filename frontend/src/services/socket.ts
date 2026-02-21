import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config/backend';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected && this.userId === userId) {
      return;
    }

    this.userId = userId;
    this.socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.socket?.emit('register', { user_id: userId });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.log('Socket connection error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userId = null;
    }
  }

  onMessage(callback: (message: any) => void) {
    if (this.socket && this.userId) {
      this.socket.on(`message_${this.userId}`, callback);
    }
  }

  offMessage() {
    if (this.socket && this.userId) {
      this.socket.off(`message_${this.userId}`);
    }
  }

  onAnnouncement(callback: (announcement: any) => void) {
    if (this.socket && this.userId) {
      this.socket.on('announcement', callback);
      this.socket.on(`announcement_${this.userId}`, callback);
    }
  }

  offAnnouncement() {
    if (this.socket && this.userId) {
      this.socket.off('announcement');
      this.socket.off(`announcement_${this.userId}`);
    }
  }

  onTyping(callback: (data: { sender_id: string }) => void) {
    if (this.socket && this.userId) {
      this.socket.on(`typing_${this.userId}`, callback);
    }
  }

  emitTyping(receiverId: string) {
    if (this.socket && this.userId) {
      this.socket.emit('typing', { receiver_id: receiverId, sender_id: this.userId });
    }
  }
}

export const socketService = new SocketService();
