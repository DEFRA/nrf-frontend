import formValidation, { originalReferenceField } from './form-validation.js'

const missingMessage =
  'Enter the NRL reference for the original planning permission'
const formatMessage =
  'Enter an NRL reference in the correct format, like NRL-123456'

describe('original-reference form validation', () => {
  describe('originalReference', () => {
    it.each(['NRL-123456', 'nrl-123456', '  NRL-123456  '])(
      'passes for "%s"',
      (value) => {
        const { error } = formValidation().validate({
          originalReference: value
        })
        expect(error).toBeUndefined()
      }
    )

    it('normalises the reference to uppercase without whitespace', () => {
      const { value } = originalReferenceField.validate(' nrl-123456 ')
      expect(value).toBe('NRL-123456')
    })

    it.each([
      { scenario: 'absent', formData: {} },
      { scenario: 'empty', formData: { originalReference: '' } },
      {
        scenario: 'only whitespace',
        formData: { originalReference: '   ' }
      }
    ])('fails with the missing message when $scenario', ({ formData }) => {
      const { error } = formValidation().validate(formData)
      expect(error.details[0].message).toBe(missingMessage)
    })

    it.each(['ABC-123', 'NRL-1234567', 'NRL123456', '123456'])(
      'fails with the format message for "%s"',
      (value) => {
        const { error } = formValidation().validate({
          originalReference: value
        })
        expect(error.details[0].message).toBe(formatMessage)
      }
    )
  })
})
