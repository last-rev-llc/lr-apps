import type { z } from "zod";

export type ValidationSuccess<T> = { ok: true; data: T };
export type ValidationFailure = { ok: false; response: Response };
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Parse a JSON request body against a Zod schema. On failure returns a
 * pre-built Response the caller can return directly, so route handlers stay
 * short and the error shape stays consistent.
 */
export async function validateJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ValidationResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      response: Response.json(
        {
          error: "invalid_json",
          message: "Request body is not valid JSON",
        },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "invalid_input",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path,
            message: issue.message,
            code: issue.code,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
