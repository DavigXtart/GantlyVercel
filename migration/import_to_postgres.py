"""
Import MySQL TSV exports into PostgreSQL via Docker.
Handles: column reordering, BIT(1)->boolean, NULL, string escaping, sequences.
"""
import os
import subprocess
import sys

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PG_CONTAINER = "gantly-postgres"
PG_USER = "postgres"
PG_DB = "gantly"

# Tables in FK dependency order (parents first)
TABLES_ORDER = [
    "users",
    "companies",
    "psychologist_profiles",
    "tests",
    "factors",
    "subfactors",
    "questions",
    "answers",
    "evaluation_tests",
    "appointments",
    "appointment_ratings",
    "appointment_requests",
    "assigned_tests",
    "chat_conversations",
    "chat_messages",
    "clinic_invitations",
    "clinic_chat_messages",
    "clinic_patient_documents",
    "clinic_patient_profiles",
    "clinic_rooms",
    "clinic_services",
    "consent_document_types",
    "consent_requests",
    "daily_mood_entries",
    "evaluation_test_results",
    "factor_results",
    "notifications",
    "tasks",
    "task_comments",
    "task_files",
    "temporary_sessions",
    "test_results",
    "user_answers",
    "user_psychologist",
    "user_subscriptions",
]

BIT_TYPES = {"bit", "tinyint"}
NUMERIC_TYPES = {"bigint", "int", "smallint", "decimal", "double", "float", "integer"}
DATE_TYPES = {"timestamp", "datetime", "date"}


