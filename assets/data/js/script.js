document.addEventListener('DOMContentLoaded', () => {
  const quizForm = document.getElementById('quizForm');
  const resultEl = document.getElementById('result');

  if (!quizForm || !resultEl) {
    console.error("❌ quizForm or result element not found in the DOM.");
    return;
  }

  // Helper: checks if all user features are included in recommended features
  function featuresMatch(userFeatures, recFeatures) {
    return userFeatures.every(f => recFeatures.includes(f));
  }

  // Helper: score a recommendation based on how many fields match
  function scoreRecommendation(rec, user) {
    let score = 0;
    if (rec.use_case === user.use_case) score += 10;
    if (rec.experience === user.experience) score += 8;
    if (budgetOverlap(rec.budget, user.budget)) score += 6;
    if (sizeOverlap(rec.size, user.size)) score += 5;
    if (featuresMatch(user.features, rec.features)) score += 7;
    if (rec.priority === user.priority) score += 4;
    if (rec.maintenance === user.maintenance) score += 3;
    return score;
  }

  // Example: simple budget overlap logic
  function budgetOverlap(budgetA, budgetB) {
    const map = {
      "<$300": [0, 299],
      "$300–$600": [300, 600],
      "$600–$1200": [600, 1200],
      "$1200+": [1200, Infinity]
    };
    const [minA, maxA] = map[budgetA] || [0, Infinity];
    const [minB, maxB] = map[budgetB] || [0, Infinity];
    return !(maxA < minB || maxB < minA);
  }

  // Example: simple size overlap logic
  function sizeOverlap(sizeA, sizeB) {
    const map = {
      "Small (<150mm)": 1,
      "Medium (150–250mm)": 2,
      "Large (>250mm)": 3
    };
    const valA = map[sizeA];
    const valB = map[sizeB];
    if (valA === undefined || valB === undefined) return false;
    return Math.abs(valA - valB) <= 1;
  }

  quizForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.target;
    const user = {
      use_case: form.use_case.value,
      experience: form.experience.value,
      budget: form.budget.value,
      size: form.size.value,
      features: Array.from(form.querySelectorAll('input[name="features"]:checked')).map(cb => cb.value),
      priority: form.priority.value,
      maintenance: form.maintenance.value
    };

    resultEl.innerHTML = "🔍 Finding your recommendation. Please wait...";

    try {
      const response = await fetch('assets/data/recommendations.json');
      if (!response.ok) throw new Error(`Failed to load recommendations.json (${response.status})`);
      const recommendations = await response.json();

      const scoredRecs = recommendations.map(rec => ({
        rec,
        score: scoreRecommendation(rec, user)
      }));

      // Find highest scored recommendation
      const best = scoredRecs.reduce((prev, current) => (current.score > prev.score ? current : prev), {score:0});

      if (best.score > 0) {
        resultEl.innerHTML = best.rec.recommendation;
      } else {
        resultEl.innerHTML = "❌ Sorry, we don't have a recommendation for this combination yet.";
      }
    } catch (error) {
      console.error("❌ Error:", error);
      resultEl.innerHTML = "❌ There was an error finding your recommendation. Please try again later.";
    }
  });
});



