-- V66: Add form_schema to document types and form_data to consent requests
-- Enables fillable clinical forms (intake form with patient fields)

ALTER TABLE consent_document_types ADD COLUMN form_schema TEXT;
ALTER TABLE consent_requests ADD COLUMN form_data TEXT;

-- Template 1: Consentimiento Informado (read + sign, no form fields)
INSERT INTO consent_document_types (code, title, template, form_schema, active, created_at, updated_at)
VALUES (
  'INFORMED_CONSENT',
  'Consentimiento Informado para Tratamiento Psicologico',
  '<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
<h2 style="text-align: center; color: #0f172a; margin-bottom: 0.5em;">CONSENTIMIENTO INFORMADO</h2>
<p style="text-align: center; color: #64748b; margin-top: 0;">Para Tratamiento Psicologico</p>
<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0;" />

<p><strong>Profesional:</strong> {{PSYCHOLOGIST_NAME}}</p>
<p><strong>N.º Colegiado:</strong> {{PSYCHOLOGIST_LICENSE}}</p>
<p><strong>Paciente:</strong> {{PATIENT_NAME}}</p>
<p><strong>Fecha:</strong> {{DATE}}</p>
<p><strong>Lugar:</strong> {{PLACE}}</p>

<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0;" />

<h3>1. Informacion sobre el tratamiento</h3>
<p>El tratamiento psicologico consiste en la aplicacion de tecnicas y procedimientos basados en la evidencia cientifica, con el objetivo de evaluar, comprender y modificar aquellos aspectos del comportamiento, las emociones o los pensamientos que generan malestar o dificultades en la vida cotidiana del paciente.</p>
<p>La duracion y frecuencia de las sesiones se acordara entre el profesional y el paciente, pudiendo variar segun la evolucion del proceso terapeutico.</p>

<h3>2. Confidencialidad</h3>
<p>Toda la informacion compartida durante las sesiones tiene caracter estrictamente confidencial, conforme a lo dispuesto en la Ley Organica 3/2018, de 5 de diciembre, de Proteccion de Datos Personales y garantia de los derechos digitales (LOPDGDD) y el Reglamento (UE) 2016/679 (RGPD).</p>
<p>Solo se podra romper el secreto profesional en los siguientes supuestos legalmente establecidos:</p>
<ul>
<li>Riesgo inminente para la vida del paciente o de terceros.</li>
<li>Requerimiento judicial.</li>
<li>Sospecha de abuso o maltrato a menores o personas vulnerables.</li>
</ul>

<h3>3. Derechos del paciente</h3>
<ul>
<li>Recibir informacion clara y comprensible sobre el tratamiento propuesto.</li>
<li>Realizar preguntas en cualquier momento del proceso.</li>
<li>Revocar este consentimiento y finalizar el tratamiento en cualquier momento, sin que ello suponga consecuencia alguna.</li>
<li>Acceder, rectificar, suprimir y portar sus datos personales conforme a la normativa vigente.</li>
</ul>

<h3>4. Proteccion de datos</h3>
<p>Los datos personales y de salud seran tratados con la maxima confidencialidad. La base legal del tratamiento es el consentimiento explicito del interesado (Art. 9.2.a RGPD). Los datos se conservaran durante el tiempo necesario para cumplir con la finalidad del tratamiento y las obligaciones legales aplicables.</p>

<h3>5. Naturaleza voluntaria</h3>
<p>La participacion en el tratamiento psicologico es completamente voluntaria. El paciente puede interrumpir el proceso en cualquier momento comunicandolo al profesional.</p>

<h3>6. Politica de cancelacion</h3>
<p>Se ruega comunicar las cancelaciones de citas con un minimo de 24 horas de antelacion. Las cancelaciones con menor preaviso podran ser facturadas.</p>

<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0;" />
<p style="color: #64748b; font-size: 0.9em;">Al firmar este documento, declaro que he sido informado/a de todo lo anterior y que consiento voluntariamente iniciar el tratamiento psicologico.</p>
</div>',
  NULL,
  true,
  NOW(),
  NOW()
);

