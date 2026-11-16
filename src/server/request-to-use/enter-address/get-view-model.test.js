import { describe, it, expect } from 'vitest'
import getViewModel from './get-view-model.js'

describe('enter address getViewModel', () => {
  it('uses a heading without the organisation name when the profile has none', () => {
    expect(getViewModel({ userRelationshipType: 'Agent' }).pageHeading).toBe(
      'What are the details for the business or organisation?'
    )
  })
})
