import psycopg2
import sys

dsn = 'postgresql://postgres:yen10172@localhost:5432/postgres'
try:
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    cur.execute('SELECT 1')
    print('DB connection OK')
    cur.close()
    conn.close()
except Exception as e:
    print('DB connection failed:', e)
    sys.exit(1)
