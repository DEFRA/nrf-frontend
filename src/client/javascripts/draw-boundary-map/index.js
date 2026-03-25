import {
  getDrawBoundaryMapOptions,
  getDrawBoundaryMapStyles
} from './config.js'

const MAP_ELEMENT_ID = 'draw-boundary-map'
const MIN_MAP_HEIGHT = 320
const MAP_BOTTOM_GAP = 16

// SVG pencil icon
const PENCIL_SVG =
  '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'

function logWarning(message, error) {
  console.warn(message, error || '')
}

function getMapContainerHeight(mapEl) {
  const footerEl = document.querySelector('.govuk-footer')
  const footerHeight = footerEl?.offsetHeight ?? 0
  const mapTop = mapEl.getBoundingClientRect().top
  const availableHeight = Math.floor(
    window.innerHeight - mapTop - footerHeight - MAP_BOTTOM_GAP
  )

  return `${Math.max(MIN_MAP_HEIGHT, availableHeight)}px`
}

function getDefraApi() {
  const defraApi = globalThis?.defra

  if (!defraApi || !defraApi.InteractiveMap || !defraApi.maplibreProvider) {
    return null
  }

  return defraApi
}

function initDrawBoundaryMap() {
  const mapEl = document.getElementById(MAP_ELEMENT_ID)

  if (!mapEl) {
    return
  }

  const defraApi = getDefraApi()

  if (!defraApi) {
    logWarning('DEFRA interactive map dependencies not available')
    return
  }

  const mapStyleUrl = mapEl.dataset.mapStyleUrl
  const mapStyles = getDrawBoundaryMapStyles()

  if (!mapStyleUrl && !mapStyles.length) {
    logWarning('Draw boundary map styles not configured')
    return
  }

  const mapStylesPlugin =
    typeof defraApi.mapStylesPlugin === 'function'
      ? defraApi.mapStylesPlugin
      : null

  if (!mapStylesPlugin) {
    logWarning('Map styles plugin not available, using single style')
  }

  const mapProvider = defraApi.maplibreProvider()
  const containerHeight = getMapContainerHeight(mapEl)

  const interactiveMap = new defraApi.InteractiveMap(
    MAP_ELEMENT_ID,
    getDrawBoundaryMapOptions({
      mapProvider,
      mapStyleUrl,
      mapStyles,
      mapStylesPlugin,
      containerHeight
    })
  )

  // Wire up draw panel after app is ready
  interactiveMap.on('app:ready', function () {
    interactiveMap.addButton('draw', {
      label: 'Draw',
      panelId: 'draw',
      iconSvgContent: PENCIL_SVG,
      mobile: { slot: 'top-left', showLabel: false, order: 2 },
      tablet: { slot: 'top-left', showLabel: false, order: 2 },
      desktop: { slot: 'top-left', showLabel: false, order: 2 }
    })

    interactiveMap.addPanel('draw', {
      label: 'Draw',
      html: '<div class="app-draw-panel">Draw panel content</div>',
      mobile: { slot: 'bottom', modal: true, open: false },
      tablet: {
        slot: 'left-bottom',
        modal: false,
        width: '400px',
        open: false
      },
      desktop: {
        slot: 'left-bottom',
        modal: false,
        width: '400px',
        open: false
      }
    })
  })
}

document.addEventListener('DOMContentLoaded', initDrawBoundaryMap)
