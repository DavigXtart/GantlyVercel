#!/bin/bash
# Export MySQL data to PostgreSQL-compatible SQL inserts
# Usage: bash export_mysql.sh

MYSQL="/c/Program Files/MySQL/MySQL Server 8.4/bin/mysql"
DB="gantly"
USER="root"
PASS="1234"
OUTDIR="/c/Users/david/Desktop/alvaro/migration/data"

mkdir -p "$OUTDIR"

# Tables to export (order matters for foreign keys - parents first)
TABLES=(
  users
  companies
  psychologist_profiles
  tests
  factors
  subfactors
  questions
  answers
  evaluation_tests
  appointments
  appointment_ratings
  appointment_requests
  assigned_tests
  chat_conversations
  chat_messages
  clinic_invitations
  clinic_chat_messages
  clinic_patient_documents
  clinic_patient_profiles
  clinic_rooms
  clinic_services
  consent_document_types
  consent_requests
  daily_mood_entries
  evaluation_test_results
  factor_results
  notifications
  task_comments
  task_files
  tasks
  temporary_sessions
  test_results
  user_answers
  user_psychologist
  user_subscriptions
)

for TABLE in "${TABLES[@]}"; do
  echo "Exporting $TABLE..."

  # Get row count
  COUNT=$("$MYSQL" -u "$USER" -p"$PASS" "$DB" -N -e "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null)

  if [ "$COUNT" = "0" ] || [ -z "$COUNT" ]; then
    echo "  -> 0 rows, skipping"
    continue
  fi

  echo "  -> $COUNT rows"

  # Export as tab-separated with headers, NULL as \N (force UTF-8)
  "$MYSQL" -u "$USER" -p"$PASS" --default-character-set=utf8mb4 "$DB" -N --batch -e "SELECT * FROM $TABLE;" 2>/dev/null > "$OUTDIR/$TABLE.tsv"

  # Get column names
  "$MYSQL" -u "$USER" -p"$PASS" --default-character-set=utf8mb4 "$DB" -N -e "
    SELECT GROUP_CONCAT(COLUMN_NAME ORDER BY ORDINAL_POSITION SEPARATOR ',')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$TABLE';" 2>/dev/null > "$OUTDIR/$TABLE.columns"

  # Get column types for type mapping
  "$MYSQL" -u "$USER" -p"$PASS" --default-character-set=utf8mb4 "$DB" -N -e "
    SELECT GROUP_CONCAT(DATA_TYPE ORDER BY ORDINAL_POSITION SEPARATOR ',')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='$TABLE';" 2>/dev/null > "$OUTDIR/$TABLE.types"
done

echo ""
echo "Export complete! Files in $OUTDIR"
ls -la "$OUTDIR"/*.tsv 2>/dev/null | wc -l
echo "tables exported"
