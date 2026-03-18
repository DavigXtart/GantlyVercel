package com.alvaro.psicoapp.dto;

import java.util.List;

public class TestImportDtos {

	public record ParseResult(
		String detectedTitle,
		int questionCount,
		List<ParsedQuestion> questions
	) {}

	public record ParsedQuestion(
		int position,
		String text,
		List<ParsedAnswer> answers
	) {}

	public record ParsedAnswer(
		String text,
		Integer value,
		int position
	) {}

	public static class ImportRequest {
		public String code;
		public String title;
		public String description;
		/** Tipo de test: "generic", "tcp", "tca", "ansiedad" */
		public String testType;
		public List<ParsedQuestion> questions;
	}

	public record ImportResponse(
		Long testId,
		String code,
		int questionsCreated,
		int answersCreated
	) {}
}
