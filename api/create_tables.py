from app import app, db
from sqlalchemy import text

with app.app_context():
    try:
        with db.engine.connect() as conn:
            conn.execute(text('CREATE SCHEMA IF NOT EXISTS hosp'))
            conn.commit()
        db.create_all()
        print('hosp schema 和所有資料表建立成功')
    except Exception as e:
        print(f'建立失敗: {e}')
