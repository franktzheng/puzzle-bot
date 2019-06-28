export function getFirstFromPotentialArray<T>(potentialArray: T | T[]): T {
  return Array.isArray(potentialArray) ? potentialArray[0] : potentialArray
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < Math.ceil(array.length / chunkSize); i++) {
    result.push(array.slice(i * chunkSize, (i + 1) * chunkSize))
  }
  return result
}
