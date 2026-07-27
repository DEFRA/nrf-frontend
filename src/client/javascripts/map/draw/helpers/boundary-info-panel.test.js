// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  PANEL_ROOT_ID,
  buildPanelHtml,
  renderPanel,
  setSaveButtonDisabled
} from './boundary-info-panel.js'

function mountPanel() {
  document.body.insertAdjacentHTML('beforeend', buildPanelHtml())
}

function panelText(selector) {
  return document
    .getElementById(PANEL_ROOT_ID)
    .querySelector(selector)
    .textContent.trim()
}

function panelHidden(selector) {
  return document.getElementById(PANEL_ROOT_ID).querySelector(selector).hidden
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('buildPanelHtml', () => {
  it('renders a panel with the default summary message', () => {
    mountPanel()

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
    mountPanel()

    renderPanel({ summary: 'Checking boundary...' })

    expect(panelText('[data-boundary-info-summary]')).toBe(
      'Checking boundary...'
    )
    expect(panelHidden('[data-boundary-info-results]')).toBe(true)
    expect(panelHidden('[data-boundary-info-edps]')).toBe(true)
  })

  it('renders an error message', () => {
    mountPanel()

    renderPanel({ error: 'Invalid geometry' })

    expect(panelText('[data-boundary-info-error]')).toBe('Invalid geometry')
    expect(panelHidden('[data-boundary-info-error]')).toBe(false)
  })

  it('renders results with area, perimeter and intersecting EDPs', () => {
    mountPanel()

    renderPanel({
      results: {
        isValid: true,
        boundaryMetadata: {
          area: { hectares: 12, acres: 30 },
          perimeter: { kilometres: 4, miles: 2.5 }
        },
        intersectingEdps: [{ name: 'Yare Broads', code: 'EDP1' }, 'Bure Broads']
      }
    })

    expect(panelText('[data-boundary-info-area]')).toBe('12ha (30 acres)')
    expect(panelText('[data-boundary-info-perimeter]')).toBe('4km (2.5 miles)')
    expect(panelHidden('[data-boundary-action="save"]')).toBe(false)
    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items).toHaveLength(2)
    expect(items[0].textContent).toBe('Yare Broads')
    expect(items[1].textContent).toBe('Bure Broads')
  })

  it('shows "None" when there are no intersecting EDPs', () => {
    mountPanel()

    renderPanel({ results: { isValid: true, intersectingEdps: [] } })

    const items = document
      .getElementById(PANEL_ROOT_ID)
      .querySelectorAll('[data-boundary-info-intersections] li')
    expect(items).toHaveLength(1)
    expect(items[0].textContent).toBe('None')
    expect(panelText('[data-boundary-info-area]')).toBe('Not available')
  })

  it('hides the save button when the result is invalid', () => {
    mountPanel()

    renderPanel({ results: { isValid: false, intersectingEdps: [] } })

    expect(panelHidden('[data-boundary-action="save"]')).toBe(true)
  })
})

describe('setSaveButtonDisabled', () => {
  it('does nothing when the panel is not mounted', () => {
    expect(() => setSaveButtonDisabled(true)).not.toThrow()
  })

  it('disables and enables the save button', () => {
    mountPanel()
    const saveButton = document
      .getElementById(PANEL_ROOT_ID)
      .querySelector('[data-boundary-action="save"]')

    setSaveButtonDisabled(true)
    expect(saveButton.disabled).toBe(true)

    setSaveButtonDisabled(false)
    expect(saveButton.disabled).toBe(false)
  })
})
