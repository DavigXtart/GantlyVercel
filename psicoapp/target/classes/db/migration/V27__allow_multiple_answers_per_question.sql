-- V27: Permitir múltiples respuestas por pregunta para preguntas MULTIPLE
-- Eliminar la restricción UNIQUE que impedía múltiples respuestas para la misma pregunta

-- En MySQL, cuando tienes UNIQUE (user_id, question_id) y también claves foráneas,
-- MySQL puede usar el índice único compuesto para satisfacer las necesidades de las
-- claves foráneas. Por lo tanto, no podemos simplemente eliminar el índice.
--
-- Solución: 
-- 1. Crear un índice separado en user_id para la clave foránea (si no existe)
-- 2. Luego eliminar el índice único compuesto (user_id, question_id)

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS drop_unique_composite_index_v27()
BEGIN
    DECLARE idx_exists INT DEFAULT 0;
    DECLARE composite_idx_name VARCHAR(64) DEFAULT NULL;
    
    -- Paso 1: Verificar si ya existe un índice solo en user_id (no compuesto)
    SELECT COUNT(*) INTO idx_exists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'user_answers'
    AND INDEX_NAME != 'PRIMARY'
    AND COLUMN_NAME = 'user_id'
    AND SEQ_IN_INDEX = 1
    AND (
        SELECT COUNT(DISTINCT SEQ_IN_INDEX)
        FROM INFORMATION_SCHEMA.STATISTICS s2
        WHERE s2.TABLE_SCHEMA = INFORMATION_SCHEMA.STATISTICS.TABLE_SCHEMA
        AND s2.TABLE_NAME = INFORMATION_SCHEMA.STATISTICS.TABLE_NAME
        AND s2.INDEX_NAME = INFORMATION_SCHEMA.STATISTICS.INDEX_NAME
    ) = 1;
    
    -- Si no existe un índice simple en user_id, crearlo
    IF idx_exists = 0 THEN
        CREATE INDEX idx_user_answers_user_id_fk ON user_answers(user_id);
    END IF;
    
    -- Paso 2: Buscar el índice único compuesto (user_id, question_id)
    SELECT DISTINCT s1.INDEX_NAME INTO composite_idx_name
    FROM INFORMATION_SCHEMA.STATISTICS s1
    INNER JOIN INFORMATION_SCHEMA.STATISTICS s2
        ON s1.TABLE_SCHEMA = s2.TABLE_SCHEMA
        AND s1.TABLE_NAME = s2.TABLE_NAME
        AND s1.INDEX_NAME = s2.INDEX_NAME
    WHERE s1.TABLE_SCHEMA = DATABASE()
    AND s1.TABLE_NAME = 'user_answers'
    AND s1.INDEX_NAME != 'PRIMARY'
    AND s1.INDEX_NAME != 'idx_user_answers_user_id_fk'
    AND s1.NON_UNIQUE = 0
    AND s1.COLUMN_NAME = 'user_id'
    AND s1.SEQ_IN_INDEX = 1
    AND s2.COLUMN_NAME = 'question_id'
    AND s2.SEQ_IN_INDEX = 2
    AND (
        SELECT COUNT(DISTINCT SEQ_IN_INDEX)
        FROM INFORMATION_SCHEMA.STATISTICS s3
        WHERE s3.TABLE_SCHEMA = s1.TABLE_SCHEMA
        AND s3.TABLE_NAME = s1.TABLE_NAME
        AND s3.INDEX_NAME = s1.INDEX_NAME
    ) = 2
    LIMIT 1;
    
    -- Si encontramos el índice único compuesto, eliminarlo
    IF composite_idx_name IS NOT NULL THEN
        SET @sql = CONCAT('ALTER TABLE user_answers DROP INDEX `', composite_idx_name, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

-- Ejecutar el procedimiento
CALL drop_unique_composite_index_v27();

-- Eliminar el procedimiento temporal
DROP PROCEDURE IF EXISTS drop_unique_composite_index_v27;
