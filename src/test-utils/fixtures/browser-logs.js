export const TEST_TIMESTAMP = 1705316400000

export const browserEvents = {
  error: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error',
    level: 'error',
    action: 'error'
  },
  errorWithoutLevel: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error',
    action: 'error'
  },
  errorWithoutAction: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error',
    level: 'error'
  },
  warn: {
    timestamp: TEST_TIMESTAMP,
    message: 'Warning message',
    level: 'warn',
    action: 'warning'
  },
  info: {
    timestamp: TEST_TIMESTAMP,
    message: 'Info message',
    level: 'info',
    action: 'info'
  },
  debug: {
    timestamp: TEST_TIMESTAMP,
    message: 'Debug message',
    level: 'debug',
    action: 'debug'
  },
  minimal: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error'
  },
  trace: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error',
    level: 'trace'
  },
  invalidTimestamp: {
    timestamp: 'invalid',
    message: 'Test error'
  }
}
