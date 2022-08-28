import { ApolloLoggerPlugin } from './plugin'
import { jest, test } from '@jest/globals'

const logger = {
  level: 'info',

  silent: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  fatal: jest.fn(),
  warn: jest.fn(),
  trace: jest.fn(),
  error: jest.fn(),
  child: () => ({
    level: 'info',

    silent: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    warn: jest.fn(),
    trace: jest.fn(),
    error: jest.fn(),
  }),
}

test('server logging', async () => {
  logger.level = 'info'
  const plugin = ApolloLoggerPlugin({ logger })
  const { serverWillStop } = await plugin.serverWillStart()

  await serverWillStop()

  expect(logger.info).toHaveBeenCalledWith('Starting GraphQL on "/graphql"')
  expect(logger.info).toHaveBeenCalledWith('Stopping GraphQL on "/graphql"')
})

test('request logging', async () => {
  logger.level = 'info'
  const plugin = ApolloLoggerPlugin({ logger })
  const { willSendResponse, didResolveOperation } =
    await plugin.requestDidStart()

  await didResolveOperation()
  await willSendResponse()

  expect(logger.info).toHaveBeenCalledWith('Started query TestQuery')
  expect(logger.info).toHaveBeenCalledWith('Parameters: {"foo": "bar"}')
  expect(logger.info).toHaveBeenCalledWith('Completed query TestQuery in 0ms')
})

test('debug logging', async () => {
  logger.level = 'debug'
  const plugin = ApolloLoggerPlugin({ logger })
  const {
    didResolveSource,
    parsingDidStart,
    validationDidStart,
    executionDidStart,
    willSendResponse,
  } = plugin.requestDidStart()
  const parsingDidEnd = await parsingDidStart()
  const validationDidEnd = await validationDidStart()
  const executionDidEnd = await executionDidStart()

  await didResolveSource()
  await parsingDidEnd()
  await validationDidEnd()
  await executionDidEnd()
  await willSendResponse()

  expect(logger.debug).toHaveBeenCalledWith('Starting GraphQL request...')
  expect(logger.debug).toHaveBeenCalledWith('Parsing source...')
  expect(logger.debug).toHaveBeenCalledWith('Parsing complete')
  expect(logger.debug).toHaveBeenCalledWith('Validating GraphQL document...')
  expect(logger.debug).toHaveBeenCalledWith(
    'Validation complete. Document cached.'
  )
  expect(logger.debug).toHaveBeenCalledWith('Executing query TestQuery...')
})
