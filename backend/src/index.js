// 1. Import thư viện & Config
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// 2. Import Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

// 3. Import Error Handlers
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 4. General Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api', publicRoutes);

// 6. Error Handlers (phải nằm cuối cùng)
app.use(notFound);
app.use(errorHandler);

// 7. Khởi động server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
