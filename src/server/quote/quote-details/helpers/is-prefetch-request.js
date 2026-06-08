// Known link-previewers, crawlers and security scanners that hit the quote
// link before (or instead of) a human. Matched against the User-Agent. We
// deliberately gate on a positive bot list rather than the absence of a
// Sec-Fetch-* header: Safari and all iOS browsers send no Sec-Fetch headers
// at all, so treating their absence as "bot" would lock every Safari user
// out of their quote.
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
  // Outlook/Office link-preview UA: "Microsoft Office/16.0 (Microsoft Outlook 16.0)"
  // Real users opening a link in Outlook's in-app browser have a different UA
  // that does not contain this exact substring.
  'microsoft office/',
  'microsoftpreview',
  // Generic crawler/bot signals — anchored to avoid matching real browser UAs
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'crawler',
  'spider',
  'linkpreview',
  'prerender',
  'headlesschrome'
]

/**
 * Detects link previewers, crawlers and scanners so we don't consume a session
 * or leak quote data into a prefetch cache on their behalf.
 */
export const isPrefetchRequest = (request) => {
  const userAgent = request.headers['user-agent']?.toLowerCase() ?? ''
  return botUserAgents.some((bot) => userAgent.includes(bot))
}
