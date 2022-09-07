/**
 * Variables to pass into `clean()`.
 */
export type Variables = {
  [name: string]: unknown
}

/**
 * Clean secret variables for the log. Replaces the value of the keys
 * in the first argument with `'[REDACTED]'` in the second argument.
 *
 * @example
 *  import { clean } from 'apollo-server-logging/clean'
 *
 *  clean(['foo'], { foo: 'bar', baz: 'bat' })
 *  // => { foo: '[REDACTED], baz: 'bat' }
 */
export function clean(names: string[], variables?: Variables): Variables {
  const cleanedVariables: Variables = { ...variables }

  Object.keys(cleanedVariables).forEach((variable) => {
    if (names.includes(variable)) {
      cleanedVariables[variable] = '[REDACTED]'
    }
  })

  return cleanedVariables
}
