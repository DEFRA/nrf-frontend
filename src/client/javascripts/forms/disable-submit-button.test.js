// @vitest-environment jsdom
/* global PageTransitionEvent: readonly */
import { describe, expect, it } from 'vitest'
import { fireEvent, getByRole } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import {
  disableSubmitButtonOnSubmit,
  initDisableSubmitButtons
} from './disable-submit-button.js'

const FORM_NAME = 'Confirm details'
const SUBMIT_BUTTON_NAME = 'Confirm and submit'

// Mounts a form fixture. A submit listener prevents the default navigation so
// the submit event still fires under jsdom without its "not implemented"
// navigation handling.
function mountForm({ formAttributes = '', innerHtml } = {}) {
  document.body.innerHTML = `
    <form aria-label="${FORM_NAME}" ${formAttributes}>
      ${innerHtml ?? `<button type="submit">${SUBMIT_BUTTON_NAME}</button>`}
    </form>
  `
  const form = getByRole(document.body, 'form', { name: FORM_NAME })
  form.addEventListener('submit', (event) => event.preventDefault())
  return form
}

function getSubmitButton() {
  return getByRole(document.body, 'button', { name: SUBMIT_BUTTON_NAME })
}

describe('disableSubmitButtonOnSubmit', () => {
  it('disables the submit button when the form is submitted', async () => {
    const form = mountForm()
    const submitButton = getSubmitButton()
    disableSubmitButtonOnSubmit(form)

    await userEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('re-enables the submit button when the page is restored from the back/forward cache', async () => {
    const form = mountForm()
    const submitButton = getSubmitButton()
    disableSubmitButtonOnSubmit(form)

    await userEvent.click(submitButton)
    fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }))

    expect(submitButton).toBeEnabled()
  })

  it('leaves the submit button disabled on a normal page load', async () => {
    const form = mountForm()
    const submitButton = getSubmitButton()
    disableSubmitButtonOnSubmit(form)

    await userEvent.click(submitButton)
    fireEvent(window, new PageTransitionEvent('pageshow', { persisted: false }))

    expect(submitButton).toBeDisabled()
  })

  it('does nothing when the form has no submit button', () => {
    const form = mountForm({ innerHtml: '' })

    expect(() => disableSubmitButtonOnSubmit(form)).not.toThrow()
  })
})

describe('initDisableSubmitButtons', () => {
  it('wires up every form marked with data-disable-on-submit', async () => {
    mountForm({ formAttributes: 'data-disable-on-submit' })
    const submitButton = getSubmitButton()
    initDisableSubmitButtons()

    await userEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
  })
})
