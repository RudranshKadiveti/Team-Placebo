import os
import sys
import zipfile
import urllib.request
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import numpy as np
from fastembed import TextEmbedding
import time

KAGGLE_DOWNLOAD_URL = "https://www.kaggle.com/api/v1/datasets/download/mansiaggarwal88/ai-engineering-github-repositories"
DATASET_DIR = os.path.join(os.path.dirname(__file__), "kaggle_data")
ZIP_PATH = os.path.join(DATASET_DIR, "dataset.zip")

def setup_db():
    conn = psycopg2.connect(
        dbname="careerpilot",
        user="postgres",
        password="postgrespassword",
        host="127.0.0.1",
        port="5432"
    )
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ai_repository_embeddings (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                "fullName" TEXT UNIQUE NOT NULL,
                "repoName" TEXT NOT NULL,
                owner TEXT NOT NULL,
                "htmlUrl" TEXT NOT NULL,
                description TEXT,
                "primaryLanguage" TEXT,
                topics TEXT,
                "frameworkStack" TEXT,
                "aiCategory" TEXT,
                stars INT DEFAULT 0,
                forks INT DEFAULT 0,
                "maintenanceStatus" TEXT,
                "popularityTier" TEXT,
                embedding vector(384),
                "embeddingModel" TEXT DEFAULT 'BAAI/bge-small-en-v1.5',
                "embeddingDimension" INT DEFAULT 384,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
    return conn

def download_and_extract_dataset():
    os.makedirs(DATASET_DIR, exist_ok=True)
    if not os.path.exists(ZIP_PATH):
        print("📥 Downloading Kaggle dataset...", flush=True)
        urllib.request.urlretrieve(KAGGLE_DOWNLOAD_URL, ZIP_PATH)
        print("✅ Dataset downloaded successfully.", flush=True)
    
    print("📦 Extracting dataset ZIP...", flush=True)
    with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
        zip_ref.extractall(DATASET_DIR)
    print("✅ Dataset extracted.", flush=True)

    csv_files = [f for f in os.listdir(DATASET_DIR) if f.endswith('.csv')]
    if not csv_files:
        raise FileNotFoundError("No CSV file found in dataset directory.")
    
    target_csv = os.path.join(DATASET_DIR, csv_files[0])
    print(f"📄 Found CSV file: {target_csv}", flush=True)
    return target_csv

def clean_dataset(csv_path):
    print("🧹 Cleaning dataset...", flush=True)
    df = pd.read_csv(csv_path)
    print(f"📊 Raw Dataset Rows: {len(df)}", flush=True)

    text_cols = ['full_name', 'owner', 'repo_name', 'html_url', 'description', 'language', 'topics', 'framework_stack', 'ai_category', 'maintenance_status', 'popularity_tier']
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].fillna('').astype(str).str.strip()
        else:
            df[col] = ''

    numeric_cols = ['stars', 'forks']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
        else:
            df[col] = 0

    if 'full_name' not in df.columns or df['full_name'].str.strip().eq('').all():
        df['full_name'] = df['owner'] + '/' + df['repo_name']

    df = df.drop_duplicates(subset=['full_name']).reset_index(drop=True)
    print(f"✨ Cleaned Dataset Unique Repositories: {len(df)}", flush=True)

    df['embedding_text'] = (
        df['full_name'] + ": " + 
        df['description'] + ". Category: " + 
        df['ai_category'] + ". Frameworks: " + 
        df['framework_stack'] + ". Topics: " + 
        df['topics']
    )

    return df

def create_hnsw_index(conn):
    print("⚡ Creating HNSW Index on pgvector embedding column...", flush=True)
    with conn.cursor() as cur:
        cur.execute("SET statement_timeout = 0;")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_repo_embeddings_hnsw ON ai_repository_embeddings USING hnsw (embedding vector_cosine_ops);")
        conn.commit()
    print("✅ HNSW Vector Index created successfully.", flush=True)

def stream_embeddings_to_db(conn, df):
    print("🐘 Checking existing repositories in PostgreSQL...", flush=True)
    with conn.cursor() as cur:
        cur.execute('SELECT "fullName" FROM ai_repository_embeddings WHERE embedding IS NOT NULL;')
        existing_repos = {row[0] for row in cur.fetchall()}
    
    print(f"⚡ Found {len(existing_repos)} repositories already embedded in database.", flush=True)

    pending_df = df[~df['full_name'].isin(existing_repos)].reset_index(drop=True)
    print(f"🚀 Repositories Pending Embedding & Insertion: {len(pending_df)}", flush=True)

    if len(pending_df) == 0:
        print("🎉 ALL REPOSITORIES ARE ALREADY EMBEDDED & STORED!", flush=True)
        create_hnsw_index(conn)
        return

    print("🤖 Initializing FastEmbed model (BAAI/bge-small-en-v1.5, 384-dim normalized vectors)...", flush=True)
    embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5", threads=os.cpu_count() or 4)

    texts = pending_df['embedding_text'].tolist()
    total_pending = len(texts)
    total_repos = len(df)
    
    insert_query = """
        INSERT INTO ai_repository_embeddings (
            id, "fullName", "repoName", "owner", "htmlUrl", "description", "primaryLanguage",
            "topics", "frameworkStack", "aiCategory", "stars", "forks", "maintenanceStatus",
            "popularityTier", "embedding"
        ) VALUES %s
        ON CONFLICT ("fullName") DO UPDATE SET
            "description" = EXCLUDED."description",
            "primaryLanguage" = EXCLUDED."primaryLanguage",
            "topics" = EXCLUDED."topics",
            "frameworkStack" = EXCLUDED."frameworkStack",
            "aiCategory" = EXCLUDED."aiCategory",
            "stars" = EXCLUDED."stars",
            "forks" = EXCLUDED."forks",
            "maintenanceStatus" = EXCLUDED."maintenanceStatus",
            "popularityTier" = EXCLUDED."popularityTier",
            "embedding" = EXCLUDED."embedding";
    """

    start_time = time.time()
    completed_total = len(existing_repos)

    embedding_generator = embedding_model.embed(texts, batch_size=256)

    records = []
    for i, vec in enumerate(embedding_generator):
        row = pending_df.iloc[i]
        vector_str = "[" + ",".join(str(float(x)) for x in vec) + "]"
        records.append((
            row['full_name'],
            row['repo_name'],
            row['owner'],
            row['html_url'],
            row['description'],
            row['language'],
            row['topics'],
            row['framework_stack'],
            row['ai_category'],
            int(row['stars']),
            int(row['forks']),
            row['maintenance_status'],
            row['popularity_tier'],
            vector_str
        ))

        if len(records) >= 500 or i == total_pending - 1:
            with conn.cursor() as cur:
                execute_values(cur, insert_query, records, template="(gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector)")
                conn.commit()
            completed_total += len(records)
            elapsed = time.time() - start_time
            rate = (i + 1) / elapsed if elapsed > 0 else 0
            print(f"  ⚡ Streamed & Inserted Total: {completed_total}/{total_repos} ({rate:.1f} pending repos/sec)...", flush=True)
            records = []

    print(f"✅ All {total_repos} rows embedded & inserted into PostgreSQL in {time.time() - start_time:.2f} seconds.", flush=True)
    create_hnsw_index(conn)

def main():
    conn = setup_db()
    try:
        csv_path = download_and_extract_dataset()
        df = clean_dataset(csv_path)
        stream_embeddings_to_db(conn, df)
        print("\n🎉 KAGGLE DATASET INGESTION & PGVECTOR EMBEDDING SUCCESSFUL!", flush=True)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
