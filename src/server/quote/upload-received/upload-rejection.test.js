import { getAllByText, getByRole, within } from '@testing-library/dom'
import { routePath } from './routes.js'
import { routePath as uploadBoundaryPath } from '../upload-boundary/routes.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { config } from '../../../config/config.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { stubUploadFlow } from '../../../test-utils/stub-upload-flow.js'
import { primeUploadSession } from '../../../test-utils/prime-upload-session.js'
import { followUploadRejection } from '../../../test-utils/follow-upload-rejection.js'

const uploadId = '11111111-1111-1111-1111-111111111111'

const mswServer = setupMswServer()

describe('Upload rejected before geometry parsing', () => {
  const getServer = setupTestServer()

  const stubRejection = (errorCode, status = statusCodes.badRequest) =>
    stubUploadFlow({ mswServer, uploadId, errorCode, status })

  it.each([
    'file_size_too_large',
    'file_contains_virus',
    'file_rejected_by_uploader',
    'upload_file_missing',
    'unsupported_file_type',
    'zip_missing_shapefile',
    'impact_assessor_unreachable',
    'impact_assessor_bad_response',
    'boundary_check_failed',
    'invalid_geometry',
    'unsupported_geometry_type',
    'no_polygon_found'
  ])(
    'redirects to the upload page with an error summary for %s',
    async (errorCode) => {
      stubRejection(errorCode)

      const cookie = await primeUploadSession(getServer())

      const redirect = await getServer().inject({
        method: 'GET',
        url: routePath,
        headers: { cookie }
      })
      expect(redirect.statusCode).toBe(statusCodes.redirectAfterPost)
      expect(redirect.headers.location).toBe(uploadBoundaryPath)

      const document = await followUploadRejection({
        server: getServer(),
        cookie
      })

      expect(
        getByRole(document, 'heading', { name: 'There is a problem' })
      ).toBeInTheDocument()
    }
  )

  it('shows the too-large message in the summary and against the file field', async () => {
    stubRejection('file_size_too_large', statusCodes.payloadTooLarge)
    const cookie = await primeUploadSession(getServer())
    const document = await followUploadRejection({
      server: getServer(),
      cookie
    })

    // The message appears twice: in the error summary and against the field.
    expect(
      getAllByText(document, /The selected file must be smaller than/)
    ).toHaveLength(2)
  })

  it('shows a virus message when the file contains a virus', async () => {
    stubRejection('file_contains_virus')
    const cookie = await primeUploadSession(getServer())
    const document = await followUploadRejection({
      server: getServer(),
      cookie
    })

    expect(
      getAllByText(document, 'The selected file contains a virus')
    ).toHaveLength(2)
  })

  it('shows a select-a-file message when no file was uploaded', async () => {
    stubRejection('upload_file_missing')
    const cookie = await primeUploadSession(getServer())
    const document = await followUploadRejection({
      server: getServer(),
      cookie
    })

    expect(
      getAllByText(document, 'Select a red line boundary file')
    ).toHaveLength(2)
  })

  describe('GTM upload_result event on the upload page', () => {
    const TEST_GTM_ID = 'GTM-TEST123'

    beforeEach(() => {
      config.set('gtmId', TEST_GTM_ID)
    })

    afterEach(() => {
      config.set('gtmId', null)
    })

    it('pushes rlb_status fail and the raw error code on the redirected-to upload page', async () => {
      stubRejection('file_size_too_large')
      const cookie = await primeUploadSession(getServer())
      const document = await followUploadRejection({
        server: getServer(),
        cookie
      })

      const { getByTestId } = within(document.documentElement)
      const script = getByTestId('gtm-upload-result')
      expect(script.textContent).toContain('rlb_status: "fail"')
      expect(script.textContent).toContain(
        'rlb_failure_reason: "file_size_too_large"'
      )
    })

    it('does not push when analytics/GTM is disabled', async () => {
      config.set('gtmId', null)
      stubRejection('file_size_too_large')
      const cookie = await primeUploadSession(getServer())
      const document = await followUploadRejection({
        server: getServer(),
        cookie
      })

      const { queryByTestId } = within(document.documentElement)
      expect(queryByTestId('gtm-upload-result')).toBeNull()
    })
  })
})
