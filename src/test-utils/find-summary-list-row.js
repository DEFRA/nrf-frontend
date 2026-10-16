/**
 * Find a view model's summary list row by its key text.
 * @param {object} view - a page view model with a rows array
 * @param {string} key - the row's key text
 * @returns {object | undefined} the row with that key, if the view model has one
 */
export const findSummaryListRow = (view, key) =>
  view.rows.find((row) => row.key.text === key)
