import { describe, it, expect, vi } from 'vitest'
import joi from 'joi'
import { createPostController } from './post-controller.js'
import { redirectToFormWithValidationErrors } from '../helpers/redirect-to-form-with-validation-errors.js'
import { statusCodes } from '../constants/status-codes.js'
import { createMockRedirectToolkit } from '../../../test-utils/create-mock-redirect-toolkit.js'

const formValidation = () => joi.object({ answer: joi.string().required() })

describe('createPostController', () => {
  it('validates the payload and redirects back to the form with errors on failure', () => {
    const controller = createPostController({
      formValidation,
      getNextPage: vi.fn(),
      saveToSession: vi.fn()
    })

    expect(controller.options.validate.failAction).toBe(
      redirectToFormWithValidationErrors
    )
    expect(controller.options.validate.payload.validate({}).error).toBeDefined()
  })

  it('only adds payload options when they are given', () => {
    const base = {
      formValidation,
      getNextPage: vi.fn(),
      saveToSession: vi.fn()
    }
    const payloadOptions = { maxBytes: 100 }

    expect(createPostController(base).options.payload).toBeUndefined()
    expect(
      createPostController({ ...base, payloadOptions }).options.payload
    ).toBe(payloadOptions)
  })

  it('saves the payload and redirects to the next page worked out from the saved data', () => {
    const request = { payload: { answer: 'yes' } }
    const saved = { answer: 'yes', earlier: 'no' }
    const saveToSession = vi.fn().mockReturnValue(saved)
    const getNextPage = vi.fn().mockReturnValue('/next')
    const h = createMockRedirectToolkit()

    createPostController({
      formValidation,
      getNextPage,
      saveToSession
    }).handler(request, h)

    expect(saveToSession).toHaveBeenCalledWith(request, request.payload)
    expect(getNextPage).toHaveBeenCalledWith(saved)
    expect(h.redirect).toHaveBeenCalledWith('/next')
    expect(h.response.code).toHaveBeenCalledWith(statusCodes.redirectAfterPost)
  })

  it('passes the submitted payload to getNextPage when nothing is saved', () => {
    const request = { payload: { answer: 'yes' } }
    const getNextPage = vi.fn().mockReturnValue('/next')
    const h = createMockRedirectToolkit()

    createPostController({ formValidation, getNextPage }).handler(request, h)

    expect(getNextPage).toHaveBeenCalledWith(request.payload)
    expect(h.redirect).toHaveBeenCalledWith('/next')
  })

  it('lets resolveRedirect change the redirect using the request', () => {
    const request = { payload: {}, query: { change: 'true' } }
    const resolveRedirect = vi.fn().mockReturnValue('/changed')
    const h = createMockRedirectToolkit()

    createPostController({
      formValidation,
      getNextPage: () => '/next',
      saveToSession: () => ({}),
      resolveRedirect
    }).handler(request, h)

    expect(resolveRedirect).toHaveBeenCalledWith({
      nextPage: '/next',
      request
    })
    expect(h.redirect).toHaveBeenCalledWith('/changed')
  })
})
