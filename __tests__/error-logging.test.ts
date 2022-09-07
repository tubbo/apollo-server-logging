import { ApolloLoggerPlugin } from '../plugin'
import { jest, test, afterAll } from '@jest/globals'
import type {
  GraphQLRequestListener,
  GraphQLRequestContext,
  GraphQLRequestContextDidEncounterErrors,
  GraphQLRequestContextParsingDidStart,
  GraphQLRequestContextValidationDidStart,
} from 'apollo-server-plugin-base'
import { mockLogger, childLogger } from '../testing/mock-logger'

const ORIGINAL_DEBUG = process.env.DEBUG

jest.useFakeTimers()

afterAll(() => {
  process.env.DEBUG = ORIGINAL_DEBUG
})

test('debug logging', async () => {
  const logger = mockLogger()
  logger.level = 'debug'
  const { requestDidStart } = ApolloLoggerPlugin({ logger })
  const ctx = {} as unknown as GraphQLRequestContext
  const { didEncounterErrors, parsingDidStart, validationDidStart } =
    (await requestDidStart(ctx)) as GraphQLRequestListener
  const parsingError = await parsingDidStart(
    {} as unknown as GraphQLRequestContextParsingDidStart<unknown>
  )
  const validationError = await validationDidStart(
    {} as unknown as GraphQLRequestContextValidationDidStart<unknown>
  )
  const error = new Error('Something went wrong')

  await didEncounterErrors({
    errors: [error],
  } as unknown as GraphQLRequestContextDidEncounterErrors<unknown>)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await parsingError(new Error('Parse error'))
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await validationError(new Error('Validation error'))

  expect(childLogger.error).toHaveBeenCalledWith('Error: Something went wrong')
  expect(childLogger.error).toHaveBeenCalledWith(
    'Failed to validate GraphQL document'
  )
  expect(childLogger.error).toHaveBeenCalledWith('Error: Validation error')
  expect(childLogger.error).toHaveBeenCalledWith('Failed to parse source')
  expect(childLogger.error).toHaveBeenCalledWith('Error: Parse error')
  expect(childLogger.debug).toHaveBeenCalledWith(error)
})

test('debug logging with env var', async () => {
  process.env.DEBUG = 'apollo:log'

  const logger = mockLogger()
  const { requestDidStart } = ApolloLoggerPlugin({ logger })
  const ctx = {} as unknown as GraphQLRequestContext
  const { didEncounterErrors, parsingDidStart, validationDidStart } =
    (await requestDidStart(ctx)) as GraphQLRequestListener
  const parsingError = await parsingDidStart(
    {} as unknown as GraphQLRequestContextParsingDidStart<unknown>
  )
  const validationError = await validationDidStart(
    {} as unknown as GraphQLRequestContextValidationDidStart<unknown>
  )
  const error = new Error('Something went wrong')

  await didEncounterErrors({
    errors: [error],
  } as unknown as GraphQLRequestContextDidEncounterErrors<unknown>)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await parsingError(new Error('Parse error'))
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await validationError(new Error('Validation error'))

  expect(childLogger.error).toHaveBeenCalledWith('Error: Something went wrong')
  expect(childLogger.error).toHaveBeenCalledWith(
    'Failed to validate GraphQL document'
  )
  expect(childLogger.error).toHaveBeenCalledWith('Error: Validation error')
  expect(childLogger.error).toHaveBeenCalledWith('Failed to parse source')
  expect(childLogger.error).toHaveBeenCalledWith('Error: Parse error')
  expect(childLogger.debug).toHaveBeenCalledWith(error)
})
