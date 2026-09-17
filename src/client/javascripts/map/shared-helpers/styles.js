import { VTS_STYLE_BASE_URL, VTS_THUMBNAIL_BASE_URL } from './constants.js'
import apgbAerialStyle from '../../../data/vts/APGB_Aerial.json'

function getOrdnanceSurveyAttribution() {
  return `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
}

/**
 * The map is created with MapLibre's own attribution control switched off, so
 * a style's source credit only reaches the page through the map-styles plugin.
 * Reading it back from the style JSON keeps APGB's licensed imagery credited
 * once, in the style that carries it. The aerial style also masks the sea with
 * Ordnance Survey coastline geometry, so both licences have to appear.
 *
 * @param {{ sources: Record<string, { attribution?: string }> }} style
 * @returns {string}
 */
function getAerialAttribution(style) {
  const credits = Object.values(style.sources)
    .map((source) => source.attribution)
    .filter(Boolean)

  return [...credits, getOrdnanceSurveyAttribution()].join(' | ')
}

export function getMapStyles() {
  const styles = [
    {
      id: 'aerial',
      label: 'Aerial',
      url: `${VTS_STYLE_BASE_URL}/APGB_Aerial.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/aerial.svg`,
      attribution: getAerialAttribution(apgbAerialStyle)
    },
    {
      id: 'outdoor-os',
      label: 'Outdoor OS',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Outdoor.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/outdoor-os.svg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'dark',
      label: 'Dark',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Dark.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/dark.svg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'black-and-white',
      label: 'Black and white',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Black_and_White.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/black-and-white.svg`,
      attribution: getOrdnanceSurveyAttribution()
    }
  ]

  // interactive-map hides the copyright at its mobile breakpoint unless the
  // style opts in; the APGB and OS licence terms require the credit on every
  // device
  return styles.map((style) => ({ ...style, showAttributionOnMobile: true }))
}
