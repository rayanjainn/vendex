from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from models.database import get_db

router = APIRouter()

@router.get("/suppliers")
async def get_suppliers(
    job_id: str,
    country_codes: str = None,
    supplier_type: str = None,
    min_price_inr: float = 0,
    max_price_inr: float = 1000000,
    min_moq: int = 1,
    max_moq: int = 10000,
    min_rating: float = 0.0,
    verified_only: bool = False,
    trade_assurance_only: bool = False,
    platforms: str = None,
    sort_by: str = "match_score",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 20
):
    db = await get_db()
    
    query = "SELECT * FROM suppliers WHERE job_id = ?"
    params = [job_id]
    
    if country_codes:
        codes = country_codes.split(",")
        query += f" AND country_code IN ({','.join(['?']*len(codes))})"
        params.extend(codes)
        
    if supplier_type:
        types = supplier_type.split(",")
        query += f" AND supplier_type IN ({','.join(['?']*len(types))})"
        params.extend(types)
        
    query += " AND unit_price_inr BETWEEN ? AND ?"
    params.extend([min_price_inr, max_price_inr])
    
    query += " AND moq BETWEEN ? AND ?"
    params.extend([min_moq, max_moq])
    
    if min_rating > 0:
        query += " AND rating >= ?"
        params.append(min_rating)
        
    if verified_only:
        query += " AND verified = 1"
        
    if trade_assurance_only:
        query += " AND trade_assurance = 1"
        
    if platforms:
        plats = platforms.split(",")
        query += f" AND platform IN ({','.join(['?']*len(plats))})"
        params.extend(plats)
        
    valid_sorts = ['match_score', 'unit_price_inr', 'rating', 'estimated_delivery_days']
    safe_sort = sort_by if sort_by in valid_sorts else 'match_score'
    dir_str = "ASC" if sort_dir.lower() == "asc" else "DESC"
    
    # Custom ordering using CASE to prioritize IN then CN
    order_clause = f"""
    ORDER BY 
      CASE WHEN country_code = 'IN' THEN 0 
           WHEN country_code = 'CN' THEN 1 
           ELSE 2 END ASC,
      {safe_sort} {dir_str}
    """
    
    query += f" {order_clause} LIMIT ? OFFSET ?"
    params.extend([page_size, (page - 1) * page_size])
    
    async with db.execute(query, tuple(params)) as cursor:
        rows = await cursor.fetchall()
        
    # Get total count
    count_query = "SELECT COUNT(*) FROM suppliers WHERE job_id = ?"
    async with db.execute(count_query, (job_id,)) as cursor:
        total = (await cursor.fetchone())[0]
        
    import json
    from models.database import to_camel
    
    formatted_suppliers = []
    for row in rows:
        row_dict = dict(row)
        # Parse JSON fields
        for key in ('shipping_methods', 'certifications', 'product_properties', 'raw_api_response'):
            if key in row_dict:
                empty = '{}' if key in ('product_properties', 'raw_api_response') else '[]'
                try:
                    row_dict[key] = json.loads(row_dict[key] or empty)
                except:
                    row_dict[key] = {} if key in ('product_properties', 'raw_api_response') else []
        
        # Convert to camelCase
        formatted_suppliers.append({to_camel(k): v for k, v in row_dict.items()})
        
    await db.close()
    
    return {
        "suppliers": formatted_suppliers,
        "total": total,
        "page": page,
        "page_size": page_size
    }
