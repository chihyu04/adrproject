#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试 Flask 是否能正常运行"""

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def test():
    return {'status': 'OK', 'message': 'Flask 运行正常！'}

if __name__ == '__main__':
    print("=" * 50)
    print("测试 Flask 服务器...")
    print("=" * 50)
    try:
        app.run(host='127.0.0.1', port=5000, debug=True)
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()

