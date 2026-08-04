function buildDrawStartPanelHtml() {
  return `
    <div class="app-draw-start-panel">
      <button class="govuk-button govuk-button--primary govuk-!-margin-bottom-0" type="button">Draw</button>
    </div>
  `
}

/**
 * @param {Function} onClick
 * @param {{ hidden: boolean }} params
 */
function buildDrawStartPanel(onClick, { hidden }) {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = buildDrawStartPanelHtml()

  const panel = wrapper.firstElementChild
  panel.hidden = hidden
  panel.querySelector('button').addEventListener('click', onClick)

  return panel
}

function noop() {}

/**
 * @param {object} interactiveMap
 * @param {{ mapElementId: string, startDraw: Function, hasExistingBoundary: boolean, getHasBoundary: Function }} params
 */
export function wireDrawStartPanel(
  interactiveMap,
  { mapElementId, startDraw, hasExistingBoundary, getHasBoundary }
) {
  const mapElement = document.getElementById(mapElementId)
  if (!mapElement) {
    return { setHidden: noop }
  }

  const panel = buildDrawStartPanel(startDraw, { hidden: hasExistingBoundary })
  mapElement.appendChild(panel)

  const setHidden = (hidden) => {
    panel.hidden = hidden
  }

  function onDrawStarted() {
    setHidden(true)
  }

  function onDrawCancelled() {
    setHidden(getHasBoundary())
  }

  interactiveMap.on('draw:started', onDrawStarted)
  interactiveMap.on('draw:cancelled', onDrawCancelled)

  return { setHidden }
}
