const axios = require('axios');
const db = require('../config/db.config');

class ReportService {
  /**
   * Lấy tất cả dữ liệu cần thiết cho báo cáo hôm qua
   */
  async generateDailyReport() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const tomorrow = new Date();
      tomorrow.setHours(0, 0, 0, 0);

      console.log('[ReportService] Generating report for:', yesterday.toLocaleDateString('vi-VN'));

      const [
        studentsData,
        classesData,
        homeworkData,
        revenueData
      ] = await Promise.all([
        this.getStudentStats(yesterday, tomorrow),
        this.getClassStats(yesterday, tomorrow),
        this.getHomeworkStats(yesterday, tomorrow),
        this.getRevenueStats(yesterday)
      ]);

      return {
        totalStudents: studentsData.total,
        studentsOnline: studentsData.active,
        classesHeld: classesData,
        homeworkSubmitted: homeworkData.submitted,
        homeworkMissing: homeworkData.missing,
        overdueHomework: homeworkData.overdue,
        revenue: revenueData
      };
    } catch (error) {
      console.error('[ReportService] Error generating report:', error.message);
      throw error;
    }
  }

  /**
   * Lấy stats học sinh - gọi UserService
   */
  async getStudentStats(startDate, endDate) {
    try {
      const response = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/users/stats`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          timeout: 5000
        }
      );

      return {
        total: response.data.totalStudents || 0,
        active: response.data.activeStudents || 0
      };
    } catch (error) {
      console.warn('[ReportService] UserService unavailable, using fallback:', error.message);
      return { total: 0, active: 0 };
    }
  }

  /**
   * Lấy stats lớp học - gọi ScheduleService
   */
  async getClassStats(startDate, endDate) {
    try {
      const response = await axios.get(
        `${process.env.SCHEDULE_SERVICE_URL}/api/schedule/stats`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          timeout: 5000
        }
      );

      return {
        total: response.data.totalClasses || 0,
        onlineCount: response.data.onlineClasses || 0,
        fullClasses: response.data.fullClasses || 0
      };
    } catch (error) {
      console.warn('[ReportService] ScheduleService unavailable, using fallback:', error.message);
      return { total: 0, onlineCount: 0, fullClasses: 0 };
    }
  }

  /**
   * Lấy stats bài tập - gọi HomeworkService
   */
  async getHomeworkStats(startDate, endDate) {
    try {
      const response = await axios.get(
        `${process.env.HOMEWORK_SERVICE_URL}/api/homework/stats`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          timeout: 5000
        }
      );

      return {
        submitted: response.data.submitted || 0,
        missing: response.data.missing || 0,
        overdue: response.data.overdue || 0
      };
    } catch (error) {
      console.warn('[ReportService] HomeworkService unavailable, using fallback:', error.message);
      return { submitted: 0, missing: 0, overdue: 0 };
    }
  }

  /**
   * Lấy doanh thu - từ database nếu có, hoặc từ PaymentService
   */
  async getRevenueStats(startDate) {
    try {
      // Lấy doanh thu hôm qua từ DB (nếu có PaymentService)
      const [yesterdayRevenue] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM payments 
         WHERE DATE(created_at) = DATE(?)`,
        [startDate]
      );

      // Lấy doanh thu tháng này
      const [monthRevenue] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM payments 
         WHERE MONTH(created_at) = MONTH(NOW()) 
         AND YEAR(created_at) = YEAR(NOW())`
      );

      // Lấy doanh thu year to date
      const [ytdRevenue] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) as total 
         FROM payments 
         WHERE YEAR(created_at) = YEAR(NOW())`
      );

      return {
        yesterday: yesterdayRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0,
        ytd: ytdRevenue[0]?.total || 0
      };
    } catch (error) {
      console.warn('[ReportService] Revenue query error, returning 0:', error.message);
      return { yesterday: 0, month: 0, ytd: 0 };
    }
  }

  /**
   * Lưu báo cáo vào database để track history
   */
  async saveReport(reportData) {
    try {
      const [result] = await db.execute(
        `INSERT INTO daily_reports (
          date, total_students, students_online, 
          classes_held, classes_online, homework_submitted, 
          homework_missing, homework_overdue, revenue
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          new Date(),
          reportData.totalStudents,
          reportData.studentsOnline,
          reportData.classesHeld.total,
          reportData.classesHeld.onlineCount,
          reportData.homeworkSubmitted,
          reportData.homeworkMissing,
          reportData.overdueHomework,
          reportData.revenue.yesterday || 0
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('[ReportService] Save report error:', error.message);
      // Don't throw - báo cáo Zalo vẫn cần gửi
      return null;
    }
  }

  /**
   * Lấy báo cáo từ database (cho dashboard admin)
   */
  async getReports(limit = 30) {
    try {
      const [reports] = await db.execute(
        `SELECT * FROM daily_reports 
         ORDER BY date DESC 
         LIMIT ?`,
        [limit]
      );
      return reports;
    } catch (error) {
      console.error('[ReportService] Get reports error:', error.message);
      return [];
    }
  }
}

module.exports = new ReportService();
