import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { authRoutes } from "./modules/auth";
import { farmRoutes } from "./modules/farms";
import { errorHandler } from "./common/error-handler";
import { cropRoutes } from './modules/crops';
import { listingRoutes, nestedListingRoutes } from './modules/marketplace';
import { orderRoutes } from './modules/orders';
import { transportRoutes } from './modules/transport';
import { paymentRoutes } from './modules/payments';
// app.ts
import { userReviewRoutes } from './modules/reviews';
import { userRoutes } from './modules/users';
import { dealerRoutes } from './modules/dealers';
import { cooperativeRoutes } from './modules/cooperatives';
import { notificationRoutes } from './modules/notifications';
import { weatherRoutes } from './modules/weather';
import { analyticsRoutes } from './modules/analytics';
import { adminRoutes } from './modules/admin';
import { notFound } from './middlewares/not-found.middleware';

const app = express();

const allowedOrigins = [
  "https://startoview.ng",
  "https://www.startoview.ng",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like curl, mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb', verify: (req, _res, buffer) => { (req as any).rawBody = buffer.toString('utf8'); } }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Cultiva API is running",
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/farms', farmRoutes);
app.use('/api/v1/crops', cropRoutes);
app.use('/api/v1/crops/:cropId/listings', nestedListingRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/transport', transportRoutes);
app.use('/api/v1/users/:userId/reviews', userReviewRoutes);
// app.ts

app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/dealers', dealerRoutes);
app.use('/api/v1/cooperatives', cooperativeRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use(notFound);
// Must be registered LAST — after all routes, so next(err) has somewhere to go
app.use(errorHandler);

export default app;
