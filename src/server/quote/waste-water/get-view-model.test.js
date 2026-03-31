import { describe, it, expect, vi } from 'vitest'

const mockGetWasteWaterTreatmentWorks = vi.fn()

vi.mock('../../common/services/waste-water-treatment-works.js', () => ({
  getWasteWaterTreatmentWorks: mockGetWasteWaterTreatmentWorks
}))

const { default: getViewModel, title } = await import('./get-view-model.js')

describe('waste-water getViewModel', () => {
  it('should export the correct title', () => {
    expect(title).toBe(
      'Confirm which waste water treatment works will be used for this development'
    )
  })

  it('should return the correct pageTitle and pageHeading', async () => {
    mockGetWasteWaterTreatmentWorks.mockResolvedValue([])
    const viewModel = await getViewModel()
    expect(viewModel.pageTitle).toBe(
      'Confirm which waste water treatment works will be used for this development - Nature Restoration Fund - Gov.uk'
    )
    expect(viewModel.pageHeading).toBe(title)
  })

  it('should link back to residential by default', async () => {
    mockGetWasteWaterTreatmentWorks.mockResolvedValue([])
    const viewModel = await getViewModel()
    expect(viewModel.backLinkPath).toBe('/quote/residential')
  })

  it('should link back to residential when developmentTypes does not include other-residential', async () => {
    mockGetWasteWaterTreatmentWorks.mockResolvedValue([])
    const viewModel = await getViewModel({
      developmentTypes: ['commercial']
    })
    expect(viewModel.backLinkPath).toBe('/quote/residential')
  })

  it('should link back to people-count when developmentTypes includes other-residential', async () => {
    mockGetWasteWaterTreatmentWorks.mockResolvedValue([])
    const viewModel = await getViewModel({
      developmentTypes: ['other-residential']
    })
    expect(viewModel.backLinkPath).toBe('/quote/people-count')
  })

  it('should include only the i-dont-know option when service returns empty array', async () => {
    mockGetWasteWaterTreatmentWorks.mockResolvedValue([])
    const viewModel = await getViewModel()
    expect(viewModel.wasteWaterItems).toEqual([
      {
        value: 'i-dont-know',
        text: "I don't know the waste water treatment works yet"
      }
    ])
  })

  it('should map waste water treatment works with a divider before the i-dont-know option', async () => {
    mockGetWasteWaterTreatmentWorks.mockResolvedValue([
      { id: 'great-billing', name: 'Great Billing WRC', distance: 3.2 },
      { id: 'letchworth', name: 'Letchworth WWTP', distance: 7.5 }
    ])
    const viewModel = await getViewModel()
    expect(viewModel.wasteWaterItems).toEqual([
      {
        value: 'great-billing',
        text: 'Great Billing WRC',
        hint: { text: '3.2 km from the centre of the development' }
      },
      {
        value: 'letchworth',
        text: 'Letchworth WWTP',
        hint: { text: '7.5 km from the centre of the development' }
      },
      { divider: 'or' },
      {
        value: 'i-dont-know',
        text: "I don't know the waste water treatment works yet"
      }
    ])
  })

  it('should include a divider when there is a single waste water treatment works', async () => {
    mockGetWasteWaterTreatmentWorks.mockResolvedValue([
      { id: 'main-pump', name: 'Main Pump Hall', distance: 1.8 }
    ])
    const viewModel = await getViewModel()
    expect(viewModel.wasteWaterItems).toEqual([
      {
        value: 'main-pump',
        text: 'Main Pump Hall',
        hint: { text: '1.8 km from the centre of the development' }
      },
      { divider: 'or' },
      {
        value: 'i-dont-know',
        text: "I don't know the waste water treatment works yet"
      }
    ])
  })
})
