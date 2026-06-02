import { isPrefetchRequest } from './is-prefetch-request.js'

const ua = (userAgent) => ({ headers: { 'user-agent': userAgent } })

describe('isPrefetchRequest', () => {
  it.each([
    'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    'Twitterbot/1.0',
    'facebookexternalhit/1.1',
    'Mozilla/5.0 (compatible; Discordbot/2.0)',
    'WhatsApp/2.23',
    'Mozilla/5.0 (Windows NT 10.0) Microsoft Office/16.0 (Microsoft Outlook 16.0)'
  ])('is true for the known bot/previewer %s', (userAgent) => {
    expect(isPrefetchRequest(ua(userAgent))).toBe(true)
  })

  it.each([
    // Safari sends no Sec-Fetch headers — must NOT be treated as a bot
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
  ])('is false for the real browser %s', (userAgent) => {
    expect(isPrefetchRequest(ua(userAgent))).toBe(false)
  })

  it('is false when the User-Agent header is absent', () => {
    expect(isPrefetchRequest({ headers: {} })).toBe(false)
  })
})
