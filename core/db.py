import os
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

DB_PATH = Path(__file__).resolve().parent.parent / "storage" / "scraped_data.db"

# Check for psycopg2 availability
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False


def get_db_type() -> str:
    """Determine if PostgreSQL credentials are set or fallback to SQLite."""
    if HAS_PSYCOPG2 and (os.getenv("DATABASE_URL") or os.getenv("POSTGRES_HOST")):
        return "postgres"
    return "sqlite"


def get_postgres_connection():
    """Return connection to PostgreSQL database."""
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return psycopg2.connect(db_url)
    
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", 5432)),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "postgres"),
        dbname=os.getenv("POSTGRES_DB", "web_scraper_db")
    )


def get_sqlite_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """Return connection to SQLite database."""
    target_path = db_path or DB_PATH
    target_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target_path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[Path] = None) -> None:
    """Initialize database tables for PostgreSQL or SQLite."""
    db_type = get_db_type()
    
    if db_type == "postgres":
        try:
            conn = get_postgres_connection()
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scrape_history (
                    id SERIAL PRIMARY KEY,
                    url TEXT NOT NULL,
                    mode VARCHAR(50) NOT NULL,
                    prompt TEXT,
                    summary TEXT,
                    raw_text TEXT,
                    results_json JSONB,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
            conn.close()
            return
        except Exception as e:
            print(f"[Warning] Failed to connect to PostgreSQL: {e}. Falling back to SQLite.")

    # SQLite fallback
    conn = get_sqlite_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scrape_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT NOT NULL,
            mode TEXT NOT NULL,
            prompt TEXT,
            summary TEXT,
            raw_text TEXT,
            results_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def save_scrape_record(
    url: str,
    mode: str,
    prompt: Optional[str] = None,
    summary: Optional[str] = None,
    raw_text: Optional[str] = None,
    results: Optional[Dict[str, Any]] = None,
    db_path: Optional[Path] = None
) -> int:
    """Insert a new scrape record into PostgreSQL or SQLite."""
    init_db(db_path)
    db_type = get_db_type()
    results_str = json.dumps(results) if results else None
    now_iso = datetime.now().isoformat()

    if db_type == "postgres":
        try:
            conn = get_postgres_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO scrape_history (url, mode, prompt, summary, raw_text, results_json, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (url, mode, prompt, summary, raw_text, results_str, now_iso))
            record_id = cursor.fetchone()[0]
            conn.commit()
            conn.close()
            return record_id
        except Exception as e:
            print(f"[Warning] Failed to save record to PostgreSQL: {e}. Saving to SQLite.")

    # SQLite fallback
    conn = get_sqlite_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO scrape_history (url, mode, prompt, summary, raw_text, results_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (url, mode, prompt, summary, raw_text, results_str, now_iso))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id


def get_recent_scrapes(limit: int = 50, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Retrieve recent scrape history records from PostgreSQL or SQLite."""
    init_db(db_path)
    db_type = get_db_type()

    if db_type == "postgres":
        try:
            conn = get_postgres_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                SELECT id, url, mode, prompt, summary, raw_text, results_json, created_at
                FROM scrape_history
                ORDER BY id DESC
                LIMIT %s;
            """, (limit,))
            rows = cursor.fetchall()
            conn.close()

            records = []
            for r in rows:
                rec = dict(r)
                rec["created_at"] = str(rec["created_at"])
                if rec.get("results_json"):
                    if isinstance(rec["results_json"], dict):
                        rec["results"] = rec["results_json"]
                    else:
                        try:
                            rec["results"] = json.loads(rec["results_json"])
                        except Exception:
                            rec["results"] = {}
                else:
                    rec["results"] = {}
                records.append(rec)
            return records
        except Exception as e:
            print(f"[Warning] Failed to query PostgreSQL: {e}. Reading from SQLite.")

    # SQLite fallback
    conn = get_sqlite_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, url, mode, prompt, summary, raw_text, results_json, created_at
        FROM scrape_history
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    records = []
    for r in rows:
        rec = dict(r)
        if rec.get("results_json"):
            try:
                rec["results"] = json.loads(rec["results_json"])
            except Exception:
                rec["results"] = {}
        else:
            rec["results"] = {}
        records.append(rec)
    return records


def delete_scrape_record(record_id: int, db_path: Optional[Path] = None) -> None:
    """Delete a scrape record by ID from PostgreSQL or SQLite."""
    db_type = get_db_type()
    if db_type == "postgres":
        try:
            conn = get_postgres_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM scrape_history WHERE id = %s;", (record_id,))
            conn.commit()
            conn.close()
            return
        except Exception:
            pass

    conn = get_sqlite_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scrape_history WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
