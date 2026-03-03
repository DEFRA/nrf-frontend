import { getByRole, getByText } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { expectInputError } from '../../../test-utils/assertions.js'
import { getValidationFlashFromCache } from '../session-cache.js'
import { initiateUpload } from '../../common/services/cdp-uploader.js'

vi.mock('../session-cache.js')
vi.mock('../../common/services/cdp-uploader.js')

describe('Upload boundary page', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(initiateUpload).mockResolvedValue({
      uploadId: 'test-upload-id',
      uploadUrl: '/upload-and-scan/test-upload-id'
    })
  })

  it('should render a page heading, title and back link', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Upload a red line boundary file'
    )
    expect(document.title).toBe(
      'Upload a red line boundary file - Nature Restoration Fund - Gov.uk'
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      '#'
    )
  })

  it('should render a form with action pointing to cdp-uploader', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const form = document.querySelector('form')
    expect(form).toHaveAttribute('action', '/upload-and-scan/test-upload-id')
    expect(form).toHaveAttribute('method', 'post')
    expect(form).toHaveAttribute('enctype', 'multipart/form-data')
  })

  it('should show an error when upload initiation fails', async () => {
    vi.mocked(initiateUpload).mockResolvedValue({
      error: 'Unable to initiate upload'
    })

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    expect(document.title).toBe(
      'Error: Upload a red line boundary file - Nature Restoration Fund - Gov.uk'
    )
    expect(
      getByRole(document, 'heading', { name: 'There is a problem' })
    ).toBeInTheDocument()
    expect(getByText(document, 'Unable to initiate upload')).toBeInTheDocument()
  })

  it('should show fallback message when no upload URL is available', async () => {
    vi.mocked(initiateUpload).mockResolvedValue({})

    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })

    expect(
      getByText(
        document,
        'Unable to start file upload. Please try again later.'
      )
    ).toBeInTheDocument()
    expect(document.querySelector('form')).not.toBeInTheDocument()
  })

  it('should show a validation error if the page is viewed after an invalid form submission', async () => {
    const errorMessage = 'Select a file'
    vi.mocked(getValidationFlashFromCache).mockReturnValue({
      validationErrors: {
        summary: [
          {
            href: '#file',
            text: errorMessage,
            field: ['file']
          }
        ],
        messagesByFormField: {
          file: {
            href: '#file',
            text: errorMessage,
            field: ['file']
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
      inputLabel: 'Upload a red line boundary file',
      errorMessage
    })
  })
})
