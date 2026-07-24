const MIN_CONTAINER_HEIGHT = 320
const CONTAINER_BOTTOM_GAP = 16

export function getContainerHeight(mapEl) {
  const mapTop = mapEl.getBoundingClientRect().top
  const availableHeight = Math.floor(
    window.innerHeight - mapTop - CONTAINER_BOTTOM_GAP
  )

  return `${Math.max(MIN_CONTAINER_HEIGHT, availableHeight)}px`
}

export function wireResizeMapHeight(mapElement) {
  function applyHeight() {
    mapElement.style.height = getContainerHeight(mapElement)
  }

  window.addEventListener('resize', applyHeight)
}
