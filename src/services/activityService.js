import { STORAGE_KEYS } from '../utils/constants';
import storage from './storageService';
import { generateId } from '../utils/helpers';

const MAX_LOGS = 500;

/** Record an administrative action. Never throws — logging must not block the action. */
export const logActivity = (admin, { action, entityType, entityId, entityName, details = '' }) => {
  try {
    const logs = storage.getAll(STORAGE_KEYS.ACTIVITY_LOGS);
    const entry = {
      id: generateId(),
      adminId: admin?.id || null,
      adminName: admin?.name || 'System',
      action,
      entityType,
      entityId,
      entityName,
      details,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(entry);
    storage.setAll(STORAGE_KEYS.ACTIVITY_LOGS, logs.slice(0, MAX_LOGS));
    return entry;
  } catch (e) {
    console.error('[activity] failed to log', e);
    return null;
  }
};

export const getActivityLogs = () =>
  storage.getAll(STORAGE_KEYS.ACTIVITY_LOGS).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

export default { logActivity, getActivityLogs };
