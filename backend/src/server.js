require('dotenv').config();
const app = require('./app');
const initDB = require('./models/init');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // 1. Ensure DB is initialized
    await initDB();

    // 2. Start Express
    app.listen(PORT, () => {
      console.log(`🚀 HelioScope Backend Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
