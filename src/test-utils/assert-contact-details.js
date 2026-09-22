import { getByRole } from '@testing-library/dom'

/**
 * Asserts the shared "Get help with the nature restoration levy" block shows
 * the Natural England contact details and support hours.
 * @param {Document} container - rendered page document to assert against
 */
export const assertContactDetails = (container) => {
  const main = getByRole(container, 'main')
  expect(main).toHaveTextContent(
    'If you need help with the nature restoration levy, contact Natural England.'
  )
  expect(main).toHaveTextContent('Telephone: 0300 060 3900')
  expect(main).toHaveTextContent(
    'Monday to Friday, 8:30am to 5pm, except bank holidays'
  )
  const emailLink = getByRole(container, 'link', {
    name: 'enquiries@naturalengland.org.uk'
  })
  expect(emailLink).toHaveAttribute(
    'href',
    'mailto:enquiries@naturalengland.org.uk'
  )
  const callChargesLink = getByRole(container, 'link', {
    name: 'Find out about call charges (opens in new tab)'
  })
  expect(callChargesLink).toHaveAttribute(
    'href',
    'https://www.gov.uk/call-charges'
  )
  expect(callChargesLink).toHaveAttribute('target', '_blank')
}
