const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const requireAuth = require('./middleware/requireAuth');
const { apiLimiter } = require('./middleware/rateLimiter');
const AppError = require('./utils/AppError');
const healthController = require('./controllers/healthController');

// Routers
const locationsRouter = require('./routes/v1/locations');
const solarRouter = require('./routes/v1/solar');
const terrainRouter = require('./routes/v1/terrain');
const earthRouter = require('./routes/v1/earth');
const analysisRouter = require('./routes/v1/analysis');
const authRouter = require('./routes/v1/auth');

const app = express();

// Trust reverse proxy (e.g. for rate-limiting behind Vercel/Nginx)
app.set('trust proxy', 1);

// Build the allowed CORS origins list from env + a dev fallback
const corsOrigins = [env.CLIENT_ORIGIN];
// Keep existing hardcoded prod origin if CLIENT_ORIGIN hasn't been overridden
if (!corsOrigins.includes('https://helios-gpu-three.vercel.app')) {
  corsOrigins.push('https://helios-gpu-three.vercel.app');
}

// 1. Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow serving DEM files cross-origin
}));
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}));

// 2. Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. Logger
app.use(morgan('dev'));

// 4. Rate Limiting (apply to all /api routes)
app.use('/api', apiLimiter);

// 5. Static Files (serve uploaded DEMs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 6. Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/locations', requireAuth, locationsRouter);
app.use('/api/v1/solar', requireAuth, solarRouter);
app.use('/api/v1/terrain', requireAuth, terrainRouter);
app.use('/api/v1/earth', requireAuth, earthRouter);
app.use('/api/v1/analysis', requireAuth, analysisRouter);

// Health check (includes DB ping)
app.get('/api/health', healthController.getHealth);

// 7. 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND'));
});

// 8. Global Error Handler
app.use(errorHandler);

module.exports = app;
