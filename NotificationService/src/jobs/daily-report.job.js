const cron = require('node-cron');
const zaloService = require('../services/zalo.service');
const reportService = require('../services/report.service');
const emailService = require('../services/email.service');

/**
 * Scheduled job: Gửi báo cáo hàng ngày lúc 9h sáng
 * Cron format: "0 9 * * *" = 9:00 AM mỗi ngày
 */
function initDailyReportJob() {
  console.log('[DailyReportJob] Initialized - will run at 9:00 AM daily');

  // Chạy lúc 9h sáng mỗi ngày
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('[DailyReportJob] Starting at', new Date().toLocaleString('vi-VN'));
      
      // 1. Generate báo cáo
      const reportData = await reportService.generateDailyReport();
      
      // 2. Lưu vào database
      const reportId = await reportService.saveReport(reportData);
      console.log('[DailyReportJob] Report saved, ID:', reportId);

      // 3. Gửi via Zalo
      const message = zaloService.formatDailyReport(reportData);
      const buttons = [
        {
          label: '📊 Xem chi tiết',
          payload: `SHOW_REPORT_${reportId || 'latest'}`
        },
        {
          label: '📥 Xuất Excel',
          payload: 'EXPORT_REPORT'
        }
      ];

      await zaloService.sendMessageWithButtons(message, buttons);
      console.log('[DailyReportJob] Zalo message sent successfully');

      // 4. Gửi backup via email (optional)
      if (process.env.EMAIL_USER && process.env.ADMIN_EMAIL) {
        const html = zaloService.formatDailyReportHTML(reportData);
        await emailService.sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `📊 Báo cáo hàng ngày - ${new Date().toLocaleDateString('vi-VN')}`,
          template: 'daily-report',
          data: reportData
        }).catch(err => console.warn('[DailyReportJob] Email backup failed:', err.message));
      }

      console.log('[DailyReportJob] Completed successfully');
    } catch (error) {
      console.error('[DailyReportJob] Error:', error.message);
      
      // Gửi error notification nếu có
      try {
        await zaloService.sendMessage(
          `⚠️ LỖI: Không thể tạo báo cáo hôm nay\n${error.message}`
        );
      } catch (notifyErr) {
        console.error('[DailyReportJob] Failed to send error notification:', notifyErr.message);
      }
    }
  });
}

/**
 * For testing: Chạy báo cáo ngay lập tức (giờ + 1 phút)
 */
async function runReportNow() {
  console.log('[DailyReportJob] Running report manually...');
  try {
    const reportData = await reportService.generateDailyReport();
    const message = zaloService.formatDailyReport(reportData);
    
    console.log('[DailyReportJob] Report generated:');
    console.log(message);
    
    await zaloService.sendMessage(message);
    console.log('[DailyReportJob] Report sent to Zalo');
    
    return reportData;
  } catch (error) {
    console.error('[DailyReportJob] Error running report:', error.message);
    throw error;
  }
}

module.exports = {
  initDailyReportJob,
  runReportNow
};
