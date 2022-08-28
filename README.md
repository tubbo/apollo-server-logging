# apollo-server-logging

A logging plugin for [Apollo Server][], using [Pino][]. Heavily inspired
by [@shellscape/apollo-log][], this plugin was written from the ground
up to work with the new plugins API in Apollo Server, and to use the
Pino logger library rather than `loglevelnext`. This plugin's goal is to
log GraphQL operations without a ton of noise, but allow for more
in-depth messaging when needed.

## Usage

Install the library:

```bash
yarn add apollo-server-logging
```

Then, add it to your server plugins:

```typescript
import { ApolloServer } from 'apollo-server'
import { schema } from './schema'
import { logger } from './logger'

export const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerLogging({
      // Pass in your application logger here, or leave blank to use the
      // default `pino()` logger.
      logger
      // All parameters are logged, so use this option to redact certain
      // sensitive information from your logs:
      cleanVariableNames: ['password', 'token', 'phone', 'email'],
      // By default, the above setting's value is `['password', 'token', 'captcha']`
    }),
  ]
})
```

[apollo server]: https://www.apollographql.com/docs/apollo-server/
[pino]: https://github.com/pinojs/pino
[@shellscape/apollo-log]: https://github.com/shellscape/apollo-log
