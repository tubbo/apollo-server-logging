import type { ApolloServerPlugin } from 'apollo-server-plugin-base'
import { inspect } from 'util'
import { v4 as uuid } from 'uuid'
import pino, { type Logger } from 'pino'
import { clean } from './clean'

interface Options {
  logger?: Logger
  cleanedVariableNames?: string[]
}

/**
 * This is essentially a re-implementation of `@shellscape/apollo-log`
 * to help reduce log spam. It will only log one line per event
 * (usually), and uses the Pino logger that we all know and love from the
 * REST API. It also reads the `$DEBUG` env var to determine when to show
 * debug messages, which can be helpful if you're unsure at which part of
 * the process your operation failed. By default, however, it will only
 * show which operations started/completed, when those
 * starts/completions occurred, and what kind of variables were sent
 * along with the operations.
 */
export function ApolloLoggerPlugin(options: Options): ApolloServerPlugin {
  const {
    logger: parentLogger = pino(),
    cleanedVariableNames = ['password', 'token', 'captcha'],
  } = options

  return {
    async serverWillStart() {
      parentLogger.info('Starting GraphQL on "/graphql"...')

      if (process.env.DEBUG?.match(/apollo:/)) {
        parentLogger.level = 'debug'
      }
    },

    async requestDidStart() {
      const pid = uuid().split('-')[0]
      const logger = parentLogger.child({ pid })

      function logErrors(...errors: unknown[]) {
        for (const error of errors)
          if (error instanceof Error) {
            logger.error(`${error.name}: ${error.message}`)
            logger.debug(error)
          }
      }

      logger.debug('Starting GraphQL request...')

      return {
        async didResolveSource({ source }) {
          logger.trace(`Source:\n${source}`)
        },

        async didResolveOperation({
          operation,
          operationName,
          request: { variables },
        }) {
          const params = inspect(clean(cleanedVariableNames, variables))
          const kind = operation.operation

          logger.info(`Started ${kind} ${operationName || ''}`)
          logger.info(`Parameters: ${params}`)
        },

        async didEncounterErrors({ errors }) {
          if (errors) logErrors(...errors)
        },

        async parsingDidStart() {
          logger.debug('Parsing source...')

          return async (error) => {
            if (error) {
              logger.error('Failed to parse source')
              logErrors(error)
            } else {
              logger.debug('Parsing complete')
            }
          }
        },

        async validationDidStart() {
          logger.debug('Validating GraphQL document...')

          return async (error) => {
            if (error) {
              logger.error('Failed to validate GraphQL document')
              logErrors(error)
            } else {
              logger.debug('Validation complete. Document cached.')
            }
          }
        },

        async executionDidStart({ operationName, operation }) {
          logger.debug(`Executing ${operation.operation} ${operationName}...`)
        },

        async willSendResponse({ operation, operationName }) {
          const kind = operation?.operation || 'operation'
          const name = operationName || ''

          logger.info(`Completed ${kind} ${name}`)
        },
      }
    },
  }
}
