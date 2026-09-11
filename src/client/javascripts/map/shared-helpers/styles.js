import { VTS_STYLE_BASE_URL, VTS_THUMBNAIL_BASE_URL } from './constants.js'
import apgbAerialStyle from '../../../data/vts/APGB_Aerial.json'

function getOrdnanceSurveyAttribution() {
  return `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
}

/**
 * The map is created with MapLibre's own attribution control switched off, so
 * a style's source credit only reaches the page through the map-styles plugin.
 * Reading it back from the style JSON keeps APGB's licensed imagery credited
 * once, in the style that carries it.
 *
 * @param {{ sources: Record<string, { attribution?: string }> }} style
 * @returns {string | undefined}
 */
function getStyleSourceAttribution(style) {
  const [source] = Object.values(style.sources)

  return source?.attribution
}

export function getMapStyles() {
  return [
    {
      id: 'aerial',
      label: 'Aerial',
      url: `${VTS_STYLE_BASE_URL}/APGB_Aerial.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/aerial.svg`,
      attribution: getStyleSourceAttribution(apgbAerialStyle)
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
}
