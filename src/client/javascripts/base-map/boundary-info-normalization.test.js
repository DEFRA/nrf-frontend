// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'

import {
  formatBounds,
  formatIntersections,
  normalizeBoundaryInfoResponse,
  renderIntersections
} from './boundary-info-normalization.js'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('boundary-info-normalization', () => {
  it('formats bounds using fixed precision', () => {
    expect(formatBounds([-1.23456, 2.1, 3.98765, 4])).toBe(
      '-1.234560, 2.100000, 3.987650, 4.000000'
    )
    expect(formatBounds(null)).toBe('Not available')
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

  it('renders intersections as text for None and as a list for multiple values', () => {
    const container = document.createElement('div')

    renderIntersections(container, [])
    expect(container.textContent).toBe('None')

    renderIntersections(container, ['EDP 1', { label: 'EDP 2', id: '2' }])

    const items = Array.from(container.querySelectorAll('li')).map(
      (item) => item.textContent
    )
    expect(items).toEqual(['EDP 1', 'EDP 2 (2)'])
  })

  it('normalizes bounds from nested polygon geometry', () => {
    const payload = {
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-2, -3],
            [3, -1],
            [1, 5],
            [-2, -3]
          ]
        ]
      },
      intersectingEdps: []
    }

    const result = normalizeBoundaryInfoResponse(payload)

    expect(result.bounds).toEqual([-2, -3, 3, 5])
    expect(result.isValid).toBe(true)
  })

  it('normalizes bounds from a feature collection payload', () => {
    const payload = {
      geometry: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [1, 1],
                  [2, 5],
                  [4, 2],
                  [1, 1]
                ]
              ]
            }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-3, -2],
                  [-1, -4],
                  [0, -1],
                  [-3, -2]
                ]
              ]
            }
          }
        ]
      },
      intersections: {
        edps: ['EDP-1']
      }
    }

    const result = normalizeBoundaryInfoResponse(payload)

    expect(result.bounds).toEqual([-3, -4, 4, 5])
    expect(result.intersectingEdps).toEqual(['EDP-1'])
    expect(result.isValid).toBe(true)
  })

  it('returns null bounds and invalid result when geometry is not usable', () => {
    const payload = {
      geometry: {
        type: 'Polygon',
        coordinates: [[['x', 'y']]]
      },
      intersectingEdps: null
    }

    const result = normalizeBoundaryInfoResponse(payload)

    expect(result.bounds).toBeNull()
    expect(result.isValid).toBe(false)
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
