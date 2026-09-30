import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/auth.route.ts';
import dossierRoutes from './routes/dossier.routes.ts';
import documentRoute from './routes/document.route.ts';

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== 'production') {
  app.use(
    cors({
      origin: 'http://localhost:5173',
      credentials: true,
    }),
  );
}

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/dossiers', dossierRoutes);
app.use('/api', documentRoute);

if (process.env.NODE_ENV === 'production') {
  const webDistPath = path.resolve(__dirname, '../../../web/dist');

  app.use(express.static(webDistPath));

  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

export default app;
