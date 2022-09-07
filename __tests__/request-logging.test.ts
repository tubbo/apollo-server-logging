import { ApolloLoggerPlugin } from '../plugin'
import { jest, test } from '@jest/globals'
import type {
  GraphQLRequestListener,
  GraphQLRequestContext,
  GraphQLRequestContextDidResolveOperation,
  GraphQLRequestContextWillSendResponse,
} from 'apollo-server-plugin-base'
import { mockLogger, childLogger } from '../testing/mock-logger'

jest.useFakeTimers()

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
