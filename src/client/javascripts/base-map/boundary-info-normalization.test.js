// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import {
  formatArea,
  formatIntersections,
  formatPerimeter,
  normalizeBoundaryInfoResponse,
  renderIntersections
} from './boundary-info-normalization.js'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('boundary-info-normalization', () => {
  it('formats area as hectares and acres', () => {
    expect(formatArea({ hectares: 3897.19, acres: 9630.2 })).toBe(
      '3897.19ha (9630.2acres)'
    )
    expect(formatArea(null)).toBe('Not available')
    expect(formatArea({ hectares: 1.2 })).toBe('Not available')
  })

  it('formats perimeter as kilometres and miles', () => {
    expect(formatPerimeter({ kilometres: 29.26, miles: 18.18 })).toBe(
      '29.26km (18.18mi)'
    )
    expect(formatPerimeter(null)).toBe('Not available')
    expect(formatPerimeter({ kilometres: 14.15 })).toBe('Not available')
  })

  it('formats intersections for empty and object values', () => {
    expect(formatIntersections([])).toEqual(['None'])
    expect(formatIntersections([{ name: 'Area 1', code: 'A1' }])).toEqual([
      'Area 1 (A1)'
    ])
  })

  it('formats intersections for non-array and mixed item shapes', () => {
    expect(formatIntersections(null)).toEqual(['Not available'])
    expect(
      formatIntersections([
        { name: 'Name only' },
        { code: 'Code only' },
        { other: 'value' },
        42,
        null
      ])
    ).toEqual(['Name only', 'Code only', '{"other":"value"}', '42', 'null'])
  })

  it('renders intersections as li items into the container', () => {
    const container = document.createElement('ul')

    renderIntersections(container, [])
    expect(container.querySelectorAll('li')).toHaveLength(1)
    expect(container.querySelector('li').textContent).toBe('None')

    renderIntersections(container, ['EDP 1', { label: 'EDP 2', id: '2' }])

    const items = Array.from(container.querySelectorAll('li')).map(
      (item) => item.textContent
    )
    expect(items).toEqual(['EDP 1', 'EDP 2 (2)'])
  })

  it('extracts area and perimeter from boundaryMetadata', () => {
    const payload = {
      intersectingEdps: [],
      boundaryMetadata: {
        area: { hectares: 1.2, acres: 3.5 },
        perimeter: { kilometres: 14.15, miles: 9.3 }
      }
    }

    const result = normalizeBoundaryInfoResponse(payload)

    expect(result.area).toEqual({ hectares: 1.2, acres: 3.5 })
    expect(result.perimeter).toEqual({ kilometres: 14.15, miles: 9.3 })
  })

  it('respects explicit validity and error fields', () => {
    const payload = {
      valid: false,
      message: 'Invalid boundary',
      edps: ['EDP-X']
    }

    const result = normalizeBoundaryInfoResponse(payload)

    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Invalid boundary')
    expect(result.intersectingEdps).toEqual(['EDP-X'])
  })
})
