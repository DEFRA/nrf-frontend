// Known link-previewers, crawlers and security scanners that hit the quote
// link before (or instead of) a human (tech spec §4.3). Matched against the
// User-Agent. We deliberately gate on a positive bot list rather than the
// absence of a Sec-Fetch-* header: Safari and all iOS browsers send no
// Sec-Fetch headers at all, so treating their absence as "bot" would lock
// every Safari user out of their quote.
const botUserAgents = [
  'slackbot',
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'discordbot',
  'whatsapp',
  'telegrambot',
  'skypeuripreview',
  'google-read-aloud',
  'bingpreview',
  'redditbot',
  'embedly',
  'outlook',
  'office',
  'microsoftpreview',
  'bot',
  'crawler',
  'spider',
  'preview',
  'scanner'
]

/**
 * Detects link previewers, crawlers and scanners so we don't consume a session
 * or leak quote data into a prefetch cache on their behalf (tech spec §4.3).
 */
export const isPrefetchRequest = (request) => {
  const userAgent = request.headers['user-agent']?.toLowerCase() ?? ''
  return botUserAgents.some((bot) => userAgent.includes(bot))
}
