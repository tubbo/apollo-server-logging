import { Logger } from 'pino'
import { jest } from '@jest/globals'

export let childLogger: Logger

export const mockLogger = () =>
  ({
    level: 'info',

    silent: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    warn: jest.fn(),
    trace: jest.fn(),
    error: jest.fn(),
    child: () => {
      childLogger = {
        level: 'info',

        silent: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        fatal: jest.fn(),
        warn: jest.fn(),
        trace: jest.fn(),
        error: jest.fn(),
      } as unknown as Logger

      return childLogger
    },
  } as unknown as Logger)
