import { buildPanelHtml } from '../helpers/boundary-info-panel.js'

// Mirrors interactive-map's own Panel markup: a landmark element with a
// role (used to resolve aria-labelledby) containing the library's own <h2>
// as a sibling of the body wrapper that holds buildPanelHtml's content.
export function mountBoundaryInfoPanel() {
  const container = document.createElement('div')
  container.setAttribute('role', 'complementary')
  container.innerHTML = `
    <h2 class="im-c-panel__heading im-e-heading-m">Boundary information</h2>
    <div class="im-c-panel__body">${buildPanelHtml()}</div>
  `
  document.body.appendChild(container)
}