-- Template 2: Recogida de Datos Personales (with fillable form fields)
INSERT INTO consent_document_types (code, title, template, form_schema, active, created_at, updated_at)
VALUES (
  'INTAKE_FORM',
  'Formulario de Recogida de Datos Personales',
  '<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
<h2 style="text-align: center; color: #0f172a; margin-bottom: 0.5em;">FORMULARIO DE RECOGIDA DE DATOS PERSONALES</h2>
<p style="text-align: center; color: #64748b; margin-top: 0;">Datos necesarios para la prestacion del servicio</p>
<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0;" />

<p><strong>Profesional:</strong> {{PSYCHOLOGIST_NAME}}</p>
<p><strong>N.º Colegiado:</strong> {{PSYCHOLOGIST_LICENSE}}</p>
<p><strong>Fecha:</strong> {{DATE}}</p>

<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0;" />

<h3>Datos del paciente</h3>
<p><strong>Nombre:</strong> {{PATIENT_NAME}}</p>
<p><strong>Email:</strong> {{PATIENT_EMAIL}}</p>
<p><strong>DNI / NIE / Pasaporte:</strong> {{FIELD:dni}}</p>
<p><strong>Direccion:</strong> {{FIELD:address}}</p>
<p><strong>Telefono:</strong> {{FIELD:phone}}</p>

<h3>Contacto de emergencia</h3>
<p><strong>Nombre:</strong> {{FIELD:emergencyContact}}</p>
<p><strong>Telefono:</strong> {{FIELD:emergencyPhone}}</p>

<h3>Informacion clinica</h3>
<p><strong>¿Como nos conocio?:</strong> {{FIELD:referralSource}}</p>
<p><strong>Motivo de consulta:</strong></p>
<p>{{FIELD:chiefComplaint}}</p>
<p><strong>Antecedentes medicos relevantes:</strong></p>
<p>{{FIELD:medicalHistory}}</p>
<p><strong>Medicacion actual:</strong></p>
<p>{{FIELD:currentMedication}}</p>
<p><strong>¿Ha acudido anteriormente a terapia?:</strong> {{FIELD:previousTherapy}}</p>
<p><strong>Detalles de terapia anterior:</strong></p>
<p>{{FIELD:previousTherapyDetails}}</p>

<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0;" />

<h3>Proteccion de datos</h3>
<p style="font-size: 0.9em; color: #475569;">De conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Organica 3/2018 (LOPDGDD), le informamos de que sus datos personales y de salud seran tratados con la finalidad de prestar el servicio de asistencia psicologica solicitado. La base legal del tratamiento es el consentimiento explicito del interesado (Art. 9.2.a RGPD). Los datos se conservaran durante el tiempo necesario para la prestacion del servicio y el cumplimiento de obligaciones legales. Puede ejercer sus derechos de acceso, rectificacion, supresion, portabilidad y limitacion del tratamiento dirigiendose a {{PSYCHOLOGIST_EMAIL}}.</p>

<p style="color: #64748b; font-size: 0.9em;">Al firmar este documento, confirmo que los datos proporcionados son correctos y consiento su tratamiento segun lo indicado.</p>
</div>',
  '[{"key":"dni","label":"DNI / NIE / Pasaporte","type":"text","required":true},{"key":"address","label":"Direccion","type":"text","required":false},{"key":"phone","label":"Telefono","type":"text","required":true},{"key":"emergencyContact","label":"Contacto de emergencia (nombre)","type":"text","required":true},{"key":"emergencyPhone","label":"Telefono de emergencia","type":"text","required":true},{"key":"referralSource","label":"¿Como nos conocio?","type":"select","options":["Internet","Recomendacion","Medico de cabecera","Otro"],"required":false},{"key":"chiefComplaint","label":"Motivo de consulta","type":"textarea","required":true},{"key":"medicalHistory","label":"Antecedentes medicos relevantes","type":"textarea","required":false},{"key":"currentMedication","label":"Medicacion actual","type":"textarea","required":false},{"key":"previousTherapy","label":"¿Ha acudido anteriormente a terapia?","type":"select","options":["No","Si"],"required":true},{"key":"previousTherapyDetails","label":"Detalles de terapia anterior","type":"textarea","required":false,"showIf":"previousTherapy=Si"},{"key":"gdprConsent","label":"Acepto el tratamiento de mis datos personales segun la politica de privacidad","type":"checkbox","required":true}]',
  true,
  NOW(),
  NOW()
);
