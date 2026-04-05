import os
import httpx
from collections import Counter
import re
from typing import List
from models.schemas import BaseModel
from utils.logger import get_logger

logger = get_logger(__name__)

SERP_API_KEY = os.getenv("SERP_API_KEY")

class VisualSearchResult(BaseModel):
    product_name: str
    keywords: List[str]
    confidence: float
    source: str
    raw_titles: List[str] = []

STOP_WORDS = {"the", "a", "an", "and", "or", "but", "in", "on", "for", "with", "of", "at", 
              "by", "to", "buy", "online", "cheap", "price", "review", "new", "top", "best"}

def extract_keywords(titles: List[str]) -> List[str]:
    words = []
    for title in titles:
        clean = re.sub(r'[^a-zA-Z\s]', '', title).lower()
        for word in clean.split():
            if len(word) > 2 and word not in STOP_WORDS:
                words.append(word)
    
    counts = Counter(words)
    return [word for word, count in counts.most_common(5)]

async def identify_product_from_image(image_url: str) -> VisualSearchResult:
    fallback = VisualSearchResult(
        product_name="Product from reel",
        keywords=["product"],
        confidence=0.1,
        source="fallback"
    )
    
    if not SERP_API_KEY or image_url.startswith("data:image"):
        logger.info("Using fallback visual search")
        return fallback
        
    try:
        async with httpx.AsyncClient() as client:
            params = {
                "engine": "google_lens",
                "url": image_url,
                "api_key": SERP_API_KEY,
            }
            resp = await client.get("https://serpapi.com/search.json", params=params, timeout=20.0)
            if resp.status_code != 200:
                logger.error(f"SerpAPI Error: {resp.status_code}")
                return fallback
                
            data = resp.json()
            titles = []
            product_name = ""
            
            kg = data.get("knowledge_graph", [])
            if kg and isinstance(kg, list):
                product_name = kg[0].get("title", "")
            
            visual_matches = data.get("visual_matches", [])
            for match in visual_matches[:10]:
                if "title" in match:
                    titles.append(match["title"])
                    
            if not product_name and titles:
                product_name = titles[0]
                
            shopping = data.get("shopping_results", [])
            for shop in shopping[:3]:
                if "title" in shop:
                    titles.append(shop["title"])
                    
            if not product_name:
                return fallback
                
            keywords = extract_keywords(titles)
            
            return VisualSearchResult(
                product_name=product_name,
                keywords=keywords if keywords else ["product"],
                confidence=0.85 if kg else 0.6,
                source="google_lens",
                raw_titles=titles[:5]
            )
            
    except Exception as e:
        logger.error(f"Google Lens identification failed: {str(e)}")
        return fallback
