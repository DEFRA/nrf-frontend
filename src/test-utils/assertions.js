import { within } from '@testing-library/dom'

const expectErrorSummary = ({ document, errorMessage }) => {
  const errorSummary = within(document).getByRole('alert')
  within(errorSummary).getByRole('heading', {
    level: 2,
    name: 'There is a problem'
  })
  const errorSummaryLink = within(errorSummary).getByRole('link', {
    name: errorMessage
  })
  return errorSummaryLink.getAttribute('href')
}

export const expectFieldsetError = ({ document, errorMessage }) => {
  // confirm that the error summary link correctly references an input within the fieldset
  const fieldsetId = expectErrorSummary({ document, errorMessage })
  const input = document.querySelector(fieldsetId)
  expect(input).toBeInTheDocument()

  // confirm there's an error message within the fieldset
  const fieldErrorMessage = document.querySelector(`${fieldsetId}-error`)
  expect(fieldErrorMessage).toHaveTextContent(errorMessage)
}

export const expectInputError = ({ document, inputLabel, errorMessage }) => {
  const inputId = expectErrorSummary({ document, errorMessage })
  const input = document.querySelector(inputId)
  expect(input).toHaveAccessibleName(inputLabel)
  expect(input).toHaveAccessibleDescription(
    expect.stringContaining(errorMessage)
  )
}
