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
}
