export const pino = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  trace: jest.fn(),
  debug: jest.fn(),
  child: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    trace: jest.fn(),
    debug: jest.fn(),
  }),
})
