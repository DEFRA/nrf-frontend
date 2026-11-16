/**
 * Find a view model's summary list row by its key text.
 * @param {object} view - a page view model with a rows array
 * @param {string} key - the row's key text
 * @returns {object | undefined} the row with that key, if the view model has one
 */
export const findSummaryListRow = (view, key) =>
  view.rows.find((row) => row.key.text === key)

/**
 * Find a rendered summary list row element by its key text. Summary list rows
 * have no ARIA role, so the key element is matched on its trimmed text.
 * @param {Document} document - the loaded page
 * @param {string} key - the row's key text
 * @returns {HTMLElement | undefined} the row element, if the page has one
 */
export const findSummaryListRowElement = (document, key) =>
  Array.from(document.querySelectorAll('.govuk-summary-list__row')).find(
    (row) =>
      row.querySelector('.govuk-summary-list__key')?.textContent.trim() === key
  )
