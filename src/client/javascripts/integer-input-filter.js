/**
 * Integer input filter
 * Allows: digits 0-9, optionally a leading minus sign
 * Blocks: letters, decimals, commas, scientific notation
 */

/**
 * Extracts digits from a string, optionally preserving a leading minus
 */
export function extractDigits(value, allowNegative = false) {
  const digits = value.replaceAll(/\D/g, '')
  if (allowNegative && value.startsWith('-') && digits) {
    return '-' + digits
  }
  return digits
}

/**
 * Checks if a keypress should be allowed
 * Control keys (Backspace, Tab, arrows, etc.) have key.length > 1
 */
export function isKeyAllowed(key, event, input, allowNegative) {
  // Allow control keys (multi-char names) and modifier combinations
  if (key.length > 1 || event.ctrlKey || event.metaKey) {
    return true
  }

  // Allow minus at start if negative numbers permitted
  if (key === '-' && allowNegative) {
    return input.selectionStart === 0 && !input.value.includes('-')
  }

  return /^\d$/.test(key)
}

/**
 * Initializes integer filtering on all inputs with data-integer-filter attribute
 */
export function initAllIntegerFilters() {
  document.querySelectorAll('[data-integer-filter]').forEach((input) => {
    const allowNegative = input.dataset.allowNegative === 'true'

    input.addEventListener('keydown', (event) => {
      if (!isKeyAllowed(event.key, event, input, allowNegative)) {
        event.preventDefault()
      }
    })

    // Fallback filter: strips invalid chars that bypass keydown (e.g. autofill, drag-drop)
    input.addEventListener('input', () => {
      const filtered = extractDigits(input.value, allowNegative)
      if (input.value !== filtered) {
        // Preserve cursor position relative to valid characters
        const cursor = extractDigits(
          input.value.substring(0, input.selectionStart),
          allowNegative
        ).length
        input.value = filtered
        input.setSelectionRange(cursor, cursor)
      }
    })

    // Handle paste: extract digits from pasted content and merge with existing value
    input.addEventListener('paste', (event) => {
      event.preventDefault()
      const pasted = event.clipboardData?.getData('text') || ''
      const before = input.value.substring(0, input.selectionStart)
      const after = input.value.substring(input.selectionEnd)
      const newValue = extractDigits(before + pasted + after, allowNegative)

      if (newValue) {
        // Position cursor after the pasted digits
        const cursorPos =
          extractDigits(before, allowNegative).length +
          extractDigits(pasted, false).length
        input.value = newValue
        input.setSelectionRange(cursorPos, cursorPos)
        input.dispatchEvent(new Event('input', { bubbles: true }))
      }
    })
  })
}
