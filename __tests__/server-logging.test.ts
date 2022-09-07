import type {
  GraphQLServerListener,
  GraphQLServiceContext,
} from 'apollo-server-plugin-base'
import { jest, test } from '@jest/globals'
import { mockLogger } from '../testing/mock-logger'
import { ApolloLoggerPlugin } from '../plugin'

jest.useFakeTimers()

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
