/**
 * Formats a levy amount for display: whole pound amounts are shown without
 * pence, fractional amounts with two decimals.
 * @param {number} amount
 * @returns {string} e.g. £26,750 or £26,750.50
 */
export const formatLevyAmount = (amount) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2
  }).format(amount)
