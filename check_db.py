"""Utility script to verify and inspect database connectivity (Supabase / PostgreSQL / SQLite).

Run with:
    python check_db.py
"""
import sys
from sqlalchemy import text
from config import settings
from database import engine, init_db, _mask_db_url


def test_connection():
    print("=" * 60)
    print(" PlacementPro Database Diagnostics")
    print("=" * 60)
    print(f"Target Database URL: {_mask_db_url(settings.DATABASE_URL)}")

    try:
        with engine.connect() as conn:
            print("\n[OK] Successfully connected to database engine!")

            # Check database dialect and version
            try:
                result = conn.execute(text("SELECT version();")).scalar()
                print(f"[Info] Engine / Server Version:\n       {result}")
            except Exception:
                result = conn.execute(text("SELECT sqlite_version();")).scalar()
                print(f"[Info] SQLite Version: {result}")

            # Check existing tables
            try:
                tables = conn.execute(
                    text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
                ).scalars().all()
            except Exception:
                tables = conn.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
                ).scalars().all()

            print(f"\n[Info] Existing Tables ({len(tables)}):")
            for tbl in tables:
                print(f"  - {tbl}")

            expected_tables = {"users", "student_profiles", "recruiter_profiles", "job_postings", "job_applications"}
            missing = expected_tables - set(tables)

            if missing:
                print(f"\n[Notice] Missing expected tables: {missing}")
                print("[Action] Initializing missing database schemas...")
                init_db()
                print("[OK] All tables successfully created!")
            else:
                print("\n[OK] All expected PlacementPro tables exist.")

            print("\n" + "=" * 60)
            print(" Status: HEALTHY & READY FOR TRAFFIC")
            print("=" * 60)
            return True

    except Exception as exc:
        print(f"\n[ERROR] Connection failed: {exc}")
        print("\nTroubleshooting tips for Supabase:")
        print("1. Did you replace [YOUR-PASSWORD] with your actual Supabase database password?")
        print("2. If your password has special characters like '@', ':', '#', or '%', URL-encode them.")
        print("3. Ensure you are using the Session Pooler (port 5432) or Direct Connection (port 5432).")
        print("4. Verify that '?sslmode=require' is appended to the connection string.")
        print("5. Verify your project is active and not paused in the Supabase Dashboard.")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
