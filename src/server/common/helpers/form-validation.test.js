import { mapValidationErrorsForDisplay } from './form-validation.js'

describe('#mapValidationErrorsForDisplay', () => {
  test('returns empty summary and messagesByFormField when no errors provided', () => {
    const result = mapValidationErrorsForDisplay()

    expect(result).toEqual({ summary: [], messagesByFormField: {} })
  })

  test('returns empty summary and messagesByFormField when empty array provided', () => {
    const result = mapValidationErrorsForDisplay([])

    expect(result).toEqual({ summary: [], messagesByFormField: {} })
  })

  test('maps error to summary and messagesByFormField', () => {
    const errors = [{ path: 'email', message: 'Enter your email' }]

    const result = mapValidationErrorsForDisplay(errors)

    expect(result.summary).toEqual([
      { href: '#email', text: 'Enter your email', field: 'email' }
    ])
    expect(result.messagesByFormField).toEqual({
      email: { href: '#email', text: 'Enter your email', field: 'email' }
    })
  })

  test('maps multiple errors', () => {
    const errors = [
      { path: 'name', message: 'Enter your name' },
      { path: 'email', message: 'Enter your email' }
    ]

    const result = mapValidationErrorsForDisplay(errors)

    expect(result.summary).toHaveLength(2)
    expect(result.messagesByFormField).toHaveProperty('name')
    expect(result.messagesByFormField).toHaveProperty('email')
  })

  test('last error wins when multiple errors share the same field', () => {
    const errors = [
      { path: 'name', message: 'First error' },
      { path: 'name', message: 'Second error' }
    ]

    const result = mapValidationErrorsForDisplay(errors)

    expect(result.summary).toHaveLength(2)
    expect(result.messagesByFormField.name.text).toBe('Second error')
  })
})
