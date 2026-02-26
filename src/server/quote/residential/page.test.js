import { getByRole, getByLabelText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { submitForm } from '../../../test-utils/submit-form.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import {
  getQuoteDataFromCache,
  getValidationFlashFromCache,
  saveValidationFlashToCache
} from '../session-cache.js'

vi.mock('../session-cache.js')

describe('Residential page', () => {
  const getServer = setupTestServer()
  const inputLabel = 'How many residential units in this development?'

  describe('page rendering', () => {
    it('should render a page heading, title and back link', async () => {
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer()
      })
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        inputLabel
      )
      expect(document.title).toBe(
        'How many residential units in this development? - Nature Restoration Fund - Gov.uk'
      )
      expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
        'href',
        '/quote/development-types'
      )
    })

    it('should include a CSRF token inside the form, to prevent CSRF attacks', async () => {
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer()
      })
      const csrfToken = document.querySelector('form input[name="csrfToken"]')
      expect(csrfToken).toBeInTheDocument()
    })
  })

  describe('remembering previous values', () => {
    it('should not pre-populate the input if the user did not previously enter a value', async () => {
      vi.mocked(getQuoteDataFromCache).mockReturnValue({})
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer()
      })
      expect(getByLabelText(document, inputLabel)).toHaveValue('')
    })

    it('should remember the previously entered value', async () => {
      vi.mocked(getQuoteDataFromCache).mockReturnValue({
        residentialBuildingCount: 25
      })
      const document = await loadPage({
        requestUrl: routePath,
        server: getServer()
      })
      expect(getByLabelText(document, inputLabel)).toHaveValue('25')
    })
  })

  describe('valid form submission', () => {
    it('should redirect to the next page when entering a valid value (6)', async () => {
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { residentialBuildingCount: '6' }
      })
      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe('/quote/next')
    })

    it('should trim spaces and accept value (12 with spaces)', async () => {
      const { response } = await submitForm({
        requestUrl: routePath,
        server: getServer(),
        formData: { residentialBuildingCount: ' 12 ' }
      })
      expect(response.statusCode).toBe(303)
      expect(response.headers.location).toBe('/quote/next')
    })
  })

  // Validation edge cases are tested in form-validation.test.js
  // These tests verify the page correctly handles form submissions and renders errors
  describe('invalid form submission', () => {
    const requiredErrorMessage = 'Enter the number of residential units'
    const minErrorMessage = 'Enter a whole number greater than zero'
    const maxErrorMessage =
      'Enter a smaller whole number within the allowed range'

    describe('empty input', () => {
      it('should redirect and save validation error when input is empty', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: {}
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(saveValidationFlashToCache.mock.calls[0][1]).toEqual({
          formSubmitData: {},
          validationErrors: {
            messagesByFormField: {
              residentialBuildingCount: {
                field: ['residentialBuildingCount'],
                href: '#residentialBuildingCount',
                text: requiredErrorMessage
              }
            },
            summary: [
              {
                field: ['residentialBuildingCount'],
                href: '#residentialBuildingCount',
                text: requiredErrorMessage
              }
            ]
          }
        })
      })

      it('should render validation error after redirect', async () => {
        vi.mocked(getValidationFlashFromCache).mockReturnValue({
          validationErrors: {
            summary: [
              {
                href: '#residentialBuildingCount',
                text: requiredErrorMessage,
                field: ['residentialBuildingCount']
              }
            ],
            messagesByFormField: {
              residentialBuildingCount: {
                href: '#residentialBuildingCount',
                text: requiredErrorMessage,
                field: ['residentialBuildingCount']
              }
            }
          },
          formSubmitData: {}
        })
        const document = await loadPage({
          requestUrl: routePath,
          server: getServer()
        })
        expectInputError({
          document,
          inputLabel,
          errorMessage: requiredErrorMessage
        })
      })
    })

    describe('zero value', () => {
      it('should redirect and show error when entering zero', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: '0' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(minErrorMessage)
      })
    })

    describe('negative number', () => {
      it('should redirect and show error when entering a negative number (-3)', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: '-3' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(requiredErrorMessage)
      })
    })

    describe('decimal number', () => {
      it('should redirect and show error when entering a decimal number (3.5)', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: '3.5' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(minErrorMessage)
      })
    })

    describe('extremely large number', () => {
      it('should redirect and show error when entering an extremely large number', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: '999999999' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(maxErrorMessage)
      })
    })

    describe('non-numeric characters', () => {
      it('should redirect and show error when entering non-numeric characters (abc)', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: 'abc' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(requiredErrorMessage)
      })
    })

    describe('comma separator', () => {
      it('should redirect and show error when entering number with comma separator (1,000)', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: '1,000' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(requiredErrorMessage)
      })
    })

    describe('scientific notation', () => {
      it('should redirect and show error when entering scientific notation (1e3)', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: '1e3' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(requiredErrorMessage)
      })

      it('should redirect and show error when entering number with plus sign (+10)', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: '+10' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(requiredErrorMessage)
      })
    })

    describe('text with units', () => {
      it('should redirect and show error when entering text with units (25 units)', async () => {
        const { response } = await submitForm({
          requestUrl: routePath,
          server: getServer(),
          formData: { residentialBuildingCount: '25 units' }
        })
        expect(response.statusCode).toBe(303)
        expect(response.headers.location).toBe(routePath)
        expect(
          saveValidationFlashToCache.mock.calls[0][1].validationErrors
            .summary[0].text
        ).toBe(requiredErrorMessage)
      })
    })
  })
})
