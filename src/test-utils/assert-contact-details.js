import { getByRole } from '@testing-library/dom'

/**
 * Asserts the shared "Get help with the nature restoration levy" block shows
 * the Natural England contact details and support hours.
 * @param {Document} container - rendered page document to assert against
 * @param {{ intro?: boolean }} [options] - set intro false where the intro
 * sentence is hidden (page not found error page)
 */
export const assertContactDetails = (container, { intro = true } = {}) => {
  const main = getByRole(container, 'main')
  expect(
    getByRole(container, 'heading', {
      name: 'Get help with the nature restoration levy',
      level: 2
    })
  ).toBeInTheDocument()
  if (intro) {
    expect(main).toHaveTextContent(
      'If you need help with the nature restoration levy, contact Natural England.'
    )
  } else {
    expect(main).not.toHaveTextContent(
      'If you need help with the nature restoration levy'
    )
  }
  expect(main).toHaveTextContent('Telephone: 0300 060 3900')
  expect(main).toHaveTextContent(
    'Monday to Friday, 10am to 4pm, except bank holidays'
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
