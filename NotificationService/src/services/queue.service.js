const Queue = require('bull');
const emailService = require('./email.service');

class QueueManager {
  constructor() {
    this.queues = {};
    
    // Email queue
    this.queues.email = new Queue('email-notifications', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    // Calendar queue
    this.queues.calendar = new Queue('calendar-events', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      }
    });

    this.setupProcessors();
  }

  setupProcessors() {
    // Email processor
    this.queues.email.process(async (job) => {
      const { to, subject, template, data, type } = job.data;
      
      console.log(`[QueueManager] Processing email job: ${job.id}`);
      
      if (type === 'homework_reminder') {
        // Handle homework reminder
        return this.processHomeworkReminder(job.data);
      } else if (type === 'class_reminder') {
        // Handle class reminder
        return this.processClassReminder(job.data);
      } else {
        // Standard email
        return emailService.sendEmail({ to, subject, template, data });
      }
    });

    // Calendar processor
    this.queues.calendar.process(async (job) => {
      console.log(`[QueueManager] Processing calendar job: ${job.id}`);
      // Process calendar events
    });

    // Error handlers
    this.queues.email.on('failed', (job, err) => {
      console.error(`[QueueManager] Email job ${job.id} failed:`, err);
    });

    this.queues.calendar.on('failed', (job, err) => {
      console.error(`[QueueManager] Calendar job ${job.id} failed:`, err);
    });
  }

  async processHomeworkReminder(data) {
    const { homeworkId, studentIds } = data;
    // Fetch homework details and send to each student
    // Implementation depends on integration with HomeworkService
    console.log(`[QueueManager] Processing homework reminder for ${studentIds.length} students`);
  }

  async processClassReminder(data) {
    const { scheduleId, participantIds, minutesBefore } = data;
    // Fetch schedule details and send to each participant
    console.log(`[QueueManager] Processing class reminder for ${participantIds.length} participants`);
  }

  async addToQueue(queueName, data, options = {}) {
    if (!this.queues[queueName]) {
      throw new Error(`Queue ${queueName} does not exist`);
    }

    return this.queues[queueName].add(data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      ...options
    });
  }

  getQueueStatus(queueName) {
    if (!this.queues[queueName]) {
      return null;
    }

    return {
      name: queueName,
      status: 'active'
    };
  }
}

module.exports = new QueueManager();
