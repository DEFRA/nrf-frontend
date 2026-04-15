import { getByRole } from '@testing-library/dom'
import { routePath } from './routes.js'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { loadPage } from '../../../test-utils/load-page.js'

describe('Start page', () => {
  const getServer = setupTestServer()

  it('should render a page heading', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    expect(document.title).toBe('Nature Restoration Fund - Gov.uk')
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Nature Restoration Fund'
    )
  })

  it('should link to a feedback survey from the beta banner', async () => {
    const document = await loadPage({
      requestUrl: routePath,
      server: getServer()
    })
    const betaBanner = getByRole(document, 'region', { name: 'Give feedback' })
    const feedbackLink = getByRole(betaBanner, 'link', {
      name: 'give your feedback (opens in new tab)'
    })
    expect(feedbackLink).toHaveAttribute(
      'href',
      'https://defragroup.eu.qualtrics.com/jfe/form/SV_9yRhrdtbb3vmw86'
    )
  })
})
