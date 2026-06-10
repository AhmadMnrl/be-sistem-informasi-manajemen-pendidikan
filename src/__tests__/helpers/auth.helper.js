const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * Generate JWT token untuk testing
 */
const generateToken = (userId, role = 'ADMIN') => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret-key-12345',
    { expiresIn: '12h' }
  );
};

/**
 * Create hash password untuk testing
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

/**
 * Mock user data dengan token
 */
const createMockAuthUser = (overrides = {}) => {
  const user = {
    id: 1,
    name: 'Admin Test',
    email: 'admin@test.local',
    role: 'ADMIN',
    ...overrides,
  };

  return {
    user,
    token: generateToken(user.id, user.role),
  };
};

module.exports = {
  generateToken,
  hashPassword,
  createMockAuthUser,
};
