/**
 * @typedef {Object} MapFeatureConfig
 * @property {string} mapElementId
 * @property {boolean} [warnOnMissingElement]
 * @property {string} [missingElementMessage]
 * @property {(args: { mapEl: HTMLElement }) => any} [prepareContext]
 * @property {(args: { mapEl: HTMLElement, defraApi: any }) => any} getMapOptions
 * @property {(args: { map: any, context: any }) => void} [onMapCreated]
 */

/**
 * Runtime guard to ensure map feature modules follow the expected contract.
 *
 * @param {MapFeatureConfig} config
 * @param {string} configName
 * @returns {MapFeatureConfig}
 */
export function validateMapFeatureConfig(config, configName) {
  if (!config || typeof config !== 'object') {
    throw new TypeError(`${configName} must return a config object`)
  }

  if (typeof config.mapElementId !== 'string' || !config.mapElementId) {
    throw new TypeError(`${configName}.mapElementId must be a non-empty string`)
  }

  if (typeof config.getMapOptions !== 'function') {
    throw new TypeError(`${configName}.getMapOptions must be a function`)
  }

  if (
    config.prepareContext !== undefined &&
    typeof config.prepareContext !== 'function'
  ) {
    throw new TypeError(`${configName}.prepareContext must be a function`)
  }

  if (
    config.onMapCreated !== undefined &&
    typeof config.onMapCreated !== 'function'
  ) {
    throw new TypeError(`${configName}.onMapCreated must be a function`)
  }

  return config
}
