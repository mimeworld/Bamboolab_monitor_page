import { randomBytes } from 'node:crypto';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
function number(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}
const jwtSecret = required('JWT_SECRET');
if (Buffer.byteLength(jwtSecret) < 32) throw new Error('JWT_SECRET must be at least 32 bytes');
const encryptionKey = Buffer.from(required('SETTINGS_ENCRYPTION_KEY'), 'base64');
if (encryptionKey.length !== 32) throw new Error('SETTINGS_ENCRYPTION_KEY must be 32 bytes encoded as base64');
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: number('BACKEND_PORT', 3000),
  publicOrigin: required('PUBLIC_ORIGIN'),
  db: { host: process.env.DB_HOST || 'mysql', port: number('DB_PORT', 3306), name: required('DB_NAME'), user: required('DB_USER'), password: required('DB_PASSWORD') },
  jwtSecret, encryptionKey,
  jwtIssuer: process.env.JWT_ISSUER || 'bambu-monitor', jwtAudience: process.env.JWT_AUDIENCE || 'bambu-web', jwtTtl: number('JWT_TTL_SECONDS', 3600),
  cookieSecure: process.env.COOKIE_SECURE !== 'false',
  settingsPath: process.env.SETTINGS_PATH || '/app/data/printer-settings.json',
  printer: { name: process.env.PRINTER_NAME || 'X2D', host: process.env.PRINTER_HOST || '', serial: process.env.PRINTER_SERIAL || '', accessCode: process.env.PRINTER_ACCESS_CODE || '', mqttPort: process.env.MQTT_PORT || '', mqttUsername: process.env.MQTT_USERNAME || '', mqttTopic: process.env.MQTT_REPORT_TOPIC || '', mqttCaPath: process.env.MQTT_CA_PATH || '', cameraSourceUrl: process.env.CAMERA_SOURCE_URL || '' },
  staleSeconds: number('STATUS_STALE_SECONDS', 60), slotMinutes: number('RESERVATION_SLOT_MINUTES', 30), maxHours: number('RESERVATION_MAX_HOURS', 24), horizonDays: number('RESERVATION_HORIZON_DAYS', 30), linkMinutes: number('JOB_LINK_WINDOW_MINUTES', 10),
  bootstrapLogin: process.env.BOOTSTRAP_ADMIN_LOGIN || '', bootstrapPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD || '',
  processId: randomBytes(8).toString('hex')
};
