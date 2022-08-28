# apollo-server-logging

A logging plugin for [Apollo Server][], using [Pino][].

## Usage

Install the library:

```bash
yarn add apollo-server-logging
```

Then, add it to your server plugins:

```javascript
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
    }),
  ]
})
```

[apollo server]: https://www.apollographql.com/docs/apollo-server/
[pino]: https://github.com/pinojs/pino
