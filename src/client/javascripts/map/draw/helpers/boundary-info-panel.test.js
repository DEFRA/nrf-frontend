// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  PANEL_ROOT_ID,
  renderPanel,
  setSaveButtonDisabled
} from './boundary-info-panel.js'
import { mountBoundaryInfoPanel } from '../test-utils/mount-boundary-info-panel.js'

function panelText(selector) {
  return document
    .getElementById(PANEL_ROOT_ID)
    .querySelector(selector)
    .textContent.trim()
}

function panelHidden(selector) {
  return document.getElementById(PANEL_ROOT_ID).querySelector(selector).hidden
}

function panelHeading() {
  return document
    .getElementById(PANEL_ROOT_ID)
    .closest('[role]')
    .querySelector('h2')
}

describe('buildPanelHtml', () => {
  it('renders a panel with the default summary message', () => {
    mountBoundaryInfoPanel()

    expect(document.getElementById(PANEL_ROOT_ID)).not.toBeNull()
    expect(panelText('[data-boundary-info-summary]')).toBe(
      'Draw a boundary to check it.'
    )
    expect(panelHidden('[data-boundary-action="save"]')).toBe(true)
  })
})

describe('renderPanel', () => {
  it('does nothing when the panel is not mounted', () => {
    expect(() => renderPanel({ summary: 'Checking...' })).not.toThrow()
  })

  it('renders a summary message and hides results', () => {
    mountBoundaryInfoPanel()

    renderPanel({ summary: 'Checking boundary...' })

    expect(panelText('[data-boundary-info-summary]')).toBe(
      'Checking boundary...'
    )
    expect(panelHidden('[data-boundary-info-results]')).toBe(true)
    expect(panelHidden('[data-boundary-info-edps]')).toBe(true)
    expect(panelHidden('[data-boundary-action="save"]')).toBe(true)
  })

  it('renders an error message', () => {
    mountBoundaryInfoPanel()

    renderPanel({ error: 'Invalid geometry' })

    expect(panelText('[data-boundary-info-error]')).toBe('Invalid geometry')
    expect(panelHidden('[data-boundary-info-error]')).toBe(false)
  })

  it('hides the heading on error and moves focus to it', () => {
    mountBoundaryInfoPanel()

    renderPanel({ error: 'Invalid geometry' })

    expect(panelHeading().classList.contains('govuk-visually-hidden')).toBe(
      true
    )
    expect(document.activeElement).toBe(panelHeading())
  })

  it('keeps the heading visible on success and moves focus to it', () => {
    mountBoundaryInfoPanel()

    renderPanel({ results: { intersectingEdps: [] } })

    expect(panelHeading().classList.contains('govuk-visually-hidden')).toBe(
      false
    )
    expect(document.activeElement).toBe(panelHeading())
  })

  it('does not move focus while a check is in progress', () => {
    mountBoundaryInfoPanel()

    renderPanel({ summary: 'Checking boundary...' })

    expect(document.activeElement).not.toBe(panelHeading())
  })

  it('shows the edit button but not the save button on an error, so an invalid boundary (e.g. self-overlapping) can be corrected', () => {
    mountBoundaryInfoPanel()

    renderPanel({ error: 'The red line boundary is overlapping itself.' })

    expect(panelHidden('[data-boundary-action="edit"]')).toBe(false)
    expect(panelHidden('[data-boundary-action="save"]')).toBe(true)
  })

  it('renders results with area, perimeter and intersecting EDPs', () => {
    mountBoundaryInfoPanel()

    renderPanel({
      results: {
        boundaryMetadata: {
          area: { hectares: 12, acres: 30 },
          perimeter: { kilometres: 4, miles: 2.5 }
        },
        intersectingEdps: [{ label: 'Yare Broads' }, 'Bure Broads']
      }
    })

    expect(panelText('[data-boundary-info-area]')).toBe('12ha (30 acres)')
    expect(panelText('[data-boundary-info-perimeter]')).toBe('4km (2.5 miles)')
    expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items).toHaveLength(2)
    expect(
      items[0].querySelector('.app-boundary-info-panel__edp-name').textContent
    ).toBe('Environmental Delivery Plan (EDP)')
    expect(
      items[0].querySelector('.app-boundary-info-panel__edp-description')
        .textContent
    ).toBe('Yare Broads')
    expect(
      items[1].querySelector('.app-boundary-info-panel__edp-description')
        .textContent
    ).toBe('Bure Broads')
  })

  it('omits the name line when the EDP has no label', () => {
    mountBoundaryInfoPanel()

    renderPanel({
      results: {
        intersectingEdps: [{ label: null, overlap_area_ha: 0.5 }]
      }
    })

    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items).toHaveLength(1)
    expect(
      items[0].querySelector('.app-boundary-info-panel__edp-name').textContent
    ).toBe('Environmental Delivery Plan (EDP)')
    expect(
      items[0].querySelector('.app-boundary-info-panel__edp-description')
    ).toBeNull()
  })

  it('shows the unsupported area message when there are no intersecting EDPs', () => {
    mountBoundaryInfoPanel()

    renderPanel({ results: { intersectingEdps: [] } })

    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items).toHaveLength(1)
    expect(items[0].textContent).toBe(
      'An area not supported by an Environmental Delivery Plan (EDP)'
    )
    expect(panelText('[data-boundary-info-area]')).toBe('Not available')
  })
})

describe('setSaveButtonDisabled', () => {
  it('does nothing when the panel is not mounted', () => {
    expect(() => setSaveButtonDisabled(true)).not.toThrow()
  })

  it('disables and enables the save button', () => {
    mountBoundaryInfoPanel()
    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')

    setSaveButtonDisabled(true)
    expect(saveButton.disabled).toBe(true)

    setSaveButtonDisabled(false)
    expect(saveButton.disabled).toBe(false)
  })
})
