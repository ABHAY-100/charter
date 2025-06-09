import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

import certificateRouter from './routes/certificate.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1', certificateRouter);

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Charter is Alive!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
