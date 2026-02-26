import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink
} from 'govuk-frontend'

import { initAllIntegerFilters } from './integer-input-filter.js'

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  createAll(Button)
  createAll(Checkboxes)
  createAll(ErrorSummary)
  createAll(Header)
  createAll(Radios)
  createAll(SkipLink)

  initAllIntegerFilters()
})
