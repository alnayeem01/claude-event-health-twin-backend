function validateDecisionBody(req, res, next) {
  const raw = req.body?.decision;
  if (raw === undefined || raw === null) {
    return res.status(400).json({ error: "decision is required" });
  }
  if (typeof raw !== "string") {
    return res.status(400).json({ error: "decision must be a string" });
  }
  const decision = raw.trim();
  if (decision.length === 0) {
    return res.status(400).json({ error: "decision must not be empty" });
  }
  if (decision.length <= 5) {
    return res.status(400).json({
      error: "decision must be longer than 5 characters",
    });
  }
  if (decision.length >= 300) {
    return res.status(400).json({
      error: "decision must be shorter than 300 characters",
    });
  }
  req.validatedDecision = decision;
  return next();
}

module.exports = { validateDecisionBody };
