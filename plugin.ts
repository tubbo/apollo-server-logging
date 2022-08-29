import type { ApolloServerPlugin } from 'apollo-server-plugin-base'
import type { nanoid as NanoID } from 'nanoid'
import { inspect } from 'util'
import { pino, type Logger } from 'pino'
import { DateTime } from 'luxon'
import { clean } from './clean.js'

/**
 * Options for the `ApolloLoggerPlugin()` factory function.
 */
interface Options {
  /**
   * The Pino Logger you wish to use for writing log messages. By
   * default, the plugin will call `pino()` to instantiate a logger with
   * default options.
   */
  logger?: Logger

  /**
   * The path your server accepts GraphQL requests on. Typically this
   * can be left at the default, `/graphql`, but is configurable here so
   * your log messages make sense if you serve GraphQL on an alternative
   * path.
   */
  path?: string

  /**
   * When a variable is passed through matching one of these names, its
   * value is replaced with `"[REDACTED]"` in the logs. Since the plugin
   * logs all parameters by default, this prevents accidentally logging
   * personally identifiable or sensitive information.
   */
  cleanedVariableNames?: string[]

  /**
   * Function for generating a NanoID for PIDs. By default this uses
   * `customAlphabet()` to generate a hexadecimal string, but you can
   * pass in a custom function here to generate it any way you want.
   * This allows you to track request logs on busy servers, by searching
   * for this ID you can see which "Started" and "Completed" messages
   * belong to one another.
   */
  nanoid?: typeof NanoID

  /**
   * Size of PID when generated with `nanoid`. Default is 10, but can be
   * reduced if it's too wide for your logs.
   */
  idSize?: number
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
    path = '/graphql',
    /**
     * We need to use a dynamic import here to support CommonJS for the
     * time being. Eventually, this will be deprecated and `nanoid()`
     * will be a synchronous method.
     */
    nanoid = async () => {
      const { customAlphabet } = await import('nanoid')

      return customAlphabet('1234567890abcdef', 10)
    },
    cleanedVariableNames = ['password', 'token', 'captcha'],
  } = options

  return {
    async serverWillStart() {
      parentLogger.info(`Starting GraphQL on "${path}"...`)

      if (process.env.DEBUG?.match(/apollo:/)) {
        parentLogger.level = 'debug'
      }

      return {
        async serverWillStop() {
          parentLogger.info(`Stopping GraphQL on "${path}"`)
        },
      }
    },

    async requestDidStart() {
      const session = await nanoid()
      const logger = parentLogger.child({ session })
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
          const duration = DateTime.now().diff(started).toMillis()

          logger.info(`Completed ${kind} ${name} in ${duration}ms`)
        },
      }
    },
  }
}
