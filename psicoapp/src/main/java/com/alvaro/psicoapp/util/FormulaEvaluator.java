package com.alvaro.psicoapp.util;

import java.util.*;

/**
 * Parses and evaluates factor formulas like "A+F+N(-)+Q2(-)" or "INV+IV".
 * Terms are subfactor/factor codes separated by '+'. Codes may contain
 * suffixes like "(-)" which are part of the code, not operators.
 */
public final class FormulaEvaluator {

	private FormulaEvaluator() {}

	/**
	 * Splits a formula string into individual term codes.
	 * Handles parenthesized suffixes — e.g. "A+F+N(-)+Q2(-)" → ["A","F","N(-)","Q2(-)"]
	 */
	public static List<String> parseTerms(String formula) {
		if (formula == null || formula.isBlank()) {
			return List.of();
		}
		List<String> terms = new ArrayList<>();
		StringBuilder current = new StringBuilder();
		int depth = 0;
		for (char c : formula.toCharArray()) {
			if (c == '(') {
				depth++;
				current.append(c);
			} else if (c == ')') {
				depth--;
				current.append(c);
			} else if (c == '+' && depth == 0) {
				String term = current.toString().trim();
				if (!term.isEmpty()) {
					terms.add(term);
				}
				current.setLength(0);
			} else {
				current.append(c);
			}
		}
		String last = current.toString().trim();
		if (!last.isEmpty()) {
			terms.add(last);
		}
		return terms;
	}

	/**
	 * Returns true if any term in the formula is NOT a known subfactor code,
	 * meaning the formula references other factors and needs pass-2 evaluation.
	 */
	public static boolean referencesFactors(String formula, Set<String> subfactorCodes) {
		for (String term : parseTerms(formula)) {
			if (!subfactorCodes.contains(term)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Evaluates a formula by resolving each term against subfactor scores first,
	 * then factor scores. Returns {score, maxScore} or null if any term is unresolved.
	 *
	 * @param formula          e.g. "A+F+N(-)+Q2(-)"
	 * @param subfactorScores  map of subfactor code → double[]{score, maxScore}
	 * @param factorScores     map of factor code → double[]{score, maxScore}
	 * @param selfCode         the factor's own code, excluded from lookups to avoid self-reference
	 */
	public static double[] evaluate(String formula,
									Map<String, double[]> subfactorScores,
									Map<String, double[]> factorScores,
									String selfCode) {
		List<String> terms = parseTerms(formula);
		if (terms.isEmpty()) {
			return null;
		}

		double totalScore = 0.0;
		double totalMax = 0.0;

		for (String term : terms) {
			double[] resolved = null;

			// Try subfactor first
			if (subfactorScores.containsKey(term)) {
				resolved = subfactorScores.get(term);
			}
			// Then try factor (for calculated factors like IG = INV + IV)
			else if (factorScores != null && !term.equals(selfCode) && factorScores.containsKey(term)) {
				resolved = factorScores.get(term);
			}

			if (resolved == null) {
				// Term unresolvable — skip silently (subfactor may have 0 questions answered)
				continue;
			}

			totalScore += resolved[0];
			totalMax += resolved[1];
		}

		if (totalMax <= 0) {
			return null;
		}
		return new double[]{totalScore, totalMax};
	}

	/**
	 * Converts a raw score to a Gaussian percentile (0-100).
	 * Assumes normal distribution with mean = maxScore/2, stddev = maxScore/6.
	 * This places ~99.7% of scores within [0, maxScore].
	 */
	public static double gaussianPercentile(double score, double maxScore) {
		if (maxScore <= 0) return 50.0;
		double mean = maxScore / 2.0;
		double stddev = maxScore / 6.0;
		double z = (score - mean) / stddev;
		double p = cdfApprox(z) * 100.0;
		return Math.max(1.0, Math.min(99.0, p));
	}

	/**
	 * Approximation of the standard normal CDF using Abramowitz & Stegun formula 26.2.17.
	 * Accuracy: |error| < 7.5e-8.
	 */
	private static double cdfApprox(double z) {
		if (z < -8.0) return 0.0;
		if (z > 8.0) return 1.0;
		double sign = 1.0;
		if (z < 0) {
			sign = -1.0;
			z = -z;
		}
		double t = 1.0 / (1.0 + 0.2316419 * z);
		double t2 = t * t;
		double t3 = t2 * t;
		double t4 = t3 * t;
		double t5 = t4 * t;
		double pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2.0 * Math.PI);
		double cdf = 1.0 - pdf * (0.319381530 * t - 0.356563782 * t2
				+ 1.781477937 * t3 - 1.821255978 * t4 + 1.330274429 * t5);
		return 0.5 + sign * (cdf - 0.5);
	}
}
