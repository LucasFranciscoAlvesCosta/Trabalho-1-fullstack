import { runAsync, allAsync, getAsync } from '../config/database.js';

export class Movie {
  static async create(movieData, userId) {
    const {
      imdbID,
      title,
      year,
      poster,
      plot,
      genre,
      director,
      actors
    } = movieData;

    try {
      const result = await runAsync(
        `INSERT INTO movies 
         (imdbID, title, year, poster, plot, genre, director, actors, added_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [imdbID, title, year, poster, plot, genre, director, actors, userId]
      );
      return result;
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Movie already exists in database');
      }
      throw error;
    }
  }

  static async findAll() {
    return await allAsync(
      `SELECT id, imdbID, title, year, poster, plot, genre, director, actors, created_at 
       FROM movies ORDER BY created_at DESC`
    );
  }

  static async search(query) {
    // Previne SQL injection
    const safeQuery = `%${query.replace(/[%_]/g, '\\$&')}%`;
    
    return await allAsync(
      `SELECT id, imdbID, title, year, poster, plot, genre, director, actors, created_at 
       FROM movies 
       WHERE title LIKE ? OR director LIKE ? OR actors LIKE ? OR genre LIKE ?
       ORDER BY created_at DESC`,
      [safeQuery, safeQuery, safeQuery, safeQuery]
    );
  }

  static async findById(id) {
    return await getAsync(
      'SELECT * FROM movies WHERE id = ?',
      [id]
    );
  }

  static async findByImdbId(imdbID) {
    return await getAsync(
      'SELECT * FROM movies WHERE imdbID = ?',
      [imdbID]
    );
  }

  static async getUserMovies(userId) {
    return await allAsync(
      `SELECT id, imdbID, title, year, poster, plot, genre, director, actors, created_at 
       FROM movies WHERE added_by = ? ORDER BY created_at DESC`,
      [userId]
    );
  }
}
