import { ApolloLoggerPlugin } from './plugin'
import { jest, test } from '@jest/globals'
import type {
  GraphQLRequestListener,
  GraphQLServerListener,
} from 'apollo-server-plugin-base'

let childLogger
const mockLogger = () => ({
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
    }

    return childLogger
  },
})

test('server logging', async () => {
  const logger = mockLogger()

  logger.level = 'info'
  const { serverWillStart } = ApolloLoggerPlugin({ logger })
  const { serverWillStop } = (await serverWillStart(
    {}
  )) as GraphQLServerListener

  await serverWillStop()

  expect(logger.info).toHaveBeenCalledWith('Starting GraphQL on "/graphql"...')
  expect(logger.info).toHaveBeenCalledWith('Stopping GraphQL on "/graphql"')
})

test('request logging', async () => {
  const logger = mockLogger()
  logger.level = 'info'
  const { requestDidStart } = ApolloLoggerPlugin({ logger })
  const { didResolveOperation, willSendResponse } = (await requestDidStart(
    {}
  )) as GraphQLRequestListener

  await didResolveOperation({
    operation: { operation: 'query' },
    operationName: 'TestQuery',
    request: { variables: { foo: 'bar' } },
  })
  await willSendResponse({
    operation: 'query',
    operationName: 'TestQuery',
  })

  expect(childLogger.info).toHaveBeenCalled()
  expect(childLogger.info).toHaveBeenCalledWith('Started query TestQuery')
  expect(childLogger.info).toHaveBeenCalledWith("Parameters: { foo: 'bar' }")
})

test('debug logging', async () => {
  const logger = mockLogger()
  logger.level = 'debug'
  const { requestDidStart } = ApolloLoggerPlugin({ logger })
  const {
    didResolveSource,
    parsingDidStart,
    validationDidStart,
    executionDidStart,
    willSendResponse,
  } = (await requestDidStart()) as GraphQLRequestListener
  const parsingDidEnd = await parsingDidStart({})
  const validationDidEnd = await validationDidStart({})

  await executionDidStart({
    operationName: 'TestMutation',
    operation: { operation: 'mutation' },
  })
  await didResolveSource({
    source: 'mutation TestMutation { testMutation }',
  })
  await parsingDidEnd()
  await validationDidEnd()
  await willSendResponse({
    operationName: 'TestMutation',
    operation: 'mutation',
  })

  expect(childLogger.debug).toHaveBeenCalledWith('Starting GraphQL request...')
  expect(childLogger.debug).toHaveBeenCalledWith('Parsing source...')
  expect(childLogger.debug).toHaveBeenCalledWith('Parsing complete')
  expect(childLogger.debug).toHaveBeenCalledWith(
    'Validating GraphQL document...'
  )
  expect(childLogger.debug).toHaveBeenCalledWith(
    'Validation complete. Document cached.'
  )
  expect(childLogger.debug).toHaveBeenCalledWith(
    'Executing mutation TestMutation...'
  )
})
