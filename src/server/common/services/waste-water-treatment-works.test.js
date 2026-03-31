import { describe, it, expect } from 'vitest'
import { getWasteWaterTreatmentWorks } from './waste-water-treatment-works.js'

describe('getWasteWaterTreatmentWorks', () => {
  it('should return a list of waste water treatment works', async () => {
    const result = await getWasteWaterTreatmentWorks()
    expect(result).toEqual([
      { id: 'great-billing', name: 'Great Billing WRC (Mock)', distance: 3.2 },
      { id: 'letchworth', name: 'Letchworth WWTP (Mock)', distance: 7.5 }
    ])
  })
})
