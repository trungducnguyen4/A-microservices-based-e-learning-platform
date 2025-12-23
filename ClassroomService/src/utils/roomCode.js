/**
 * Tạo room code format: XXX-YYYY-ZZZ
 */
function generateRoomCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  
  const randomSegment = (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const part1 = randomSegment(3);
  const part2 = randomSegment(4);
  const part3 = randomSegment(3);

  return `${part1}-${part2}-${part3}`;
}

/**
 * Validate room code format
 */
function isValidRoomCode(roomCode) {
  if (!roomCode || typeof roomCode !== 'string') {
    return false;
  }

  // Format: xxx-yyyy-zzz (12 characters including dashes)
  const pattern = /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
  return pattern.test(roomCode);
}

/**
 * Sanitize room code (lowercase, remove spaces)
 */
function sanitizeRoomCode(roomCode) {
  if (!roomCode) return '';
  return roomCode.toLowerCase().trim();
}

module.exports = {
  generateRoomCode,
  isValidRoomCode,
  sanitizeRoomCode,
};
