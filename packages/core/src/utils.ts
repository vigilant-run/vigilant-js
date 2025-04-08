export function getCurrentTime(): string {
  const now = new Date()
  const isoString = now.toISOString().replace('Z', '000Z')
  const [_, nanoseconds] = process.hrtime()
  const highPrecisionISOString = isoString.replace(
    /(\.\d{3})/,
    `.${nanoseconds.toString().padStart(9, '0')}`,
  )
  return highPrecisionISOString
}
