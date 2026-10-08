const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const AppError = require('./utils/AppError');

// Routers
const locationsRouter = require('./routes/v1/locations');
const solarRouter = require('./routes/v1/solar');
const terrainRouter = require('./routes/v1/terrain');
const earthRouter = require('./routes/v1/earth');
const analysisRouter = require('./routes/v1/analysis');

const app = express();

// 1. Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow serving DEM files cross-origin
}));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://helios-gpu-three.vercel.app"
  ],
  credentials: true
}));

// 2. Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Logger
app.use(morgan('dev'));

// 4. Rate Limiting (apply to all /api routes)
app.use('/api', apiLimiter);

// 5. Static Files (serve uploaded DEMs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 6. Routes
app.use('/api/v1/locations', locationsRouter);
app.use('/api/v1/solar', solarRouter);
app.use('/api/v1/terrain', terrainRouter);
app.use('/api/v1/earth', earthRouter);
app.use('/api/v1/analysis', analysisRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'UP', timestamp: new Date() });
});

// 7. 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND'));
});

// 8. Global Error Handler
app.use(errorHandler);

module.exports = app;