def pg_sql(sql: str) -> str:
    """Execute SQL in PostgreSQL container via stdin."""
    result = subprocess.run(
        ["docker", "exec", "-i", PG_CONTAINER, "psql", "-U", PG_USER, "-d", PG_DB, "-v", "ON_ERROR_STOP=1"],
        input=sql, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if result.returncode != 0:
        err = (result.stderr or "").strip()
        if err:
            print(f"    PG ERROR: {err[:200]}")
    return result.stdout or ""


def escape_val(val: str, col_type: str) -> str:
    """Convert a MySQL TSV field to a PostgreSQL SQL literal."""
    # NULL
    if val == "\\N" or val == "NULL":
        return "NULL"

    # BIT(1) / TINYINT(1) -> boolean
    if col_type in BIT_TYPES:
        # MySQL binary export: 0x01 = true, 0x00 = false
        if len(val) == 1 and ord(val[0]) <= 1:
            return "TRUE" if ord(val[0]) == 1 else "FALSE"
        if val in ("1", "true", "TRUE", "b'1'"):
            return "TRUE"
        if val in ("0", "false", "FALSE", "b'0'", ""):
            return "FALSE"
        try:
            return "TRUE" if int(val) != 0 else "FALSE"
        except ValueError:
            return "FALSE"

    # Numeric
    if col_type in NUMERIC_TYPES:
        if val == "" or val.strip() == "":
            return "NULL"
        return val

    # Date/timestamp
    if col_type in DATE_TYPES:
        if val == "" or val == "0000-00-00 00:00:00":
            return "NULL"
        # PostgreSQL accepts ISO format directly
        escaped = val.replace("'", "''")
        return f"'{escaped}'"

    # String: escape single quotes, handle backslash escapes
    escaped = val.replace("\\\\", "\x00BACKSLASH\x00")  # temp placeholder
    escaped = escaped.replace("\\n", "\n")
    escaped = escaped.replace("\\r", "\r")
    escaped = escaped.replace("\\t", "\t")
    escaped = escaped.replace("\\0", "")
    escaped = escaped.replace("\x00BACKSLASH\x00", "\\")
    escaped = escaped.replace("'", "''")

    # Use E'' syntax only if we have special chars
    if "\n" in escaped or "\r" in escaped or "\t" in escaped or "\\" in escaped:
        escaped = escaped.replace("\\", "\\\\")
        escaped = escaped.replace("\n", "\\n")
        escaped = escaped.replace("\r", "\\r")
        escaped = escaped.replace("\t", "\\t")
        return f"E'{escaped}'"

    return f"'{escaped}'"


def import_table(table: str) -> int:
    """Import a single table. Returns row count."""
    tsv_path = os.path.join(DATA_DIR, f"{table}.tsv")
    cols_path = os.path.join(DATA_DIR, f"{table}.columns")
    types_path = os.path.join(DATA_DIR, f"{table}.types")

    if not os.path.exists(tsv_path):
        return 0

    file_size = os.path.getsize(tsv_path)
    if file_size == 0:
        return 0

    # Read column names and types from MySQL
    with open(cols_path, "r", encoding="utf-8") as f:
        columns = f.read().strip().split(",")
    with open(types_path, "r", encoding="utf-8") as f:
        types = f.read().strip().split(",")

    # Read data
    with open(tsv_path, "r", encoding="utf-8", errors="replace") as f:
        lines = f.readlines()

    if not lines:
        return 0

    # Build column list (quoted for PostgreSQL)
    col_list = ", ".join(f'"{c}"' for c in columns)

    # Process in batches
    batch_size = 50
    total = 0

    for batch_start in range(0, len(lines), batch_size):
        batch = lines[batch_start:batch_start + batch_size]
        values_parts = []

        for line in batch:
            line = line.rstrip("\n").rstrip("\r")
            if not line:
                continue

            # Split by tab
            fields = line.split("\t")

            # Handle field count mismatch
            if len(fields) > len(columns):
                # Merge extra fields into last column (text fields with tabs)
                merged = "\t".join(fields[len(columns) - 1:])
                fields = fields[:len(columns) - 1] + [merged]
            elif len(fields) < len(columns):
                fields.extend(["\\N"] * (len(columns) - len(fields)))

            vals = []
            for val, ctype in zip(fields, types):
                vals.append(escape_val(val, ctype))

            values_parts.append(f"  ({', '.join(vals)})")

        if values_parts:
            sql = f"SET session_replication_role = 'replica';\nINSERT INTO \"{table}\" ({col_list}) VALUES\n"
            sql += ",\n".join(values_parts) + ";\n"
            result = pg_sql(sql)
            total += len(values_parts)

    return total


def reset_sequence(table: str):
    """Reset identity sequence after data import."""
    sql = f"""
    DO $$
    DECLARE
        max_val BIGINT;
        seq_name TEXT;
    BEGIN
        -- Find the sequence for the 'id' column
        SELECT pg_get_serial_sequence('{table}', 'id') INTO seq_name;
        IF seq_name IS NOT NULL THEN
            EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM {table}') INTO max_val;
            IF max_val > 0 THEN
                PERFORM setval(seq_name, max_val);
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END $$;
    """
    pg_sql(sql)


def main():
    print("=" * 60)
    print("  MySQL -> PostgreSQL Data Migration")
    print("=" * 60)

    # Verify PostgreSQL connection
    out = pg_sql("SELECT 1 AS ok;")
    if "1" not in out:
        print("ERROR: Cannot connect to PostgreSQL container")
        sys.exit(1)
    print("PostgreSQL connection OK\n")

    # Get existing tables
    out = pg_sql("SELECT tablename FROM pg_tables WHERE schemaname='public';")
    existing = set()
    for line in out.split("\n"):
        t = line.strip()
        if t and t != "tablename" and not t.startswith("-") and "rows)" not in t:
            existing.add(t)

    print(f"Tables in PostgreSQL: {len(existing)}\n")

    # Disable FK checks for import
    pg_sql("SET session_replication_role = 'replica';")

    results = []

    for table in TABLES_ORDER:
        if table not in existing:
            continue
        tsv_path = os.path.join(DATA_DIR, f"{table}.tsv")
        if not os.path.exists(tsv_path) or os.path.getsize(tsv_path) == 0:
            continue

        print(f"  {table}...", end=" ", flush=True)

        # Clear existing data (disable FK checks in same session)
        pg_sql(f"SET session_replication_role = 'replica';\nTRUNCATE \"{table}\" CASCADE;")

        count = import_table(table)
        print(f"{count} rows")
        results.append((table, count))

        # Reset sequence
        reset_sequence(table)

    # Re-enable FK checks
    pg_sql("SET session_replication_role = 'origin';")

    print()
    print("=" * 60)
    print(f"  Imported {len(results)} tables")
    print("=" * 60)

    # Verify
    print("\nVerification:")
    all_ok = True
    for table, mysql_count in results:
        out = pg_sql(f"SELECT COUNT(*) FROM \"{table}\";")
        pg_lines = [l.strip() for l in out.split("\n") if l.strip() and l.strip().isdigit()]
        pg_count = int(pg_lines[0]) if pg_lines else 0
        ok = "OK" if pg_count == mysql_count else "MISMATCH"
        if ok != "OK":
            all_ok = False
        print(f"  {table}: exported={mysql_count} imported={pg_count} [{ok}]")

    if all_ok:
        print("\n  ALL TABLES OK!")
    else:
        print("\n  SOME MISMATCHES - check above")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
