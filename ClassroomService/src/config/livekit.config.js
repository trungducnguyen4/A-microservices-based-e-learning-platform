require('dotenv').config();

module.exports = {
  apiKey: process.env.LIVEKIT_API_KEY,
  apiSecret: process.env.LIVEKIT_API_SECRET,
  url: process.env.LIVEKIT_URL,
  
  /**
   * Kiểm tra config có đầy đủ không
   * @returns {boolean} true nếu config đầy đủ, false nếu thiếu
   */
  validateConfig() {
    return !!(this.apiKey && this.apiSecret && this.url);
  }
};
