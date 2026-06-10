require('dotenv').config({ path: '.env.test' });

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Suppress console logs during tests (optional)
// global.console.log = jest.fn();
// global.console.error = jest.fn();
