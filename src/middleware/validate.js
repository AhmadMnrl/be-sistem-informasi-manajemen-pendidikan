const { ZodError } = require("zod");

function tryParseJson(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_) {
    return null;
  }
}

function normalizeBodyPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;

  const wrappers = ["data", "payload", "body"];
  for (const key of wrappers) {
    const wrapped = body[key];
    if (wrapped && typeof wrapped === "object" && !Array.isArray(wrapped) && Object.keys(body).length === 1) {
      return wrapped;
    }

    const parsed = tryParseJson(wrapped);
    if (parsed && Object.keys(body).length === 1) {
      return parsed;
    }
  }

  return body;
}

function validate({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(normalizeBodyPayload(req.body ?? {}));
      if (query) req.query = query.parse(req.query ?? {});
      if (params) req.params = params.parse(req.params ?? {});
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        // Hindari message universal; ambil pesan dari skema sedetail mungkin.
        const firstMessage = err.errors?.[0]?.message;
        const flattened = err.flatten();

        return res.status(400).json({
          message: firstMessage,
          errors: flattened,
        });
      }
      return next(err);
    }
  };
}

module.exports = { validate };
