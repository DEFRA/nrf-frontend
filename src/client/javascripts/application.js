import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Radios,
  SkipLink
} from 'govuk-frontend'

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  createAll(Button)
  createAll(Checkboxes)
  createAll(ErrorSummary)
  createAll(Radios)
  createAll(SkipLink)
})
