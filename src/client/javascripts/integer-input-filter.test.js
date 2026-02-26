import { describe, it, expect } from 'vitest'
import { extractDigits, isKeyAllowed } from './integer-input-filter.js'

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
})
