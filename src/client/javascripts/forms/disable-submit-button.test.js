// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  disableSubmitButtonOnSubmit,
  initDisableSubmitButtons
} from './disable-submit-button.js'

function mountForm() {
  document.body.innerHTML = `
    <form id="test-form">
      <button type="submit">Confirm and submit</button>
    </form>
  `
  return document.getElementById('test-form')
}

function submitButton() {
  return document.querySelector('button[type="submit"]')
}

function dispatchPageshow(persisted) {
  const pageshowEvent = new Event('pageshow')
  Object.defineProperty(pageshowEvent, 'persisted', { value: persisted })
  window.dispatchEvent(pageshowEvent)
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('disableSubmitButtonOnSubmit', () => {
  it('disables the submit button when the form is submitted', () => {
    const form = mountForm()
    disableSubmitButtonOnSubmit(form)

    form.dispatchEvent(new Event('submit'))

    expect(submitButton().disabled).toBe(true)
  })

  it('re-enables the submit button when the page is restored from the back/forward cache', () => {
    const form = mountForm()
    disableSubmitButtonOnSubmit(form)

    form.dispatchEvent(new Event('submit'))
    dispatchPageshow(true)

    expect(submitButton().disabled).toBe(false)
  })

  it('leaves the submit button disabled on a normal page load', () => {
    const form = mountForm()
    disableSubmitButtonOnSubmit(form)

    form.dispatchEvent(new Event('submit'))
    dispatchPageshow(false)

    expect(submitButton().disabled).toBe(true)
  })

  it('does nothing when the form has no submit button', () => {
    document.body.innerHTML = '<form id="test-form"></form>'
    const form = document.getElementById('test-form')

    expect(() => disableSubmitButtonOnSubmit(form)).not.toThrow()
  })
})

describe('initDisableSubmitButtons', () => {
  it('wires up every form marked with data-disable-on-submit', () => {
    document.body.innerHTML = `
      <form data-disable-on-submit>
        <button type="submit">Confirm and submit</button>
      </form>
    `
    initDisableSubmitButtons()

    document.querySelector('form').dispatchEvent(new Event('submit'))

    expect(submitButton().disabled).toBe(true)
  })
})
