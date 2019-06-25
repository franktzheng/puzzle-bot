export function getFirstFromPotentialArray<T>(potentialArray: T | T[]): T {
  return Array.isArray(potentialArray) ? potentialArray[0] : potentialArray
}
