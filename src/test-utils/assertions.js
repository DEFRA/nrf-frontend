import { within } from '@testing-library/dom'
import {
  genericSurveyUrl,
  quoteSurveyUrl,
  requestToUseSurveyUrl
} from './fixtures/survey.js'

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

const surveyUrlByJourney = {
  Quote: quoteSurveyUrl,
  RequestToUse: requestToUseSurveyUrl,
  Generic: genericSurveyUrl
}

/**
 * Assert the beta banner links to the journey's survey in a new tab.
 * @param {{ document: Document, journey: 'Quote' | 'RequestToUse' | 'Generic' }} params
 * @returns {void}
 */
export const expectPhaseBannerSurveyLink = ({ document, journey }) => {
  const expectedUrl = surveyUrlByJourney[journey]
  const betaBanner = within(document).getByRole('region', {
    name: 'Give feedback'
  })
  const feedbackLink = within(betaBanner).getByRole('link', {
    name: 'give your feedback (opens in new tab)'
  })
  expect(feedbackLink).toHaveAttribute('href', expectedUrl)
  expect(feedbackLink).toHaveAttribute('target', '_blank')
  expect(feedbackLink).toHaveAttribute('rel', 'noopener noreferrer')
}
