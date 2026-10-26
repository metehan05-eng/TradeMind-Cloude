import { notificationService } from '../domain/notifications/notificationService';
import { startTokenRefreshJob } from './tokenRefreshJob';

export const startSchedulers = (): void => {
  notificationService.initialize();
  startTokenRefreshJob();
};
