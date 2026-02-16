/**
 * Formats a file size in bytes to a human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export function filesizeformat(bytes) {
  if (bytes === null || bytes === undefined) {
    return 'Unknown'
  }

  const units = ['bytes', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  let size = bytes

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  if (unitIndex === 0) {
    return `${size} ${units[unitIndex]}`
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}
