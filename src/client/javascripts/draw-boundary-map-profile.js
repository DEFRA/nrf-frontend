import {
  getDrawBoundaryMapOptions,
  getDrawBoundaryMapStyles
} from './draw-boundary-map/config.js'
import { getMapStyleUrl } from './interactive-map-profile-common.js'
import { logWarning } from './interactive-map-utils.js'

export const DRAW_BOUNDARY_MAP_ELEMENT_ID = 'draw-boundary-map'
const MIN_MAP_HEIGHT = 320
const MAP_BOTTOM_GAP = 16

// SVG pencil icon
const PENCIL_SVG =
  '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'

function getMapContainerHeight(mapEl) {
  const footerEl = document.querySelector('.govuk-footer')
  const footerHeight = footerEl?.offsetHeight ?? 0
  const mapTop = mapEl.getBoundingClientRect().top
  const availableHeight = Math.floor(
    window.innerHeight - mapTop - footerHeight - MAP_BOTTOM_GAP
  )

  return `${Math.max(MIN_MAP_HEIGHT, availableHeight)}px`
}

export function getDrawBoundaryMapProfile() {
  return {
    mapElementId: DRAW_BOUNDARY_MAP_ELEMENT_ID,
    getMapOptions({ mapEl, defraApi }) {
      const mapStyleUrl = getMapStyleUrl(mapEl)
      const mapStyles = getDrawBoundaryMapStyles()

      if (!mapStyleUrl && !mapStyles.length) {
        logWarning('Draw boundary map styles not configured')
        return null
      }

      const mapStylesPlugin =
        typeof defraApi.mapStylesPlugin === 'function'
          ? defraApi.mapStylesPlugin
          : null

      if (!mapStylesPlugin) {
        logWarning('Map styles plugin not available, using single style')
      }

      return getDrawBoundaryMapOptions({
        mapProvider: defraApi.maplibreProvider(),
        mapStyleUrl,
        mapStyles,
        mapStylesPlugin,
        containerHeight: getMapContainerHeight(mapEl)
      })
    },
    onMapCreated({ map }) {
      // Wire up draw panel after app is ready
      map.on('app:ready', function () {
        map.addButton('draw', {
          label: 'Draw',
          panelId: 'draw',
          iconSvgContent: PENCIL_SVG,
          mobile: { slot: 'top-left', showLabel: false, order: 2 },
          tablet: { slot: 'top-left', showLabel: false, order: 2 },
          desktop: { slot: 'top-left', showLabel: false, order: 2 }
        })

        map.addPanel('draw', {
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
  }
}
