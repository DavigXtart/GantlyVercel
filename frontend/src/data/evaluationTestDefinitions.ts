/**
 * Standardized clinical instrument definitions for EvaluationTests.
 *
 * EvaluationTestEntity in the DB stores only metadata (title, code, category, topic).
 * Questions/answers for validated clinical scales are defined here because they are
 * globally standardized instruments with fixed item sets.
 *
 * To add a new instrument, add an entry keyed by its `code` (must match the DB code).
 */

export interface EvalQuestion {
  text: string;
  options: { text: string; value: number }[];
}

export interface ScoringLevel {
  min: number;
  max: number;
  level: string;
  label: string;
  description: string;
  color: string; // tailwind color token
}

export interface EvaluationTestDefinition {
  code: string;
  instructions: string;
  timeframe: string;
  questions: EvalQuestion[];
  scoringLevels: ScoringLevel[];
  maxScore: number;
}

// Standard Likert options used across most clinical scales
const LIKERT_4 = [
  { text: 'Nunca', value: 0 },
  { text: 'Varios días', value: 1 },
  { text: 'Más de la mitad de los días', value: 2 },
  { text: 'Casi todos los días', value: 3 },
];

const LIKERT_5_STRESS = [
  { text: 'Nunca', value: 0 },
  { text: 'Casi nunca', value: 1 },
  { text: 'A veces', value: 2 },
  { text: 'Bastante a menudo', value: 3 },
  { text: 'Muy a menudo', value: 4 },
];

// Reverse-scored version for PSS items 4, 5, 7, 8
const LIKERT_5_STRESS_REVERSE = [
  { text: 'Nunca', value: 4 },
  { text: 'Casi nunca', value: 3 },
  { text: 'A veces', value: 2 },
  { text: 'Bastante a menudo', value: 1 },
  { text: 'Muy a menudo', value: 0 },
];

const LIKERT_4_ROSENBERG = [
  { text: 'Muy en desacuerdo', value: 1 },
  { text: 'En desacuerdo', value: 2 },
  { text: 'De acuerdo', value: 3 },
  { text: 'Muy de acuerdo', value: 4 },
];

const LIKERT_4_ROSENBERG_REVERSE = [
  { text: 'Muy en desacuerdo', value: 4 },
  { text: 'En desacuerdo', value: 3 },
  { text: 'De acuerdo', value: 2 },
  { text: 'Muy de acuerdo', value: 1 },
];

