const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Load and compile template
  async getTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      console.error(`[EmailService] Template error for ${templateName}:`, error);
      throw error;
    }
  }

  // Send email
  async sendEmail({ to, subject, template, data, attachments }) {
    try {
      const html = await this.getTemplate(template, data);

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'E-Learning Platform <noreply@elearning.com>',
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('[EmailService] Send email error:', error);
      throw error;
    }
  }

  // Send homework deadline reminder
  async sendHomeworkReminder(studentEmail, homeworkData) {
    return this.sendEmail({
      to: studentEmail,
      subject: `Reminder: ${homeworkData.title} - Due ${homeworkData.dueDate}`,
      template: 'homework-reminder',
      data: homeworkData
    });
  }

  // Send class starting reminder
  async sendClassReminder(participantEmail, classData) {
    return this.sendEmail({
      to: participantEmail,
      subject: `Class Starting Soon: ${classData.title}`,
      template: 'class-reminder',
      data: classData
    });
  }

  // Send grade notification
  async sendGradeNotification(studentEmail, gradeData) {
    return this.sendEmail({
      to: studentEmail,
      subject: `Grade Posted: ${gradeData.homeworkTitle}`,
      template: 'grade-notification',
      data: gradeData
    });
  }

  // Send calendar invite
  async sendCalendarInvite(attendeeEmail, eventData) {
    return this.sendEmail({
      to: attendeeEmail,
      subject: `Calendar Invite: ${eventData.title}`,
      template: 'calendar-invite',
      data: eventData
    });
  }
}

module.exports = new EmailService();
