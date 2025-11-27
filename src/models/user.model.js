import { listRecords, upsertRecord } from '../db.js';

function listUsers() {
  return listRecords('users');
}

function addUser(payload) {
  const users = listUsers();
  if (!payload?.username || !payload?.password) return { error: 'invalid_user' };
  if (users.some((u) => u.username === payload.username)) {
    return { error: 'user_exists' };
  }
  const record = { id: payload.username, username: payload.username, password: payload.password };
  upsertRecord('users', record.id, record);
  return { username: payload.username };
}

export { addUser, listUsers };
