// @vitest-environment jsdom
/* global KeyboardEvent */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  extractDigits,
  isKeyAllowed,
  initAllIntegerFilters
} from './integer-input-filter.js'

// Helper to create mock event and input for isKeyAllowed tests
const mockKeyEvent = (ctrlKey = false, metaKey = false) => ({
  ctrlKey,
  metaKey
})
const mockInput = (value = '', selectionStart = 0) => ({
  value,
  selectionStart
})

describe('integer-input-filter', () => {
  describe('extractDigits', () => {
    it('keeps digits unchanged', () => {
      expect(extractDigits('123')).toBe('123')
      expect(extractDigits('6')).toBe('6')
      expect(extractDigits('999999')).toBe('999999')
    })

    it('filters out non-numeric characters', () => {
      expect(extractDigits('abc')).toBe('')
      expect(extractDigits('123abc456')).toBe('123456')
      expect(extractDigits(' 12 ')).toBe('12')
    })

    it('filters out commas', () => {
      expect(extractDigits('1,000')).toBe('1000')
      expect(extractDigits('1,234,567')).toBe('1234567')
    })

    it('filters out scientific notation characters', () => {
      expect(extractDigits('1e3')).toBe('13')
      expect(extractDigits('1E3')).toBe('13')
      expect(extractDigits('+10')).toBe('10')
      expect(extractDigits('1.5e+10')).toBe('1510')
    })

    it('filters out text with units', () => {
      expect(extractDigits('25 units')).toBe('25')
      expect(extractDigits('units: 25')).toBe('25')
    })

    it('filters out decimal points', () => {
      expect(extractDigits('3.5')).toBe('35')
      expect(extractDigits('1.2.3')).toBe('123')
    })

    it('handles edge cases', () => {
      expect(extractDigits('')).toBe('')
      expect(extractDigits('abc!@#')).toBe('')
      expect(extractDigits('!@#$%^&*()')).toBe('')
    })

    describe('with allowNegative', () => {
      it('preserves leading minus when true', () => {
        expect(extractDigits('-123', true)).toBe('-123')
      })

      it('removes leading minus when false', () => {
        expect(extractDigits('-123', false)).toBe('123')
        expect(extractDigits('-123')).toBe('123')
      })

      it('preserves only leading minus, not embedded ones', () => {
        expect(extractDigits('-12-34', true)).toBe('-1234')
        expect(extractDigits('12-34', true)).toBe('1234')
      })

      it('returns empty for just minus sign', () => {
        expect(extractDigits('-', true)).toBe('')
      })

      it('handles negative with text', () => {
        expect(extractDigits('-25 units', true)).toBe('-25')
      })
    })
  })

  describe('isKeyAllowed', () => {
    it('allows all digit keys', () => {
      for (let i = 0; i <= 9; i++) {
        expect(
          isKeyAllowed(String(i), mockKeyEvent(), mockInput(), false)
        ).toBe(true)
      }
    })

    it('allows control keys', () => {
      const controlKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight'
      ]
      controlKeys.forEach((key) => {
        expect(isKeyAllowed(key, mockKeyEvent(), mockInput(), false)).toBe(true)
      })
    })

    it('allows Ctrl/Cmd combinations', () => {
      expect(
        isKeyAllowed('a', mockKeyEvent(true, false), mockInput(), false)
      ).toBe(true)
      expect(
        isKeyAllowed('c', mockKeyEvent(true, false), mockInput(), false)
      ).toBe(true)
      expect(
        isKeyAllowed('v', mockKeyEvent(false, true), mockInput(), false)
      ).toBe(true)
    })

    it('blocks letters', () => {
      expect(isKeyAllowed('a', mockKeyEvent(), mockInput(), false)).toBe(false)
      expect(isKeyAllowed('e', mockKeyEvent(), mockInput(), false)).toBe(false)
      expect(isKeyAllowed('E', mockKeyEvent(), mockInput(), false)).toBe(false)
    })

    it('blocks punctuation', () => {
      expect(isKeyAllowed(',', mockKeyEvent(), mockInput(), false)).toBe(false)
      expect(isKeyAllowed('.', mockKeyEvent(), mockInput(), false)).toBe(false)
      expect(isKeyAllowed(' ', mockKeyEvent(), mockInput(), false)).toBe(false)
      expect(isKeyAllowed('+', mockKeyEvent(), mockInput(), false)).toBe(false)
    })

    describe('minus key with allowNegative', () => {
      it('allows minus at position 0 when allowNegative is true', () => {
        expect(isKeyAllowed('-', mockKeyEvent(), mockInput('', 0), true)).toBe(
          true
        )
      })

      it('blocks minus when allowNegative is false', () => {
        expect(isKeyAllowed('-', mockKeyEvent(), mockInput('', 0), false)).toBe(
          false
        )
      })

      it('blocks minus when not at position 0', () => {
        expect(
          isKeyAllowed('-', mockKeyEvent(), mockInput('12', 2), true)
        ).toBe(false)
      })

      it('blocks second minus if value already has one', () => {
        expect(
          isKeyAllowed('-', mockKeyEvent(), mockInput('-5', 0), true)
        ).toBe(false)
      })
    })
  })

  describe('initAllIntegerFilters', () => {
    let input

    beforeEach(() => {
      input = document.createElement('input')
      input.setAttribute('data-integer-filter', 'true')
      input.setAttribute('data-allow-negative', 'false')
      document.body.appendChild(input)
      initAllIntegerFilters()
    })

    afterEach(() => {
      document.body.innerHTML = ''
    })

    describe('keydown event', () => {
      it('allows digit keys', () => {
        const event = new KeyboardEvent('keydown', {
          key: '5',
          cancelable: true
        })
        input.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(false)
      })

      it('blocks letter keys', () => {
        const event = new KeyboardEvent('keydown', {
          key: 'a',
          cancelable: true
        })
        input.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(true)
      })

      it('allows control keys', () => {
        const event = new KeyboardEvent('keydown', {
          key: 'Backspace',
          cancelable: true
        })
        input.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(false)
      })

      it('blocks minus when allowNegative is false', () => {
        const event = new KeyboardEvent('keydown', {
          key: '-',
          cancelable: true
        })
        input.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(true)
      })
    })

    describe('input event (fallback filter)', () => {
      it('filters invalid characters from value', () => {
        input.value = '12abc34'
        input.selectionStart = 7
        input.dispatchEvent(new Event('input'))
        expect(input.value).toBe('1234')
      })

      it('leaves valid input unchanged', () => {
        input.value = '123'
        input.selectionStart = 3
        input.dispatchEvent(new Event('input'))
        expect(input.value).toBe('123')
      })

      it('preserves cursor position relative to valid characters', () => {
        input.value = '12a34'
        input.selectionStart = 3 // after 'a'
        input.dispatchEvent(new Event('input'))
        expect(input.value).toBe('1234')
        expect(input.selectionStart).toBe(2) // after '12'
      })
    })

    describe('paste event', () => {
      const createPasteEvent = (text) => {
        const event = new Event('paste', { cancelable: true, bubbles: true })
        event.clipboardData = { getData: () => text }
        return event
      }

      it('extracts digits from pasted text', () => {
        input.value = ''
        input.selectionStart = 0
        input.selectionEnd = 0
        input.dispatchEvent(createPasteEvent('abc123def'))
        expect(input.value).toBe('123')
      })

      it('inserts pasted digits at cursor position', () => {
        input.value = '12'
        input.selectionStart = 1
        input.selectionEnd = 1
        input.dispatchEvent(createPasteEvent('99'))
        expect(input.value).toBe('1992')
      })

      it('replaces selected text with pasted digits', () => {
        input.value = '12345'
        input.selectionStart = 1
        input.selectionEnd = 4
        input.dispatchEvent(createPasteEvent('99'))
        expect(input.value).toBe('1995')
      })

      it('ignores paste if result would be empty', () => {
        input.value = ''
        input.selectionStart = 0
        input.selectionEnd = 0
        input.dispatchEvent(createPasteEvent('abc'))
        expect(input.value).toBe('')
      })

      it('handles paste with missing clipboardData', () => {
        input.value = '12'
        input.selectionStart = 2
        input.selectionEnd = 2
        const event = new Event('paste', { cancelable: true, bubbles: true })
        // No clipboardData property
        input.dispatchEvent(event)
        expect(input.value).toBe('12') // unchanged
      })
    })

    describe('with allowNegative enabled', () => {
      beforeEach(() => {
        document.body.innerHTML = ''
        input = document.createElement('input')
        input.setAttribute('data-integer-filter', 'true')
        input.setAttribute('data-allow-negative', 'true')
        document.body.appendChild(input)
        initAllIntegerFilters()
      })

      it('allows minus key at start', () => {
        input.selectionStart = 0
        const event = new KeyboardEvent('keydown', {
          key: '-',
          cancelable: true
        })
        input.dispatchEvent(event)
        expect(event.defaultPrevented).toBe(false)
      })

      it('preserves leading minus in input filter', () => {
        input.value = '-12abc'
        input.selectionStart = 6
        input.dispatchEvent(new Event('input'))
        expect(input.value).toBe('-12')
      })
    })
  })
})
