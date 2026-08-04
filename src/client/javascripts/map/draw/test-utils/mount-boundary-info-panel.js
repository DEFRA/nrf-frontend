import { buildPanelHtml } from '../helpers/boundary-info-panel.js'

export function mountBoundaryInfoPanel() {
  document.body.insertAdjacentHTML('beforeend', buildPanelHtml())
}
