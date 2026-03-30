import { describe, it, expect } from 'vitest'
import getViewModel, { title } from './get-view-model.js'

describe('waste-water getViewModel', () => {
  it('should export the correct title', () => {
    expect(title).toBe(
      'Confirm which waste water treatment works will be used for this development'
    )
  })

  it('should return the correct pageTitle and pageHeading', () => {
    const viewModel = getViewModel()
    expect(viewModel.pageTitle).toBe(
      'Confirm which waste water treatment works will be used for this development - Nature Restoration Fund - Gov.uk'
    )
    expect(viewModel.pageHeading).toBe(title)
  })

  it('should link back to people-count', () => {
    const viewModel = getViewModel()
    expect(viewModel.backLinkPath).toBe('/quote/people-count')
  })

  it('should include only the i-dont-know option when no wasteWaterOptions', () => {
    const viewModel = getViewModel()
    expect(viewModel.wasteWaterItems).toEqual([
      {
        value: 'i-dont-know',
        text: "I don't know the waste water treatment works yet"
      }
    ])
  })

  it('should include only the i-dont-know option when wasteWaterOptions is empty', () => {
    const viewModel = getViewModel({ wasteWaterOptions: [] })
    expect(viewModel.wasteWaterItems).toEqual([
      {
        value: 'i-dont-know',
        text: "I don't know the waste water treatment works yet"
      }
    ])
  })

  it('should include only the i-dont-know option when quoteData is undefined', () => {
    const viewModel = getViewModel(undefined)
    expect(viewModel.wasteWaterItems).toEqual([
      {
        value: 'i-dont-know',
        text: "I don't know the waste water treatment works yet"
      }
    ])
  })

  it('should map wasteWaterOptions with a divider before the i-dont-know option', () => {
    const viewModel = getViewModel({
      wasteWaterOptions: [
        { id: 'great-billing', name: 'Great Billing WRC', distance: 3.2 },
        { id: 'letchworth', name: 'Letchworth WWTP', distance: 7.5 }
      ]
    })
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

  it('should include a divider when there is a single wasteWaterOption', () => {
    const viewModel = getViewModel({
      wasteWaterOptions: [
        { id: 'main-pump', name: 'Main Pump Hall', distance: 1.8 }
      ]
    })
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
