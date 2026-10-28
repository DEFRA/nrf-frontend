import formValidation from './form-validation.js'

const errorMessage =
  'Select who you are requesting to use the nature restoration levy for'

describe('defra-account-user-type form validation', () => {
  describe('defraAccountUserType', () => {
    it.each(['individual', 'organisation', 'agent'])(
      'passes for "%s"',
      (value) => {
        const { error } = formValidation().validate({
          defraAccountUserType: value
        })
        expect(error).toBeUndefined()
      }
    )

    it('fails when absent', () => {
      const { error } = formValidation().validate({})
      expect(error.details[0].message).toBe(errorMessage)
    })

    it('fails for an unrecognised value', () => {
      const { error } = formValidation().validate({
        defraAccountUserType: 'someone-else'
      })
      expect(error.details[0].message).toBe(errorMessage)
    })
  })
})
