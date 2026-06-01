import { getByRole } from '@testing-library/dom'
import { setupTestServer } from '../../../test-utils/setup-test-server.js'
import { setupMswServer } from '../../../test-utils/setup-msw-server.js'
import { loadPage } from '../../../test-utils/load-page.js'
import { fullQuote } from '../../../test-utils/fixtures/quote.js'
import {
  mockGetQuote,
  mockGetQuoteStatus
} from '../../../test-utils/mock-get-quote.js'

const mswServer = setupMswServer()

const { reference } = fullQuote
const token = 'abcdeftoken123'
const requestUrl = `/quote/${reference}/${token}`

describe('Quote details page', () => {
  const getServer = setupTestServer()

  it('should render the page heading and title with the NRF reference', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    expect(document.title).toBe(
      `Your Nature Restoration Fund levy quote (${reference}) - Nature Restoration Fund - Gov.uk`
    )
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your Nature Restoration Fund levy quote'
    )
  })

  it('should show all summary rows for a full quote', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toBeInTheDocument()
    expect(summaryList).toHaveTextContent('NRF reference')
    expect(summaryList).toHaveTextContent(reference)
    expect(summaryList).toHaveTextContent('Red line boundary')
    expect(summaryList).toHaveTextContent('site-plan.geojson')
    expect(summaryList).toHaveTextContent('Development types')
    expect(summaryList).toHaveTextContent('Housing')
    expect(summaryList).toHaveTextContent('Other residential')
    expect(summaryList).toHaveTextContent('Number of residential units')
    expect(summaryList).toHaveTextContent('42')
    expect(summaryList).toHaveTextContent('Maximum number of people')
    expect(summaryList).toHaveTextContent('100')
    expect(summaryList).toHaveTextContent('Waste water treatment works')
    expect(summaryList).toHaveTextContent("I don't know yet")
    expect(summaryList).toHaveTextContent('Email address')
    expect(summaryList).toHaveTextContent('test@example.com')
    expect(summaryList).toHaveTextContent('Quote amount')
    expect(summaryList).toHaveTextContent('£1500 - £3500')
  })

  it('should show "Drawn" for a drawn boundary', async () => {
    mockGetQuote(mswServer, {
      ...fullQuote,
      boundary: {
        userInputType: 'draw',
        filename: null
      }
    })
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toHaveTextContent('Drawn')
  })

  it('should show "Uploaded" for an uploaded boundary without filename', async () => {
    mockGetQuote(mswServer, {
      ...fullQuote,
      boundary: {
        userInputType: 'upload',
        filename: null
      }
    })
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    const summaryList = document.querySelector('.govuk-summary-list')
    expect(summaryList).toHaveTextContent('Uploaded')
  })

  it('should not have any change links', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    const changeLinks = document.querySelectorAll(
      '.govuk-summary-list__actions a'
    )
    expect(changeLinks).toHaveLength(0)
  })

  it('should not have a submit button or form in the main content', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    const main = document.querySelector('main')
    const form = main.querySelector('form')
    expect(form).not.toBeInTheDocument()
  })

  it('should not require a session to access', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your Nature Restoration Fund levy quote'
    )
  })

  it('should show EDP summary cards with nitrogen and phosphorus', async () => {
    mockGetQuote(mswServer)
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    const main = document.querySelector('main')
    expect(
      getByRole(main, 'heading', { level: 2, name: 'EDPs' })
    ).toBeInTheDocument()

    const cards = main.querySelectorAll('.govuk-summary-card')
    expect(cards).toHaveLength(2)

    expect(getByRole(cards[0], 'heading', { level: 3 })).toHaveTextContent(
      'Norfolk Fens East'
    )
    expect(cards[0]).toHaveTextContent('Nitrogen')
    expect(cards[0]).toHaveTextContent('1.5 mg/I TP')
    expect(cards[0]).toHaveTextContent('Phosphorus')
    expect(cards[0]).toHaveTextContent('0.8 mg/I TP')

    expect(getByRole(cards[1], 'heading', { level: 3 })).toHaveTextContent(
      'Broadland Rivers'
    )
    expect(cards[1]).toHaveTextContent('2.1 mg/I TP')
    expect(cards[1]).toHaveTextContent('1.2 mg/I TP')
  })

  it('should not show EDPs section when there are no EDPs', async () => {
    mockGetQuote(mswServer, {
      ...fullQuote,
      edps: [],
      levyGbp: null
    })
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })
    const main = document.querySelector('main')
    const edpsHeading = main.querySelector('h2')
    expect(edpsHeading).not.toBeInTheDocument()
    const cards = main.querySelectorAll('.govuk-summary-card')
    expect(cards).toHaveLength(0)
  })

  describe('error states', () => {
    it.each([
      ['invalid', 'The link is invalid'],
      [
        'not_found',
        'The NRF reference you have supplied does not match an existing quote'
      ],
      ['expired', 'This link has expired']
    ])(
      'should show the %s error message and no quote summary',
      async (status, message) => {
        mockGetQuoteStatus(mswServer, reference, status)
        const document = await loadPage({
          requestUrl,
          server: getServer()
        })

        expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
          message
        )
        expect(
          document.querySelector('.govuk-summary-list')
        ).not.toBeInTheDocument()
      }
    )

    it('should show the invalid link message for a malformed token', async () => {
      const document = await loadPage({
        requestUrl: `/quote/${reference}/not a valid token!`,
        server: getServer()
      })

      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'The link is invalid'
      )
    })

    it('should accept a base64url token containing underscores and hyphens', async () => {
      mockGetQuote(mswServer)
      const document = await loadPage({
        requestUrl: `/quote/${reference}/abc_def-ABC_123`,
        server: getServer()
      })
      expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
        'Your Nature Restoration Fund levy quote'
      )
    })
  })
})
