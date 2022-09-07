import { ApolloLoggerPlugin } from '../plugin'
import { jest, test } from '@jest/globals'
import type {
  GraphQLRequestListener,
  GraphQLRequestContext,
  GraphQLRequestContextExecutionDidStart,
  GraphQLRequestContextDidResolveSource,
  GraphQLRequestContextParsingDidStart,
  GraphQLRequestContextWillSendResponse,
  GraphQLRequestContextValidationDidStart,
} from 'apollo-server-plugin-base'
import { mockLogger, childLogger } from '../testing/mock-logger'

jest.useFakeTimers()

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
