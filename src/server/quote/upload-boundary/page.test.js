import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { initiateUpload } from '../../common/services/cdp-uploader.js'

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

  it('should render form with uploadUrl from cdp-uploader', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const form = document.querySelector('form')
    expect(form).toHaveAttribute('action', '/upload-and-scan/test-upload-id')
    expect(form).toHaveAttribute('method', 'post')
    expect(form).toHaveAttribute('enctype', 'multipart/form-data')
  })

  it('should call initiateUpload with correct parameters', async () => {
    await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(initiateUpload).toHaveBeenCalledWith({
      redirect: expect.stringContaining('/quote/upload-received'),
      s3Bucket: 'app-bucket',
      metadata: {}
    })
  })

  it('should show error when initiateUpload fails', async () => {
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
    const errorSummary = getByRole(document, 'alert')
    expect(errorSummary).toHaveTextContent('Unable to initiate upload')
  })
})
