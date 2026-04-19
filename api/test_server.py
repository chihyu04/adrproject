#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试服务器启动"""

import sys
import os

# 添加当前目录到路径
sys.path.insert(0, os.path.dirname(__file__))

try:
    print("正在导入 Flask...")
    from flask import Flask
    print("✓ Flask 导入成功")
    
    print("正在导入 flask_cors...")
    from flask_cors import CORS
    print("✓ flask_cors 导入成功")
    
    print("正在导入 app...")
    import app
    print("✓ app 导入成功")
    
    print("\n" + "="*50)
    print("所有模块导入成功！")
    print("="*50)
    print("\n服务器应该可以正常启动。")
    print("请运行: python app.py")
    
except ImportError as e:
    print(f"✗ 导入错误: {e}")
    print("\n请运行: python -m pip install -r requirements.txt")
    sys.exit(1)
except Exception as e:
    print(f"✗ 错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

