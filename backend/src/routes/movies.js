import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { Movie } from '../models/Movie.js';
import { verifyToken } from './auth.js';
import { logActivity } from '../config/logger.js';

const router = express.Router();

// Cache for OMDB API results (simple in-memory cache)
const apiCache = new Map();
const CACHE_TTL = 3600000; // 1 hour

async function fetchFromOMDB(searchQuery) {
  if (!process.env.OMDB_API_KEY) {
    return { Search: [] };
  }

  const cacheKey = `omdb_${searchQuery}`;

  if (apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    apiCache.delete(cacheKey);
  }

  try {
    const response = await fetch(
      `https://www.omdbapi.com/?s=${encodeURIComponent(searchQuery)}&apikey=${process.env.OMDB_API_KEY}`
    );
    const data = await response.json();

    apiCache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    throw new Error('Failed to fetch from OMDB API');
  }
}

// GET /movies - Get all movies from database
router.get('/', verifyToken, async (req, res) => {
  try {
    const movies = await Movie.findAll();
    logActivity(req.userId, 'VIEW_ALL_MOVIES', `Retrieved ${movies.length} movies`);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// GET /movies/search - Search movies
router.get(
  '/search',
  verifyToken,
  [
    query('query')
      .trim()
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ max: 100 })
      .withMessage('Search query must not exceed 100 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const searchQuery = String(req.query.query || '').trim();
    const { external } = req.query;

    try {
      let results = [];

      const localResults = await Movie.search(searchQuery);
      results = localResults;

      if (external === 'true') {
        try {
          const externalData = await fetchFromOMDB(searchQuery);
          if (externalData.Search) {
            results = [
              ...results,
              ...externalData.Search.map((movie) => ({
                imdbID: movie.imdbID,
                title: movie.Title,
                year: parseInt(movie.Year) || null,
                poster: movie.Poster !== 'N/A' ? movie.Poster : null,
                external: true,
              })),
            ];
          }
        } catch (error) {
          console.error('OMDB search error:', error);
        }
      }

      logActivity(req.userId, 'SEARCH_MOVIES', `Query: ${searchQuery}`);
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }
);

// POST /movies - Add a new movie
router.post(
  '/',
  verifyToken,
  [
    body('imdbID').trim().notEmpty().withMessage('IMDb ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('year').optional({ checkFalsy: true }).isInt().withMessage('Year must be a number'),
    body('poster').optional({ checkFalsy: true }).isURL().withMessage('Poster must be a valid URL'),
    body('plot').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).withMessage('Plot must not exceed 1000 characters'),
    body('genre').optional({ checkFalsy: true }).trim(),
    body('director').optional({ checkFalsy: true }).trim(),
    body('actors').optional({ checkFalsy: true }).trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const movieData = {
        imdbID: req.body.imdbID.trim(),
        title: req.body.title.trim(),
        year: req.body.year ? parseInt(req.body.year, 10) : null,
        poster: req.body.poster?.trim() || null,
        plot: req.body.plot?.trim() || null,
        genre: req.body.genre?.trim() || null,
        director: req.body.director?.trim() || null,
        actors: req.body.actors?.trim() || null,
      };

      const result = await Movie.create(movieData, req.userId);
      logActivity(req.userId, 'INSERT_MOVIE', `Added: ${movieData.title}`);

      res.status(201).json({
        message: 'Movie added successfully',
        id: result.id,
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(400).json({ error: 'Movie already exists in database' });
      }
      console.error('Insert error:', error);
      res.status(500).json({ error: 'Failed to add movie' });
    }
  }
);

// GET /movies/user/:userId - Get movies added by a user
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const movies = await Movie.getUserMovies(req.params.userId);
    logActivity(req.userId, 'VIEW_USER_MOVIES', `User: ${req.params.userId}`);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user movies' });
  }
});

export default router;