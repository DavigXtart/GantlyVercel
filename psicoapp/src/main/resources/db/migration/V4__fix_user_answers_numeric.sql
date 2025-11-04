-- Ajuste de tipo para que coincida con Hibernate (Double -> float(53))
ALTER TABLE user_answers 
  MODIFY COLUMN numeric_value DOUBLE NULL;




