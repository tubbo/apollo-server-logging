export type Variables = {
  [name: string]: unknown
}

/**
 * Clean secret variables for the log.
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
