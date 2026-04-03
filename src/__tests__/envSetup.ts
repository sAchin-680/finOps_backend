/**
 * Runs synchronously before any module imports in every test file.
 * Sets env vars so src/config/env.ts validation passes at import time.
 */
process.env.NODE_ENV = 'test'
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/finops-test' // placeholder; overridden by MongoMemoryServer in each suite
process.env.JWT_SECRET = 'test-jwt-secret-minimum-16-chars-ok'
process.env.JWT_EXPIRES_IN = '1h'
process.env.PORT = '5001'
