import app from './app.js';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './config/database.js';

async function startServer() {
  try {
    console.log('🚀 Initializing CareerPilot AI Backend Service...');

    const dbConnected = await checkDatabaseConnection();
    if (dbConnected) {
      console.log('✅ PostgreSQL Database connected successfully');
    } else {
      console.warn('⚠️  PostgreSQL Database connection failed or unavailable at startup.');
    }

    app.listen(env.PORT, () => {
      console.log(`🌐 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      console.log(`🔗 Health Check URL: http://localhost:${env.PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

startServer();
