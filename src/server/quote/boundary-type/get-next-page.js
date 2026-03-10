export default function ({ boundaryEntryType }) {
  if (boundaryEntryType === 'upload') {
    return '/quote/upload-boundary'
  }

  return '/quote/next'
}
