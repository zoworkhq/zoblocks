import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * Mongo ids are 24-hex ObjectIds, not UUIDs. Validating with `z.string().uuid()`
 * — as the SQL version did — would reject every real id here, so every entry
 * point that used to take a uuid takes this instead.
 *
 * Returns the ObjectId rather than the string: converting at the boundary means
 * nothing downstream has to remember to, and a malformed id fails at the edge
 * where the error is still legible.
 */
export const objectId = z
  .string()
  .refine((v) => ObjectId.isValid(v), { message: "Not a valid id." })
  .transform((v) => new ObjectId(v));

export type { ObjectId };
