import { VTS_STYLE_BASE_URL, VTS_THUMBNAIL_BASE_URL } from './constants.js'

export function getStyleControlsManifest() {
  return {
    panels: [
      {
        id: 'mapStyles',
        tablet: {
          slot: 'side',
          modal: false,
          width: '400px',
          dismissable: true
        },
        desktop: {
          slot: 'left-top',
          modal: false,
          width: '400px',
          dismissable: true
        }
      }
    ],
    buttons: [
      {
        id: 'mapStyles',
        mobile: {
          slot: 'top-left',
          showLabel: true
        },
        tablet: {
          slot: 'top-left',
          showLabel: true,
          order: 1
        },
        desktop: {
          slot: 'top-left',
          showLabel: true,
          order: 1
        }
      }
    ]
  }
}

function getOrdnanceSurveyAttribution() {
  return `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
}

export function getMapStyles() {
  return [
    {
      id: 'esri-tiles',
      label: 'Satellite',
      url: `${VTS_STYLE_BASE_URL}/ESRI_World_Imagery.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/esri-tiles.svg`,
      attribution: getOrdnanceSurveyAttribution()
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
