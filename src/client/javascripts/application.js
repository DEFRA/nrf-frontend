import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  createAll(Button)
  createAll(Checkboxes)
  createAll(ErrorSummary)
  createAll(Header)
  createAll(Radios)
  createAll(SkipLink)
})
