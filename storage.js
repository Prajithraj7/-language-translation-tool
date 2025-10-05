import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const historyFile = path.join(dataDir, 'history.json');

export function ensureDataFiles() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf-8');
  if (!fs.existsSync(historyFile)) fs.writeFileSync(historyFile, '{}', 'utf-8');
}

export async function readJson(filePath) {
  const raw = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(raw || 'null');
}

export async function writeJson(filePath, data) {
  const tmp = filePath + '.tmp';
  await fs.promises.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fs.promises.rename(tmp, filePath);
}

export async function findUserByEmail(email) {
  const users = await readJson(usersFile);
  return users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export async function getUserById(id) {
  const users = await readJson(usersFile);
  return users.find(u => u.id === id) || null;
}

export async function createUser({ email, password, name }) {
  const users = await readJson(usersFile);
  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = { id, email, name: name || email, passwordHash, createdAt: new Date().toISOString() };
  users.push(user);
  await writeJson(usersFile, users);
  return { id: user.id, email: user.email, name: user.name };
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(String(password), user.passwordHash);
}

export async function appendHistoryForUser(userId, item) {
  const all = await readJson(historyFile);
  if (!all[userId]) all[userId] = [];
  all[userId].unshift(item);
  // keep last 100 entries per user
  all[userId] = all[userId].slice(0, 100);
  await writeJson(historyFile, all);
}

export async function getHistoryForUser(userId) {
  const all = await readJson(historyFile);
  return all[userId] || [];
}


