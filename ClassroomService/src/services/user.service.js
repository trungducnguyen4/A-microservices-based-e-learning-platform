const axios = require('axios');
const appConfig = require('../config/app.config');

/**
 * Service để lấy thông tin user từ UserService
 */
class UserService {
  constructor() {
    this.baseUrl = appConfig.userServiceUrl;
  }

  /**
   * Lấy thông tin user từ UserService
   */
  async getUserInfo(userId) {
    try {
      console.log(`[UserService] Fetching user info for userId: ${userId}`);
      
      const response = await axios.get(`${this.baseUrl}/api/users/public/${userId}`);
      
      if (response.data && response.data.result) {
        const userInfo = response.data.result;
        console.log(`[UserService] User info retrieved: ${userInfo.fullName || userInfo.username}`);
        return userInfo;
      }

      return null;
    } catch (error) {
      console.warn(`[UserService] Failed to fetch user info for ${userId}:`, error.message);
      return null;
    }
  }

  /**
   * Lấy display name từ user info
   */
  getDisplayName(userInfo, defaultName = 'Anonymous') {
    if (!userInfo) return defaultName;
    return userInfo.fullName || userInfo.username || userInfo.email || defaultName;
  }
}

// Singleton instance
const userService = new UserService();

module.exports = userService;
