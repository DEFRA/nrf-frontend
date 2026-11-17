/**
 * Summary list row actions for one row's Change link.
 * @param {string} visuallyHiddenText - row name announced to screen readers
 * @param {string} href - the page that changes this answer
 * @returns {{ items: Array<{ href: string, text: string, visuallyHiddenText: string }> }} the row's actions
 */
export const changeAction = (visuallyHiddenText, href) => ({
  items: [{ href, text: 'Change', visuallyHiddenText }]
})
