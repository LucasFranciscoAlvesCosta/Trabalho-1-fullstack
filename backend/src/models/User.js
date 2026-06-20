import bcrypt from 'bcryptjs';
import { runAsync, getAsync } from '../config/database.js';

export class User {
  static async create(username, password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await runAsync(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    return result.id;
  }

  static async findByUsername(username) {
    return await getAsync(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  static async findById(id) {
    return await getAsync(
      'SELECT id, username, created_at, token_version FROM users WHERE id = ?',
      [id]
    );
  }

  static async validatePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static async bumpTokenVersion(id) {
    return await runAsync(
      'UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = ?',
      [id]
    );
  }
}