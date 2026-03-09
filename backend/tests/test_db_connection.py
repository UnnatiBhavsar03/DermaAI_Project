
import sys
import os
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus

# Attempt 1: As configured in .env (URL encoded)
try:
    password = "Unnati@03"
    encoded_password = quote_plus(password)
    uri = f"mysql+pymysql://root:{encoded_password}@localhost/derma_ai_db"
    print(f"Attempting connection with URI: {uri.replace(encoded_password, '***')}")
    engine = create_engine(uri)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("SUCCESS! Connected with configured password.")
        sys.exit(0)
except Exception as e:
    print(f"FAILED: {e}")

# Attempt 2: Local Socket (common on macOS)
try:
    print("\nAttempting connection via Unix Socket (/tmp/mysql.sock)...")
    uri = f"mysql+pymysql://root:{encoded_password}@localhost/derma_ai_db?unix_socket=/tmp/mysql.sock"
    engine = create_engine(uri)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("SUCCESS! Connected via Socket.")
        sys.exit(0)
except Exception as e:
    print(f"FAILED: {e}")

# Attempt 3: No Password
try:
    print("\nAttempting connection with NO password...")
    uri = "mysql+pymysql://root:@localhost/derma_ai_db"
    engine = create_engine(uri)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("SUCCESS! Connected with NO password.")
        sys.exit(0)
except Exception as e:
    print(f"FAILED: {e}")
