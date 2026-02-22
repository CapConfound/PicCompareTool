import express from 'express';
import cors from 'cors';
import { configRouter } from './routes/config.routes.js';
import { filesRouter } from './routes/files.routes.js';
import { imagesRouter } from './routes/images.routes.js';
import { groupsRouter } from './routes/groups.routes.js';
import { rankingRouter } from './routes/ranking.routes.js';

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.use('/api', configRouter);
app.use('/api', filesRouter);
app.use('/api', imagesRouter);
app.use('/api', groupsRouter);
app.use('/api', rankingRouter);

app.listen(PORT, () => {
  console.log(`PicCompareTool server on http://localhost:${PORT}`);
});
