import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../movies.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

db.run('PRAGMA foreign_keys = ON');

export function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function ensureTokenVersionColumn() {
  const columns = await allAsync('PRAGMA table_info(users)');
  const hasTokenVersion = columns.some((column) => column.name === 'token_version');

  if (!hasTokenVersion) {
    await runAsync(
      'ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0'
    );
  }
}

async function seedDemoData() {
  const adminPassword = await bcrypt.hash('Admin123', 10);

  await runAsync(
    `
    INSERT INTO users (username, password, token_version)
    VALUES (?, ?, 0)
    ON CONFLICT(username)
    DO UPDATE SET
      password = excluded.password,
      token_version = 0
    `,
    ['admin', adminPassword]
  );

  const adminUser = await getAsync(
    'SELECT id FROM users WHERE username = ?',
    ['admin']
  );

  const movieCount = await getAsync(
    'SELECT COUNT(*) AS count FROM movies'
  );

  if ((movieCount?.count ?? 0) === 0) {
    const seedMovies = [
      {
        imdbID: 'tt0111161',
        title: 'The Shawshank Redemption',
        year: 1994,
        poster: null,
        plot: 'Two imprisoned men bond over years and find hope in the darkest place.',
        genre: 'Drama',
        director: 'Frank Darabont',
        actors: 'Tim Robbins, Morgan Freeman',
      },
      {
        imdbID: 'tt0068646',
        title: 'The Godfather',
        year: 1972,
        poster: null,
        plot: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
        genre: 'Crime, Drama',
        director: 'Francis Ford Coppola',
        actors: 'Marlon Brando, Al Pacino',
      },
      {
        imdbID: 'tt0468569',
        title: 'The Dark Knight',
        year: 2008,
        poster: null,
        plot: 'Batman faces the Joker, a criminal mastermind who plunges Gotham into chaos.',
        genre: 'Action, Crime, Drama',
        director: 'Christopher Nolan',
        actors: 'Christian Bale, Heath Ledger',
      },
    ];

    for (const movie of seedMovies) {
      await runAsync(
        `
        INSERT INTO movies
          (imdbID, title, year, poster, plot, genre, director, actors, added_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          movie.imdbID,
          movie.title,
          movie.year ?? null,
          movie.poster ?? null,
          movie.plot ?? null,
          movie.genre ?? null,
          movie.director ?? null,
          movie.actors ?? null,
          adminUser?.id ?? null,
        ]
      );
    }

    console.log('Seed movies created successfully');
  }

  console.log('Seed admin available: admin / Admin123');
}

export async function initializeDatabase() {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      imdbID TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      year INTEGER,
      poster TEXT,
      plot TEXT,
      genre TEXT,
      director TEXT,
      actors TEXT,
      added_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS auth_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      status TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await ensureTokenVersionColumn();
  await seedDemoData();
}

export default db;