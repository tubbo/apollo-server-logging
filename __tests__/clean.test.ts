import { test } from '@jest/globals'
import { clean } from '../clean'

test('clean variable names', () => {
  const variables = clean(['password'], { name: 'foo', password: 'bar' })

  expect(variables.name).toEqual('foo')
  expect(variables.password).toEqual('[REDACTED]')
})
