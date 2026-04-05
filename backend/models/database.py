import os
import asyncio
import aiosqlite
import json

DATABASE_PATH = os.getenv("DATABASE_PATH", "./reelsource.db")

# Global write lock — SQLite allows one writer at a time; this prevents "database is locked"
# when parallel tasks (e.g. 10 scraper tabs all finishing simultaneously) try to write.
_write_lock = asyncio.Lock()

async def get_db():
    db = await aiosqlite.connect(DATABASE_PATH, timeout=30.0)
    db.row_factory = aiosqlite.Row
    # WAL mode: readers don't block writers and vice versa
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA synchronous=NORMAL")
    return db

async def init_db():
    db = await get_db()
    
    await db.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      reel_url TEXT NOT NULL,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      extracted_frame_url TEXT,
      detected_product_name TEXT,
      detected_keywords TEXT DEFAULT '[]',
      error_message TEXT,
      result_count INTEGER DEFAULT 0,
      pipeline_stages TEXT DEFAULT '[]',
      progress_percent INTEGER DEFAULT 0,
      detailed_logs TEXT DEFAULT '[]',
      duration_seconds REAL,
      label TEXT,
      csv_row_id TEXT
    );
    """)

    # Migrate existing table if columns missing
    async with db.execute("PRAGMA table_info(jobs)") as cursor:
        columns = [row[1] for row in await cursor.fetchall()]
        if 'detailed_logs' not in columns:
            await db.execute("ALTER TABLE jobs ADD COLUMN detailed_logs TEXT DEFAULT '[]'")
        if 'duration_seconds' not in columns:
            await db.execute("ALTER TABLE jobs ADD COLUMN duration_seconds REAL")
        if 'label' not in columns:
            await db.execute("ALTER TABLE jobs ADD COLUMN label TEXT")
        if 'csv_row_id' not in columns:
            await db.execute("ALTER TABLE jobs ADD COLUMN csv_row_id TEXT")

    await db.execute("""
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_description TEXT,
      product_image_url TEXT,
      product_category TEXT,
      supplier_name TEXT NOT NULL,
      supplier_type TEXT NOT NULL,
      company_name TEXT NOT NULL,
      country TEXT NOT NULL,
      country_code TEXT NOT NULL,
      city TEXT,
      verified INTEGER DEFAULT 0,
      gold_supplier INTEGER DEFAULT 0,
      trade_assurance INTEGER DEFAULT 0,
      years_on_platform INTEGER,
      unit_price_usd REAL,
      unit_price_cny REAL,
      unit_price_inr REAL NOT NULL,
      original_currency TEXT NOT NULL,
      original_price REAL NOT NULL,
      price_range_min REAL,
      price_range_max REAL,
      moq INTEGER NOT NULL,
      moq_unit TEXT DEFAULT 'pieces',
      shipping_methods TEXT DEFAULT '[]',
      estimated_shipping_cost_usd REAL,
      estimated_shipping_cost_inr REAL,
      total_price_inr REAL NOT NULL,
      estimated_delivery_days INTEGER,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      response_rate TEXT,
      response_time TEXT,
      reorder_rate TEXT,
      on_time_delivery_rate TEXT,
      location TEXT,
      warranty TEXT,
      certifications TEXT DEFAULT '[]',
      sample_available INTEGER DEFAULT 0,
      sample_price_usd REAL,
      sample_price_inr REAL,
      platform TEXT DEFAULT 'alibaba',
      product_url TEXT NOT NULL,
      item_id TEXT,
      store_id TEXT,
      match_score REAL NOT NULL,
      match_source TEXT NOT NULL,
      created_at TEXT NOT NULL,
      product_properties TEXT DEFAULT '{}',
      raw_api_response TEXT DEFAULT '{}',
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
    """)

    # Check for missing columns in suppliers if table already exists
    async with db.execute("PRAGMA table_info(suppliers)") as cursor:
        cols = [row[1] for row in await cursor.fetchall()]
        if 'product_properties' not in cols:
            await db.execute("ALTER TABLE suppliers ADD COLUMN product_properties TEXT DEFAULT '{}'")
        if 'raw_api_response' not in cols:
            await db.execute("ALTER TABLE suppliers ADD COLUMN raw_api_response TEXT DEFAULT '{}'")
        if 'sample_price_inr' not in cols:
            await db.execute("ALTER TABLE suppliers ADD COLUMN sample_price_inr REAL")
        if 'reorder_rate' not in cols:
            await db.execute("ALTER TABLE suppliers ADD COLUMN reorder_rate TEXT")
        if 'on_time_delivery_rate' not in cols:
            await db.execute("ALTER TABLE suppliers ADD COLUMN on_time_delivery_rate TEXT")
        if 'location' not in cols:
            await db.execute("ALTER TABLE suppliers ADD COLUMN location TEXT")

    await db.execute("""
    CREATE TABLE IF NOT EXISTS csv_rows (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      upload_name TEXT NOT NULL,
      sr_no TEXT,
      sent_by TEXT,
      sku_name TEXT,
      product_link TEXT,
      product_image TEXT,
      inquiry_sent TEXT,
      extra_data TEXT DEFAULT '{}',
      job_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
    """)

    await db.execute("CREATE INDEX IF NOT EXISTS idx_csv_rows_upload_id ON csv_rows(upload_id);")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_suppliers_job_id ON suppliers(job_id);")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country_code);")
    await db.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);")

    await db.commit()
    await db.close()

def to_camel(s):
    parts = s.split('_')
    camel = [parts[0]]
    for word in parts[1:]:
        if word.upper() in ('INR', 'USD', 'CNY'):
            camel.append(word.upper())
        else:
            camel.append(word.capitalize())
    return "".join(camel)

async def get_job(job_id: str):
    db = await get_db()
    async with db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)) as cursor:
        row = await cursor.fetchone()
    await db.close()
    if row:
        row_dict = dict(row)
        for key in ('detected_keywords', 'pipeline_stages', 'detailed_logs'):
            row_dict[key] = json.loads(row_dict.get(key) or '[]')
        
        # Convert to camelCase for frontend
        return {to_camel(k): v for k, v in row_dict.items()}
    return None

async def save_job(job_data: dict):
    fields = list(job_data.keys())
    placeholders = ", ".join(["?"] * len(fields))
    values = []
    for k in fields:
        if k in ('detected_keywords', 'pipeline_stages', 'detailed_logs') and isinstance(job_data[k], list):
            values.append(json.dumps(job_data[k]))
        else:
            values.append(job_data[k])
    query = f"INSERT OR REPLACE INTO jobs ({', '.join(fields)}) VALUES ({placeholders})"
    async with _write_lock:
        db = await get_db()
        await db.execute(query, tuple(values))
        await db.commit()
        await db.close()

async def update_job(job_id: str, updates: dict):
    if not updates:
        return
    set_clauses = []
    values = []
    for k, v in updates.items():
        set_clauses.append(f"{k} = ?")
        if k in ('detected_keywords', 'pipeline_stages', 'detailed_logs') and isinstance(v, list):
            values.append(json.dumps(v))
        else:
            values.append(v)
    values.append(job_id)
    query = f"UPDATE jobs SET {', '.join(set_clauses)} WHERE id = ?"
    async with _write_lock:
        db = await get_db()
        await db.execute(query, tuple(values))
        await db.commit()
        await db.close()

async def save_supplier(supplier_data: dict):
    fields = list(supplier_data.keys())
    placeholders = ", ".join(["?"] * len(fields))
    values = []
    for k in fields:
        if k in ('shipping_methods', 'certifications', 'product_properties', 'raw_api_response') and isinstance(supplier_data[k], (list, dict)):
            values.append(json.dumps(supplier_data[k]))
        elif isinstance(supplier_data[k], bool):
            values.append(1 if supplier_data[k] else 0)
        else:
            values.append(supplier_data[k])
    query = f"INSERT OR REPLACE INTO suppliers ({', '.join(fields)}) VALUES ({placeholders})"
    async with _write_lock:
        db = await get_db()
        await db.execute(query, tuple(values))
        await db.commit()
        await db.close()

async def get_all_jobs(status=None, limit=50, offset=0):
    db = await get_db()
    query = "SELECT * FROM jobs"
    params = []
    if status := status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    async with db.execute(query, tuple(params)) as cursor:
        rows = await cursor.fetchall()
    await db.close()
    
    jobs = []
    for row in rows:
        row_dict = dict(row)
        for key in ('detected_keywords', 'pipeline_stages', 'detailed_logs'):
            row_dict[key] = json.loads(row_dict.get(key) or '[]')
        
        # Convert to camelCase
        jobs.append({to_camel(k): v for k, v in row_dict.items()})
    return jobs

async def save_csv_rows(rows: list):
    async with _write_lock:
        db = await get_db()
        for row in rows:
            fields = list(row.keys())
            placeholders = ", ".join(["?"] * len(fields))
            values = [json.dumps(row[k]) if isinstance(row[k], (dict, list)) else row[k] for k in fields]
            query = f"INSERT OR REPLACE INTO csv_rows ({', '.join(fields)}) VALUES ({placeholders})"
            await db.execute(query, tuple(values))
        await db.commit()
        await db.close()

async def get_csv_rows(upload_id: str = None):
    db = await get_db()
    if upload_id:
        query = "SELECT * FROM csv_rows WHERE upload_id = ? ORDER BY created_at ASC"
        async with db.execute(query, (upload_id,)) as cursor:
            rows = await cursor.fetchall()
    else:
        query = "SELECT * FROM csv_rows ORDER BY created_at DESC"
        async with db.execute(query) as cursor:
            rows = await cursor.fetchall()
    await db.close()
    result = []
    for row in rows:
        d = dict(row)
        if d.get('extra_data'):
            try: d['extra_data'] = json.loads(d['extra_data'])
            except: pass
        result.append({to_camel(k): v for k, v in d.items()})
    return result

async def update_csv_row(row_id: str, updates: dict):
    if not updates:
        return
    set_clauses = [f"{k} = ?" for k in updates]
    values = list(updates.values()) + [row_id]
    async with _write_lock:
        db = await get_db()
        await db.execute(f"UPDATE csv_rows SET {', '.join(set_clauses)} WHERE id = ?", tuple(values))
        await db.commit()
        await db.close()

async def delete_csv_upload(upload_id: str):
    async with _write_lock:
        db = await get_db()
        await db.execute("DELETE FROM csv_rows WHERE upload_id = ?", (upload_id,))
        await db.commit()
        await db.close()

async def delete_job_with_suppliers(job_id: str):
    async with _write_lock:
        db = await get_db()
        await db.execute("DELETE FROM suppliers WHERE job_id = ?", (job_id,))
        await db.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        await db.commit()
        await db.close()
