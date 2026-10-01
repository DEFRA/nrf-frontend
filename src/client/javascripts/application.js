import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  NotificationBanner,
  Radios,
  SkipLink
} from 'govuk-frontend'
import { initDisableSubmitButtons } from './forms/disable-submit-button.js'

document.addEventListener('DOMContentLoaded', () => {
  createAll(Button)
  createAll(Checkboxes)
  createAll(ErrorSummary)
  createAll(NotificationBanner)
  createAll(Radios)
  createAll(SkipLink)
  initDisableSubmitButtons()
})
