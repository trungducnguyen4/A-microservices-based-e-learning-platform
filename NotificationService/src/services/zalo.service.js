const axios = require('axios');

const ZALO_API_BASE = 'https://openapi.zalo.me/v3.0/oa';

class ZaloService {
  constructor() {
    this.accessToken = process.env.ZALO_ACCESS_TOKEN;
    this.adminId = process.env.ZALO_ADMIN_ID;
    this.oaId = process.env.ZALO_OA_ID;
  }

  /**
   * Gửi tin nhắn text tới admin
   */
  async sendMessage(message, options = {}) {
    try {
      if (!this.accessToken || !this.adminId) {
        console.warn('[ZaloService] Missing Zalo credentials, skipping send');
        return null;
      }

      const payload = {
        recipient_id: this.adminId,
        message: {
          text: message
        },
        ...options
      };

      const response = await axios.post(
        `${ZALO_API_BASE}/message/cs/send`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[ZaloService] Message sent:', response.data.message_id);
      return response.data;
    } catch (error) {
      console.error('[ZaloService] Send message error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Gửi tin nhắn với quick reply buttons
   */
  async sendMessageWithButtons(message, buttons) {
    try {
      const payload = {
        recipient_id: this.adminId,
        message: {
          text: message,
          quick_replies: buttons.map(btn => ({
            title: btn.label,
            payload: btn.payload
          }))
        }
      };

      const response = await axios.post(
        `${ZALO_API_BASE}/message/cs/send`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('[ZaloService] Send message with buttons error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Gửi template message (fancy format)
   */
  async sendTemplateMessage(title, elements, buttons = []) {
    try {
      const payload = {
        recipient_id: this.adminId,
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'list',
              top_element_style: 'large',
              elements: elements.map(el => ({
                title: el.title,
                subtitle: el.subtitle,
                image_url: el.imageUrl,
                default_action: {
                  type: 'web_url',
                  url: el.actionUrl || '#'
                }
              })),
              buttons: buttons.map(btn => ({
                title: btn.label,
                type: 'postback',
                payload: btn.payload
              }))
            }
          }
        }
      };

      const response = await axios.post(
        `${ZALO_API_BASE}/message/cs/send`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('[ZaloService] Send template error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Format báo cáo thành text message
   */
  formatDailyReport(data) {
    const {
      totalStudents,
      studentsOnline,
      classesHeld,
      homeworkSubmitted,
      homeworkMissing,
      overdueHomework,
      revenue
    } = data;

    return `📊 BÁO CÁO HÔM QUA (${new Date().toLocaleDateString('vi-VN')})

👥 HOẠT ĐỘNG HỌC SINH:
  • Tổng vào hệ thống: ${totalStudents}
  • Hoàn thành lớp: ${studentsOnline} (${((studentsOnline/totalStudents)*100).toFixed(0)}%)
  • Vắng mặt: ${totalStudents - studentsOnline}

📚 LỚP HỌC:
  • Tổng phiên dạy: ${classesHeld.total}
  • Giảng viên online: ${classesHeld.onlineCount}/${classesHeld.total}
  • Lớp đầy (>30 học sinh): ${classesHeld.fullClasses}

📝 BÀI TẬP:
  • Nộp: ${homeworkSubmitted}
  • Chưa nộp: ${homeworkMissing}
  • Quá hạn: ${overdueHomework} ⚠️

💰 DOANH THU:
  • Hôm qua: ${(revenue.yesterday || 0).toLocaleString('vi-VN')} đ
  • Tháng: ${(revenue.month || 0).toLocaleString('vi-VN')} đ
  • YTD: ${(revenue.ytd || 0).toLocaleString('vi-VN')} đ`;
  }

  /**
   * Format báo cáo thành HTML (dùng cho email backup)
   */
  formatDailyReportHTML(data) {
    const {
      totalStudents,
      studentsOnline,
      classesHeld,
      homeworkSubmitted,
      homeworkMissing,
      overdueHomework,
      revenue
    } = data;

    const onlinePercent = ((studentsOnline/totalStudents)*100).toFixed(0);

    return `
      <h2>📊 BÁO CÁO HÔM QUA</h2>
      <p>${new Date().toLocaleDateString('vi-VN')}</p>
      
      <h3>👥 Hoạt động học sinh</h3>
      <ul>
        <li>Tổng vào hệ thống: <strong>${totalStudents}</strong></li>
        <li>Hoàn thành lớp: <strong>${studentsOnline}</strong> (${onlinePercent}%)</li>
        <li>Vắng mặt: <strong>${totalStudents - studentsOnline}</strong></li>
      </ul>

      <h3>📚 Lớp học</h3>
      <ul>
        <li>Tổng phiên dạy: <strong>${classesHeld.total}</strong></li>
        <li>Giảng viên online: <strong>${classesHeld.onlineCount}/${classesHeld.total}</strong></li>
        <li>Lớp đầy: <strong>${classesHeld.fullClasses}</strong></li>
      </ul>

      <h3>📝 Bài tập</h3>
      <ul>
        <li>Nộp: <strong>${homeworkSubmitted}</strong></li>
        <li>Chưa nộp: <strong>${homeworkMissing}</strong></li>
        <li>Quá hạn: <strong style="color:red">${overdueHomework}</strong> ⚠️</li>
      </ul>

      <h3>💰 Doanh thu</h3>
      <ul>
        <li>Hôm qua: <strong>${(revenue.yesterday || 0).toLocaleString('vi-VN')} đ</strong></li>
        <li>Tháng: <strong>${(revenue.month || 0).toLocaleString('vi-VN')} đ</strong></li>
        <li>YTD: <strong>${(revenue.ytd || 0).toLocaleString('vi-VN')} đ</strong></li>
      </ul>
    `;
  }
}

module.exports = new ZaloService();
