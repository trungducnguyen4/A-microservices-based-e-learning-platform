// Test file để verify token generation logic
require('dotenv').config();
const { AccessToken } = require('livekit-server-sdk');

console.log('========================================');
console.log('   LiveKit Token Generation Test');
console.log('========================================\n');

// Test 1: Check environment variables
console.log('[Test 1] Environment Variables:');
console.log('  LIVEKIT_API_KEY:', process.env.LIVEKIT_API_KEY ? '✓ Set' : '✗ Missing');
console.log('  LIVEKIT_API_SECRET:', process.env.LIVEKIT_API_SECRET ? '✓ Set' : '✗ Missing');
console.log('  LIVEKIT_URL:', process.env.LIVEKIT_URL || '✗ Missing');
console.log('  PORT:', process.env.PORT || '4000 (default)');
console.log('');

// Test 2: Try to create a token (like old code)
console.log('[Test 2] Creating Token (Old Code Style):');
try {
  const API_KEY = process.env.LIVEKIT_API_KEY;
  const API_SECRET = process.env.LIVEKIT_API_SECRET;
  
  if (!API_KEY || !API_SECRET) {
    throw new Error('Missing LiveKit credentials');
  }

  const identity = 'testuser123';
  const displayName = 'Test User';
  const roomName = 'test-room';
  
  const token = new AccessToken(API_KEY, API_SECRET, {
    identity: identity,
    metadata: JSON.stringify({
      displayName: displayName,
      userId: 'user-id-123',
      joinedAt: new Date().toISOString()
    })
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const jwt = token.toJwt();
  
  console.log('  ✓ Token created successfully!');
  console.log('  Identity:', identity);
  console.log('  Room:', roomName);
  console.log('  Token length:', jwt.length, 'characters');
  console.log('');
  
} catch (error) {
  console.log('  ✗ Failed to create token');
  console.log('  Error:', error.message);
  console.log('');
}

// Test 3: Test new service structure
console.log('[Test 3] Testing New Service Structure:');
try {
  const livekitConfig = require('./src/config/livekit.config');
  const tokenService = require('./src/services/token.service');
  const roomService = require('./src/services/room.service');
  
  console.log('  ✓ Config loaded');
  console.log('  ✓ TokenService loaded');
  console.log('  ✓ RoomService loaded');
  console.log('  LiveKit configured:', livekitConfig.validateConfig() ? 'Yes' : 'No');
  console.log('');
  
  // Test token generation
  console.log('[Test 4] Token Generation via Service:');
  tokenService.createAccessToken('test-room-123', 'test-user', 'Test User')
    .then(result => {
      console.log('  ✓ Token generated successfully!');
      console.log('  Identity:', result.identity);
      console.log('  Name:', result.name);
      console.log('  Room:', result.roomCode);
      console.log('\n========================================');
      console.log('   All Tests Passed! ✓');
      console.log('========================================\n');
    })
    .catch(error => {
      console.log('  ✗ Token generation failed');
      console.log('  Error:', error.message);
      console.log('  Stack:', error.stack);
      console.log('\n========================================');
      console.log('   Tests Failed! ✗');
      console.log('========================================\n');
    });
    
} catch (error) {
  console.log('  ✗ Failed to load services');
  console.log('  Error:', error.message);
  console.log('  Stack:', error.stack);
  console.log('\n========================================');
  console.log('   Tests Failed! ✗');
  console.log('========================================\n');
}
