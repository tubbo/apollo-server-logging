import type { ApolloServerPlugin } from 'apollo-server-plugin-base'
import { inspect } from 'util'
import { nanoid } from 'nanoid'
import { pino, type Logger } from 'pino'
import { clean } from './clean.js'
import { DateTime } from 'luxon'

interface Options {
  logger?: Logger
  cleanedVariableNames?: string[]
}

export type { Options as ApolloLoggerPluginOptions }

/**
 * Create a new instance of the logger plugin using the given options.
 * By default, this plugin instantiates a new `pino.Logger` with default
 * settings, but you can pass in your own logger instance with
 * configuration shared across the application. It also reads the
 * `$DEBUG` var for `"apollo:*"` to determine when to show debug
 * messages, which can be helpful if you're unsure at which part of the
 * process your operation failed. By default, however, it will only
 * show which operations started/completed, when those
 * starts/completions occurred, and what kind of variables were sent
 * along with the operations.
 *
 * @example
 *  import { ApolloLoggerPlugin } from 'apollo-logger-plugin'
 *  import { ApolloServer } from 'apollo-server'
 *
 *  export const server = new ApolloServer({
 *    plugins: [
 *      ApolloLoggerPlugin()
 *    ]
 *  })
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
      const logger = parentLogger.child({ pid: nanoid() })
      const started = DateTime.now()

      function logErrors(...errors: unknown[]) {
        for (const error of errors) {
          if (error instanceof Error) {
            logger.error(`${error.name}: ${error.message}`)
            logger.debug(error)
          }
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
          const name = operationName || ''

          logger.info(`Started ${kind} ${name}`)
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
          const typeName = operation?.operation || 'operation'

          logger.debug(`Executing ${typeName} ${operationName}...`)
        },

        async willSendResponse({ operation, operationName }) {
          const kind = operation?.operation || 'operation'
          const name = operationName || ''
          const duration = DateTime.now().minus(started).toMillis()

          logger.info(`Completed ${kind} ${name} in ${duration}ms`)
        },
      }
    },
  }
}
