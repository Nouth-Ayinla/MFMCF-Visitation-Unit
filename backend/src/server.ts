import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from '@infrastructure/database/connection';
import routes from '@presentation/routes';
import { errorHandler } from '@application/middleware/errorHandler.middleware';
import { swaggerSpec } from './config/swagger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true, // Allow cookies
  })
);
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser(process.env.COOKIE_SECRET)); // Parse cookies

// Swagger documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MFMCF Visitation API',
}));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(PORT, () => {
      /* eslint-disable no-console */
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
      console.log(`📚 Docs: http://localhost:${PORT}/docs`);
      /* eslint-enable no-console */
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
