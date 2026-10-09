import joi from 'joi'

// The highest zoom the hybrid style requests sea mask tiles at; MapLibre
// overzooms beyond it.
export const seaMaskMaxZoom = 16

function lastTileIndex(z) {
  return 2 ** z - 1
}

// The tile address is passed into the upstream Ordnance Survey URL, so only
// a tile that exists at its zoom gets that far.
export const tileParamsSchema = joi.object({
  z: joi.number().integer().min(0).max(seaMaskMaxZoom).required(),
  x: joi
    .number()
    .integer()
    .min(0)
    .max(joi.ref('z', { adjust: lastTileIndex }))
    .required(),
  y: joi
    .number()
    .integer()
    .min(0)
    .max(joi.ref('z', { adjust: lastTileIndex }))
    .required()
})
