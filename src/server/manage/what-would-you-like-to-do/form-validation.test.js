import { describe, it, expect } from 'vitest'
import formValidation from './form-validation.js'

const errorMessage = 'Select what you would like to do'

describe('what-would-you-like-to-do form validation', () => {
  describe('whatWouldYouLikeToDo', () => {
    it.each(['quote', 'request-to-use'])('passes for "%s"', (value) => {
      const { error } = formValidation().validate({
        whatWouldYouLikeToDo: value
      })
      expect(error).toBeUndefined()
    })

    it('fails when absent', () => {
      const { error } = formValidation().validate({})
      expect(error.details[0].message).toBe(errorMessage)
    })

    it('fails for an unrecognised value', () => {
      const { error } = formValidation().validate({
        whatWouldYouLikeToDo: 'something-else'
      })
      expect(error.details[0].message).toBe(errorMessage)
    })
  })
})
