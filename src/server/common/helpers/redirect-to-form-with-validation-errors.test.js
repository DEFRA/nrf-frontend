import { describe, it, expect } from 'vitest'
import { redirectToFormWithValidationErrors } from './redirect-to-form-with-validation-errors.js'
import { statusCodes } from '../constants/status-codes.js'

describe('redirectToFormWithValidationErrors', () => {
  const buildRequest = ({ search = '' } = {}) => {
    const session = {}
    return {
      payload: { field1: 'bad value' },
      path: '/some/form',
      url: { search },
      yar: {
        get: (key) => session[key],
        set: (key, value) => {
          session[key] = value
        }
      }
    }
  }

  const buildH = () => {
    const takeover = vi.fn()
    const code = vi.fn().mockReturnValue({ takeover })
    const redirect = vi.fn().mockReturnValue({ code })
    return { redirect, code, takeover }
  }

  const err = { details: [{ path: 'field1', message: 'Required' }] }

  it('saves the errors and submitted values to the session flash', () => {
    const request = buildRequest()

    redirectToFormWithValidationErrors(request, buildH(), err)

    expect(request.yar.get('quoteFlash')).toEqual({
      validationErrors: expect.objectContaining({
        summary: expect.arrayContaining([
          expect.objectContaining({ href: '#field1' })
        ])
      }),
      formSubmitData: request.payload
    })
  })

  it('redirects back to the form with the query string preserved', () => {
    const h = buildH()

    redirectToFormWithValidationErrors(
      buildRequest({ search: '?change=true' }),
      h,
      err
    )

    expect(h.redirect).toHaveBeenCalledWith('/some/form?change=true')
    expect(h.code).toHaveBeenCalledWith(statusCodes.redirectAfterPost)
    expect(h.takeover).toHaveBeenCalled()
  })
})