export const evaluationTestDefinitions: Record<string, EvaluationTestDefinition> = {
  // ─── GAD-7: Generalized Anxiety Disorder ──────────────────────────
  GAD7: {
    code: 'GAD7',
    instructions: 'Indica con qué frecuencia te han molestado los siguientes problemas.',
    timeframe: 'Durante las últimas 2 semanas',
    maxScore: 21,
    questions: [
      { text: 'Sentirse nervioso/a, ansioso/a o con los nervios de punta', options: LIKERT_4 },
      { text: 'No ser capaz de parar o controlar sus preocupaciones', options: LIKERT_4 },
      { text: 'Preocuparse demasiado por diferentes cosas', options: LIKERT_4 },
      { text: 'Dificultad para relajarse', options: LIKERT_4 },
      { text: 'Estar tan inquieto/a que es difícil permanecer sentado/a', options: LIKERT_4 },
      { text: 'Molestarse o irritarse fácilmente', options: LIKERT_4 },
      { text: 'Sentir miedo como si algo terrible pudiera pasar', options: LIKERT_4 },
    ],
    scoringLevels: [
      { min: 0, max: 4, level: 'MINIMA', label: 'Mínima', description: 'Ansiedad mínima. No se requiere intervención.', color: 'emerald' },
      { min: 5, max: 9, level: 'LEVE', label: 'Leve', description: 'Ansiedad leve. Monitoreo recomendado.', color: 'amber' },
      { min: 10, max: 14, level: 'MODERADA', label: 'Moderada', description: 'Ansiedad moderada. Se recomienda valoración clínica.', color: 'orange' },
      { min: 15, max: 21, level: 'SEVERA', label: 'Severa', description: 'Ansiedad severa. Se recomienda intervención profesional.', color: 'red' },
    ],
  },

  // ─── PHQ-9: Patient Health Questionnaire (Depression) ─────────────
  PHQ9: {
    code: 'PHQ9',
    instructions: 'Indica con qué frecuencia te han molestado los siguientes problemas.',
    timeframe: 'Durante las últimas 2 semanas',
    maxScore: 27,
    questions: [
      { text: 'Poco interés o placer en hacer cosas', options: LIKERT_4 },
      { text: 'Sentirse decaído/a, deprimido/a o sin esperanza', options: LIKERT_4 },
      { text: 'Dificultad para dormir, mantenerse dormido/a o dormir demasiado', options: LIKERT_4 },
      { text: 'Sentirse cansado/a o con poca energía', options: LIKERT_4 },
      { text: 'Poco apetito o comer en exceso', options: LIKERT_4 },
      { text: 'Sentirse mal consigo mismo/a, o sentir que es un fracaso o que ha decepcionado a su familia', options: LIKERT_4 },
      { text: 'Dificultad para concentrarse en cosas como leer el periódico o ver la televisión', options: LIKERT_4 },
      { text: 'Moverse o hablar tan lento que otras personas lo han notado, o lo contrario, estar tan inquieto/a que se mueve mucho más de lo normal', options: LIKERT_4 },
      { text: 'Pensamientos de que estaría mejor muerto/a o de hacerse daño de alguna forma', options: LIKERT_4 },
    ],
    scoringLevels: [
      { min: 0, max: 4, level: 'MINIMA', label: 'Mínima', description: 'Depresión mínima. No se requiere tratamiento.', color: 'emerald' },
      { min: 5, max: 9, level: 'LEVE', label: 'Leve', description: 'Depresión leve. Se recomienda seguimiento.', color: 'amber' },
      { min: 10, max: 14, level: 'MODERADA', label: 'Moderada', description: 'Depresión moderada. Se recomienda plan de tratamiento.', color: 'orange' },
      { min: 15, max: 19, level: 'MODERADA_SEVERA', label: 'Moderadamente severa', description: 'Depresión moderadamente severa. Tratamiento activo recomendado.', color: 'red' },
      { min: 20, max: 27, level: 'SEVERA', label: 'Severa', description: 'Depresión severa. Tratamiento inmediato necesario.', color: 'red' },
    ],
  },

  // ─── PSS-10: Perceived Stress Scale ───────────────────────────────
  PSS10: {
    code: 'PSS10',
    instructions: 'Las preguntas en esta escala son sobre tus sentimientos y pensamientos durante el último mes.',
    timeframe: 'Durante el último mes',
    maxScore: 40,
    questions: [
      { text: '¿Con qué frecuencia te ha molestado algo que ocurrió inesperadamente?', options: LIKERT_5_STRESS },
      { text: '¿Con qué frecuencia has sentido que eras incapaz de controlar las cosas importantes de tu vida?', options: LIKERT_5_STRESS },
      { text: '¿Con qué frecuencia te has sentido nervioso/a o estresado/a?', options: LIKERT_5_STRESS },
      { text: '¿Con qué frecuencia has manejado con éxito los pequeños problemas irritantes de la vida?', options: LIKERT_5_STRESS_REVERSE },
      { text: '¿Con qué frecuencia has sentido que afrontabas efectivamente los cambios importantes que estaban ocurriendo en tu vida?', options: LIKERT_5_STRESS_REVERSE },
      { text: '¿Con qué frecuencia has estado seguro/a sobre tu capacidad para manejar tus problemas personales?', options: LIKERT_5_STRESS_REVERSE },
      { text: '¿Con qué frecuencia has sentido que las cosas te iban bien?', options: LIKERT_5_STRESS_REVERSE },
      { text: '¿Con qué frecuencia has sentido que no podías afrontar todas las cosas que tenías que hacer?', options: LIKERT_5_STRESS },
      { text: '¿Con qué frecuencia has podido controlar las dificultades de tu vida?', options: LIKERT_5_STRESS_REVERSE },
      { text: '¿Con qué frecuencia has sentido que tenías todo bajo control?', options: LIKERT_5_STRESS_REVERSE },
    ],
    scoringLevels: [
      { min: 0, max: 13, level: 'BAJO', label: 'Bajo', description: 'Nivel de estrés bajo.', color: 'emerald' },
      { min: 14, max: 26, level: 'MODERADO', label: 'Moderado', description: 'Nivel de estrés moderado. Considera técnicas de manejo.', color: 'amber' },
      { min: 27, max: 40, level: 'ALTO', label: 'Alto', description: 'Nivel de estrés alto. Se recomienda apoyo profesional.', color: 'red' },
    ],
  },

  // ─── Rosenberg Self-Esteem Scale ──────────────────────────────────
  ROSENBERG: {
    code: 'ROSENBERG',
    instructions: 'Indica en qué medida estás de acuerdo con las siguientes afirmaciones.',
    timeframe: 'En general',
    maxScore: 40,
    questions: [
      { text: 'Siento que soy una persona digna de aprecio, al menos en igual medida que los demás', options: LIKERT_4_ROSENBERG },
      { text: 'Creo que tengo un buen número de cualidades', options: LIKERT_4_ROSENBERG },
      { text: 'En general, me inclino a pensar que soy un/a fracasado/a', options: LIKERT_4_ROSENBERG_REVERSE },
      { text: 'Soy capaz de hacer las cosas tan bien como la mayoría de la gente', options: LIKERT_4_ROSENBERG },
      { text: 'Siento que no tengo mucho de lo que estar orgulloso/a', options: LIKERT_4_ROSENBERG_REVERSE },
      { text: 'Tengo una actitud positiva hacia mí mismo/a', options: LIKERT_4_ROSENBERG },
      { text: 'En general, estoy satisfecho/a conmigo mismo/a', options: LIKERT_4_ROSENBERG },
      { text: 'Desearía valorarme más a mí mismo/a', options: LIKERT_4_ROSENBERG_REVERSE },
      { text: 'A veces me siento verdaderamente inútil', options: LIKERT_4_ROSENBERG_REVERSE },
      { text: 'A veces pienso que no soy bueno/a para nada', options: LIKERT_4_ROSENBERG_REVERSE },
    ],
    scoringLevels: [
      { min: 10, max: 25, level: 'BAJA', label: 'Baja', description: 'Autoestima baja. Se recomienda trabajo terapéutico.', color: 'red' },
      { min: 26, max: 29, level: 'NORMAL', label: 'Normal', description: 'Autoestima dentro del rango normal.', color: 'amber' },
      { min: 30, max: 40, level: 'ALTA', label: 'Alta', description: 'Autoestima alta. Buen indicador de bienestar.', color: 'emerald' },
    ],
  },
};

/**
 * Check if a test code has a frontend definition available.
 */
export function hasTestDefinition(code: string): boolean {
  return code in evaluationTestDefinitions;
}

/**
 * Get the definition for a test code, or null if not available.
 */
export function getTestDefinition(code: string): EvaluationTestDefinition | null {
  return evaluationTestDefinitions[code] || null;
}

/**
 * Calculate score and determine level for a set of answers.
 */
export function calculateResult(
  definition: EvaluationTestDefinition,
  answers: number[],
): { score: number; level: ScoringLevel } {
  const score = answers.reduce((sum, val) => sum + val, 0);
  const level = definition.scoringLevels.find(l => score >= l.min && score <= l.max)
    || definition.scoringLevels[definition.scoringLevels.length - 1];
  return { score, level };
}
