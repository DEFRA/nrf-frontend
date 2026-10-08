import { VTS_STYLE_BASE_URL, VTS_THUMBNAIL_BASE_URL } from './constants.js'
import apgbAerialStyle from '../../../data/vts/APGB_Aerial.json'
import apgbHybridStyle from '../../../data/vts/APGB_Hybrid.json'

function getOrdnanceSurveyAttribution() {
  return `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
}

/**
 * The map is created with MapLibre's own attribution control switched off, so
 * a style's source credit only reaches the page through the map-styles plugin.
 * Reading it back from the style JSON keeps APGB's licensed imagery credited
 * once, in the styles that carry it. The APGB styles also mask the sea with
 * Ordnance Survey coastline geometry, so both licences have to appear.
 *
 * @param {{ sources: Record<string, { attribution?: string }> }} style
 * @returns {string}
 */
function getApgbAttribution(style) {
  const credits = Object.values(style.sources)
    .map((source) => source.attribution)
    .filter(Boolean)

  return [...credits, getOrdnanceSurveyAttribution()].join(' | ')
}

// mapColorScheme 'dark' tells interactive-map the basemap is dark, so the
// scale bar and draw-ml edit lines and vertices switch to white with a dark
// halo instead of near-black
export function getMapStyles() {
  const styles = [
    {
      id: 'hybrid',
      label: 'Hybrid',
      url: `${VTS_STYLE_BASE_URL}/APGB_Hybrid.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/hybrid.jpg`,
      attribution: getApgbAttribution(apgbHybridStyle),
      mapColorScheme: 'dark'
    },
    {
      id: 'aerial',
      label: 'Aerial',
      url: `${VTS_STYLE_BASE_URL}/APGB_Aerial.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/aerial.jpg`,
      attribution: getApgbAttribution(apgbAerialStyle),
      mapColorScheme: 'dark'
    },
    {
      id: 'outdoor-os',
      label: 'Outdoor OS',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Outdoor.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/outdoor-os.jpg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'dark',
      label: 'Dark',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Dark.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/dark.jpg`,
      attribution: getOrdnanceSurveyAttribution(),
      mapColorScheme: 'dark'
    },
    {
      id: 'black-and-white',
      label: 'Black and white',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Black_and_White.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/black-and-white.jpg`,
      attribution: getOrdnanceSurveyAttribution()
    }
  ]

  // interactive-map hides the copyright at its mobile breakpoint unless the
  // style opts in; the APGB and OS licence terms require the credit on every
  // device
  return styles.map((style) => ({ ...style, showAttributionOnMobile: true }))
}
