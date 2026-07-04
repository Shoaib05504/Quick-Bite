/**
 * Simple in-memory cache middleware.
 * Use for read-heavy, infrequently-changing endpoints (e.g., food list).
 * @param {number} ttlSeconds - Cache TTL in seconds
 */
const cache = new Map();

export const cacheMiddleware = (ttlSeconds = 60) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode === 200 && data?.success !== false) {
        cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear a specific cache key or all cache entries.
 * Call this after food add/remove to invalidate the food list cache.
 */
export const clearCache = (urlPattern) => {
  if (!urlPattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(urlPattern)) {
      cache.delete(key);
    }
  }
};
