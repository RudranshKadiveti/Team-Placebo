import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

DB_PATH = Path(__file__).resolve().parent.parent / "storage" / "scraped_data.db"


def get_db_connection(db_path: Optional[Path] = None) -> sqlite3.Connection:
    """Return a connection to the SQLite database."""
    target_path = db_path or DB_PATH
    target_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target_path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[Path] = None) -> None:
    """Initialize SQLite database table for storing scrape history."""
    conn = get_db_connection(db_path)
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
    """Insert a new scrape record into the SQLite database."""
    init_db(db_path)
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    results_str = json.dumps(results) if results else None
    
    cursor.execute("""
        INSERT INTO scrape_history (url, mode, prompt, summary, raw_text, results_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        url,
        mode,
        prompt,
        summary,
        raw_text,
        results_str,
        datetime.now().isoformat()
    ))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id


def get_recent_scrapes(limit: int = 50, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Retrieve recent scrape history records."""
    init_db(db_path)
    conn = get_db_connection(db_path)
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
    """Delete a scrape record by ID."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scrape_history WHERE id = ?", (record_id,))
    conn.commit()
    conn.close()
