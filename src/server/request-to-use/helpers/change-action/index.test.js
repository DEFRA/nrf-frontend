import { describe, it, expect } from 'vitest'
import { changeAction } from './index.js'

describe('changeAction', () => {
  it('builds one Change link with the row name hidden from sighted users', () => {
    expect(
      changeAction('your address', '/request-to-use/enter-address')
    ).toEqual({
      items: [
        {
          href: '/request-to-use/enter-address',
          text: 'Change',
          visuallyHiddenText: 'your address'
        }
      ]
    })
  })
})
