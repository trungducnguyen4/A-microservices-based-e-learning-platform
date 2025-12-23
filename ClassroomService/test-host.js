/**
 * Test script để verify host logic
 */

const roomService = require('./src/services/room.service');

console.log('\n========== TEST HOST LOGIC ==========\n');

// Test 1: Tạo room mới
console.log('Test 1: Tạo room mới');
const roomCode = 'ABC-1234-XYZ';
const userId1 = 'user123';
const room = roomService.createRoom(roomCode, userId1);
console.log('Room created:', {
  roomCode: room.roomCode,
  hostUserId: room.hostUserId,
  createdBy: room.createdBy
});
console.log('✅ Host should be:', userId1);
console.log('');

// Test 2: Thêm host vào room (người tạo join)
console.log('Test 2: Host join room');
roomService.addParticipant(roomCode, {
  identity: 'John Doe',
  name: 'John Doe',
  userId: userId1,
  joinedAt: new Date()
});

const roomAfterHostJoin = roomService.getRoom(roomCode);
const hostParticipant = Array.from(roomAfterHostJoin.participants.values()).find(p => p.userId === userId1);
console.log('Host participant:', {
  name: hostParticipant?.name,
  userId: hostParticipant?.userId,
  isHost: hostParticipant?.isHost
});
console.log('✅ isHost should be: true');
console.log('');

// Test 3: Thêm guest vào room
console.log('Test 3: Guest join room');
const userId2 = 'user456';
roomService.addParticipant(roomCode, {
  identity: 'Jane Smith',
  name: 'Jane Smith',
  userId: userId2,
  joinedAt: new Date()
});

const roomAfterGuestJoin = roomService.getRoom(roomCode);
const guestParticipant = Array.from(roomAfterGuestJoin.participants.values()).find(p => p.userId === userId2);
console.log('Guest participant:', {
  name: guestParticipant?.name,
  userId: guestParticipant?.userId,
  isHost: guestParticipant?.isHost
});
console.log('✅ isHost should be: false');
console.log('');

// Test 4: Check room info
console.log('Test 4: Room info');
const finalRoom = roomService.getRoom(roomCode);
console.log('Room:', {
  roomCode: finalRoom.roomCode,
  hostUserId: finalRoom.hostUserId,
  participantCount: finalRoom.participants.size,
  participants: Array.from(finalRoom.participants.values()).map(p => ({
    name: p.name,
    userId: p.userId,
    isHost: p.isHost
  }))
});

console.log('\n========== TEST COMPLETED ==========\n');
