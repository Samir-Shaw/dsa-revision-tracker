const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { port, clientUrl, nodeEnv } = require('./config/env');
const { testConnection } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const problemsRoutes = require('./routes/problemsRoutes');
const revisionsRoutes = require('./routes/revisionsRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const listsRoutes = require('./routes/listsRoutes');
const importRoutes = require('./routes/importRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: '5mb' })); // generous limit for large paste-imports
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/revisions', revisionsRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/profile', profileRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

async function start() {
  try {
    await testConnection();
  } catch {
    console.error('[app] Starting without a verified DB connection — check your .env');
  }
  app.listen(port, () => {
    console.log(`[app] DSA Revision Tracker API running on port ${port} (${nodeEnv})`);
  });
}

start();

module.exports = app;
