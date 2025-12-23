/**
 * Room Code Generator Utility
 * Generate unique room codes cho meeting
 */

/**
 * Generate random room code theo format: XXX-YYYY-ZZZ
 * @returns Room code string
 */
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  const generateSegment = (length: number): string => {
    return Array.from(
      { length }, 
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  };
  
  return `${generateSegment(3)}-${generateSegment(4)}-${generateSegment(3)}`;
};

/**
 * Parse room code từ URL hoặc text
 * @param input - Input string có thể chứa room code
 * @returns Room code đã extract hoặc input gốc
 */
export const parseRoomCodeFromInput = (input: string): string => {
  // Nếu là URL, extract room code từ query param
  try {
    const url = new URL(input);
    const roomParam = url.searchParams.get('room');
    if (roomParam) return roomParam;
  } catch {
    // Không phải URL, return input gốc
  }
  
  return input;
};
