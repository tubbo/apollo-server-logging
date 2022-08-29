import { ApolloLoggerPlugin } from './plugin'
import { jest, test } from '@jest/globals'
import type {
  GraphQLRequestListener,
  GraphQLServerListener,
  GraphQLServiceContext,
  GraphQLRequestContext,
  GraphQLRequestContextDidResolveOperation,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestContextDidResolveSource,
  GraphQLRequestContextParsingDidStart,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestContextValidationDidStart,
} from 'apollo-server-plugin-base'
import { Logger } from 'pino'

jest.useFakeTimers()

let childLogger: Logger
const mockLogger = () =>
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

test('server logging', async () => {
  const logger = mockLogger()

  logger.level = 'info'
  const { serverWillStart } = ApolloLoggerPlugin({ logger })
  const { serverWillStop } = (await serverWillStart(
    {} as unknown as GraphQLServiceContext
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
    {} as unknown as GraphQLRequestContext
  )) as GraphQLRequestListener

  await didResolveOperation({
    operation: { operation: 'query' },
    operationName: 'TestQuery',
    request: { variables: { foo: 'bar' } },
  } as unknown as GraphQLRequestContextDidResolveOperation<unknown>)
  await willSendResponse({
    operation: 'query',
    operationName: 'TestQuery',
  } as unknown as GraphQLRequestContextWillSendResponse<unknown>)

  expect(childLogger.info).toHaveBeenCalled()
  expect(childLogger.info).toHaveBeenCalledWith('Started query TestQuery')
  expect(childLogger.info).toHaveBeenCalledWith("Parameters: { foo: 'bar' }")
})

test('debug logging', async () => {
  const logger = mockLogger()
  logger.level = 'debug'
  const { requestDidStart } = ApolloLoggerPlugin({ logger })
  const ctx = {} as unknown as GraphQLRequestContext
  const {
    didResolveSource,
    parsingDidStart,
    validationDidStart,
    executionDidStart,
    willSendResponse,
  } = (await requestDidStart(ctx)) as GraphQLRequestListener
  const parsingDidEnd = await parsingDidStart(
    {} as unknown as GraphQLRequestContextParsingDidStart<unknown>
  )
  const validationDidEnd = await validationDidStart(
    {} as unknown as GraphQLRequestContextValidationDidStart<unknown>
  )

  await executionDidStart({
    operationName: 'TestMutation',
    operation: { operation: 'mutation' },
  } as unknown as GraphQLRequestContextExecutionDidStart<unknown>)
  await didResolveSource({
    source: 'mutation TestMutation { testMutation }',
  } as unknown as GraphQLRequestContextDidResolveSource<unknown>)
  if (parsingDidEnd) await parsingDidEnd()
  if (validationDidEnd) await validationDidEnd()
  await willSendResponse({
    operationName: 'TestMutation',
    operation: 'mutation',
  } as unknown as GraphQLRequestContextWillSendResponse<unknown>)

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
