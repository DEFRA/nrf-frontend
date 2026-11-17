import { describe, it, expect } from 'vitest'
import { addressAnswerHtml } from './index.js'

const address = {
  addressLine1: '1 Development Road',
  addressLine2: 'Building 2',
  townOrCity: 'Development',
  county: 'Devonshire',
  postcode: 'DV1 6RP'
}

describe('addressAnswerHtml', () => {
  it('joins every saved line, dropping blanks', () => {
    expect(
      addressAnswerHtml({ ...address, addressLine2: '', county: '' })
    ).toBe('1 Development Road<br>Development<br>DV1 6RP')
  })

  it('escapes user-controlled lines so only the br tags are markup', () => {
    expect(
      addressAnswerHtml({
        ...address,
        addressLine1: '<script>alert(1)</script>'
      })
    ).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;<br>Building 2<br>Development<br>Devonshire<br>DV1 6RP'
    )
  })

  it('renders nothing when there is no address', () => {
    expect(addressAnswerHtml()).toBe('')
  })
})
