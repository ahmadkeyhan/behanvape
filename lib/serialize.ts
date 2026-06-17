/**
 * Converts a Mongoose lean doc / array into a plain, client-safe object:
 * ObjectId -> hex string, Date -> ISO string. Use before passing DB data to
 * client components or returning it from API routes.
 */
export function serialize<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T;
}
