import sys
import os

# Add root directory to sys.path so backend modules can be resolved by Vercel's serverless runtime
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from main import app

# Vercel's Python runtime detects 'app' or 'handler' as the ASGI application entry point
handler = app
