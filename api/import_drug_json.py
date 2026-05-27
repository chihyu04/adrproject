import json
import psycopg2

JSON_PATH = "drug_adverse.json"

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="mimic",
    user="postgres",
    password="123456"
)

cur = conn.cursor()

with open(JSON_PATH, "r", encoding="utf-8") as f:
    drugs = json.load(f)

for drug in drugs:
    drug_code = drug.get("id") or drug.get("drug id")
    drug_name = drug.get("name")
    adverse_reaction = drug.get("adverse reaction") or drug.get("adverse_reaction")
    exception_handling = drug.get("exception handling") or drug.get("exception_handling")

    if not drug_name:
        continue

    cur.execute("""
        INSERT INTO reference.drug_adverse_info
        (drug_code, drug_name, adverse_reaction, exception_handling)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (drug_name)
        DO UPDATE SET
            drug_code = CASE
                WHEN LENGTH(COALESCE(EXCLUDED.adverse_reaction, '')) >
                    LENGTH(COALESCE(reference.drug_adverse_info.adverse_reaction, ''))
                THEN EXCLUDED.drug_code
                ELSE reference.drug_adverse_info.drug_code
            END,

            adverse_reaction = CASE
                WHEN LENGTH(COALESCE(EXCLUDED.adverse_reaction, '')) >
                    LENGTH(COALESCE(reference.drug_adverse_info.adverse_reaction, ''))
                THEN EXCLUDED.adverse_reaction
                ELSE reference.drug_adverse_info.adverse_reaction
            END,

            exception_handling = CASE
                WHEN LENGTH(COALESCE(EXCLUDED.adverse_reaction, '')) >
                    LENGTH(COALESCE(reference.drug_adverse_info.adverse_reaction, ''))
                THEN EXCLUDED.exception_handling
                ELSE reference.drug_adverse_info.exception_handling
            END,

            updated_at = CURRENT_TIMESTAMP
    """, (
        drug_code,
        drug_name,
        adverse_reaction,
        exception_handling
    ))

conn.commit()
cur.close()
conn.close()

print(f"匯入完成，共處理 {len(drugs)} 筆藥物資料")