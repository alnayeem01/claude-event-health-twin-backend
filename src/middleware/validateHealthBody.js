/**
 * @typedef {object} LifestyleInputs
 * @property {number} age
 * @property {number} height
 * @property {number} weight
 * @property {number} sleep
 * @property {number} stress
 * @property {number} exercise
 * @property {number} screenTime
 * @property {number} diet
 */

const FIELDS = [
  "age",
  "height",
  "weight",
  "sleep",
  "stress",
  "exercise",
  "screenTime",
  "diet",
];

const RANGES = {
  age: { min: 16, max: 80 },
  height: { min: 55, max: 84 },
  weight: { min: 40, max: 150 },
  sleep: { min: 4, max: 12 },
  stress: { min: 0, max: 10 },
  exercise: { min: 0, max: 7 },
  screenTime: { min: 0, max: 12 },
  diet: { min: 1, max: 10 },
};

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function validateHealthBody(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "JSON body required" });
  }

  /** @type {LifestyleInputs} */
  const out = {};

  for (const key of FIELDS) {
    const raw = body[key];
    if (!isFiniteNumber(raw)) {
      return res.status(400).json({ error: `${key} must be a finite number` });
    }
    const { min, max } = RANGES[key];
    if (raw < min || raw > max) {
      return res.status(400).json({
        error: `${key} must be between ${min} and ${max}`,
      });
    }
    out[key] = raw;
  }

  req.validatedLifestyle = out;
  return next();
}

module.exports = { validateHealthBody, FIELDS, RANGES };
