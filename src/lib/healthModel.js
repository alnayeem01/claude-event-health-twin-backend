/**
 * Mirrors claude-health-frontend/src/components/futureself/types.ts computeHealth.
 * @param {import("../middleware/validateHealthBody").LifestyleInputs} i
 */
function computeHealth(i) {
  const heightM = i.height * 0.0254;
  const bmi = i.weight / heightM ** 2;

  const bmiScore =
    bmi >= 18.5 && bmi <= 24.9
      ? 100
      : bmi < 18.5
        ? Math.max(0, 100 - (18.5 - bmi) * 18)
        : Math.max(0, 100 - (bmi - 24.9) * 6);

  const agePenalty = i.age > 40 ? Math.min(15, (i.age - 40) * 0.35) : 0;

  const sleepScore =
    i.sleep >= 7 && i.sleep <= 9
      ? 100
      : Math.max(0, 100 - Math.abs(i.sleep - 8) * 22);
  const stressScore = Math.max(0, 100 - i.stress * 10);
  const exerciseScore = Math.min(100, i.exercise * 14.3);
  const screenScore = Math.max(
    0,
    i.screenTime <= 3 ? 100 : 100 - (i.screenTime - 3) * 11
  );
  const dietScore = Math.min(100, (i.diet / 10) * 100);

  const rawScore =
    sleepScore * 0.22 +
    stressScore * 0.22 +
    exerciseScore * 0.18 +
    screenScore * 0.1 +
    dietScore * 0.14 +
    bmiScore * 0.14;

  const overallScore = Math.round(Math.max(0, rawScore - agePenalty));

  const heartRisk = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        (100 - stressScore) * 0.3 +
          (100 - sleepScore) * 0.22 +
          (100 - exerciseScore) * 0.18 +
          (100 - dietScore) * 0.1 +
          (100 - bmiScore) * 0.2
      )
    )
  );
  const burnoutRisk = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        (100 - stressScore) * 0.5 +
          (100 - sleepScore) * 0.32 +
          (100 - exerciseScore) * 0.12 +
          (100 - screenScore) * 0.06
      )
    )
  );
  const cognitiveRisk = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        (100 - sleepScore) * 0.34 +
          (100 - stressScore) * 0.28 +
          (100 - exerciseScore) * 0.18 +
          (100 - dietScore) * 0.12 +
          (100 - bmiScore) * 0.08
      )
    )
  );

  const projectedAge = Math.round(72 + (overallScore / 100) * 22);
  const highRisk = Math.max(heartRisk, burnoutRisk, cognitiveRisk);
  const confidence =
    overallScore >= 70 || highRisk <= 30
      ? "High"
      : overallScore >= 45
        ? "Medium"
        : "Low";

  return {
    overallScore,
    bmi: Math.round(bmi * 10) / 10,
    heartRisk,
    burnoutRisk,
    cognitiveRisk,
    projectedAge,
    confidence,
  };
}

module.exports = { computeHealth };
