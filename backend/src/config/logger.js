import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(
  logDir,
  `server-${new Date().toISOString().split('T')[0]}.log`
);

export function logAuthAttempt(username, status, ipAddress, userAgent) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] AUTH ${status} - User: ${username}, IP: ${ipAddress}, UA: ${userAgent}\n`;
  fs.appendFileSync(logFile, message);
}

export function logActivity(userId, action, details) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ACTIVITY - User ID: ${userId}, Action: ${action}, Details: ${details}\n`;
  fs.appendFileSync(logFile, message);
}

export function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ERROR ${context} - ${error.message}\n${error.stack}\n`;
  fs.appendFileSync(logFile, message);
}