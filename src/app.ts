import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/auth.route.ts';
import dossierRoutes from './routes/dossier.routes.ts';
import documentRoute from './routes/document.route.ts';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://web-mq3l.onrender.com'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api', documentRoute);

export default app;
