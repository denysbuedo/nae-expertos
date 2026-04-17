import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Import routes
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import ordersRouter from './routes/orders';
import activitiesRouter from './routes/activities';
import subactivitiesRouter from './routes/subactivities';
import deliverablesRouter from './routes/deliverables';
import deliverableAssignmentsRouter from './routes/deliverableAssignments';
import profilesRouter from './routes/profiles';
import assignmentsRouter from './routes/assignments';
import expertPoolRouter from './routes/expertPool';
import { authenticateToken, requireWrite } from './middleware/auth';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(morgan('combined')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
// Public routes
app.use('/api/v1/auth', authRouter);
// Users routes (all require admin)
app.use('/api/v1/users', usersRouter);

// Write permission middleware for mutable routes
const ensureWritePermissions = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return requireWrite(req as any, res, next);
  }
  next();
};

// Protected routes (require authentication + correct router mounting)
const protectedRoutes = [
  { path: '/api/v1/orders', router: ordersRouter },
  { path: '/api/v1/activities', router: activitiesRouter },
  { path: '/api/v1/subactivities', router: subactivitiesRouter },
  { path: '/api/v1/deliverables', router: deliverablesRouter },
  { path: '/api/v1/deliverable-assignments', router: deliverableAssignmentsRouter },
  { path: '/api/v1/profiles', router: profilesRouter },
  { path: '/api/v1/assignments', router: assignmentsRouter },
  { path: '/api/v1/expert-pool', router: expertPoolRouter }
];

protectedRoutes.forEach(({ path, router }) => {
  app.use(path, authenticateToken, ensureWritePermissions, router);
});

// API info endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'NAE Experts Management API',
    version: '1.0.0',
    endpoints: {
      orders: '/api/v1/orders',
      activities: '/api/v1/activities',
      subactivities: '/api/v1/subactivities',
      deliverables: '/api/v1/deliverables',
      deliverableAssignments: '/api/v1/deliverable-assignments',
      profiles: '/api/v1/profiles',
      assignments: '/api/v1/assignments',
      expertPool: '/api/v1/expert-pool',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
