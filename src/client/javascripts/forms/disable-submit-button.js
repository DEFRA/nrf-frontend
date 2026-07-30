const DISABLE_ON_SUBMIT_SELECTOR = '[data-disable-on-submit]'

/**
 * Disables a form's submit button once the form is submitted, so the user
 * cannot submit twice. The button is re-enabled if the user returns to the
 * page after the submission fails or is aborted (for example via the browser
 * back button), detected through the back/forward cache `pageshow` event.
 *
 * Progressive enhancement: with JavaScript disabled the form still submits.
 *
 * @param {HTMLFormElement} form - form whose submit button to control
 */
export function disableSubmitButtonOnSubmit(form) {
  const submitButton = form.querySelector('button[type="submit"]')
  if (!submitButton) {
    return
  }

  const disableButton = () => {
    submitButton.disabled = true
  }

  const enableButtonOnBfcacheRestore = (pageshowEvent) => {
    if (pageshowEvent.persisted) {
      submitButton.disabled = false
    }
  }

  form.addEventListener('submit', disableButton)
  window.addEventListener('pageshow', enableButtonOnBfcacheRestore)
}

/**
 * Wires up `disableSubmitButtonOnSubmit` for every form marked with the
 * `data-disable-on-submit` attribute.
 *
 * @param {Document | Element} [root=document] - root to search within
 */
export function initDisableSubmitButtons(root = document) {
  root
    .querySelectorAll(DISABLE_ON_SUBMIT_SELECTOR)
    .forEach(disableSubmitButtonOnSubmit)
}
