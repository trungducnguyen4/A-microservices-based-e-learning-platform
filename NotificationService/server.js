require('dotenv').config();
const express = require('express');
const cors = require('cors');
const notificationRoutes = require('./src/routes/notification.routes');
const calendarRoutes = require('./src/routes/calendar.routes');
const queueManager = require('./src/services/queue.service');
const { initDailyReportJob, runReportNow } = require('./src/jobs/daily-report.job');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NotificationService',
    timestamp: new Date().toISOString(),
    queues: {
      email: queueManager.getQueueStatus('email'),
      calendar: queueManager.getQueueStatus('calendar')
    },
    zalo: {
      enabled: !!process.env.ZALO_ACCESS_TOKEN,
      configuredAdminId: !!process.env.ZALO_ADMIN_ID
    }
  });
});

// Manual trigger for report (testing)
app.post('/api/reports/trigger', async (req, res) => {
  try {
    const reportData = await runReportNow();
    res.json({
      success: true,
      message: 'Report triggered successfully',
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('[NotificationService] Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🔔 NotificationService running on port ${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'Gmail'}`);
  console.log(`📅 Google Calendar: ${process.env.GOOGLE_CALENDAR_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`📱 Zalo Reports: ${process.env.ZALO_ACCESS_TOKEN ? 'Enabled ✓' : 'Disabled (missing token)'}`);
  console.log(`🔗 Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}\n`);

  // Initialize scheduled jobs
  if (process.env.ZALO_ACCESS_TOKEN && process.env.ZALO_ADMIN_ID) {
    initDailyReportJob();
    console.log('✅ Daily report job initialized (9:00 AM)\n');
  } else {
    console.log('⚠️  Zalo credentials missing - daily reports disabled\n');
  }
});

module.exports = app;
