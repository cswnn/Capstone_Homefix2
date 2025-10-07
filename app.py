from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from efficientnet import run_pipeline, load_model
from nlp.main import return_solution, chat_with_ai  # ← GPT 기반 해결책 생성 함수 및 채팅 함수
from PIL import Image
from pydantic import BaseModel
import io, base64, socket
import os, time, hmac, hashlib
from urllib.parse import urlencode
import requests
import json
import re
from googleapiclient.discovery import build

app = FastAPI()

# CORS 허용 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 서비스에선 "*" 대신 앱 주소 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# EfficientNet 모델 로딩 (서버 시작 시 한 번만
model = load_model()

def get_local_ip():
    """현재 컴퓨터의 로컬 IP 주소를 가져옵니다."""
    try:
        # 외부 연결을 시도하여 로컬 IP 확인
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        # 실패 시 localhost 반환
        return "127.0.0.1"

class ImageBase64Request(BaseModel):
    image_base64: str

class ChatRequest(BaseModel):
    message: str


@app.get("/server-info/")
async def get_server_info():
    """서버 정보를 반환합니다 (IP 주소, 포트 등)."""
    return {
        "ip": get_local_ip(),
        "port": 8000,
        "base_url": f"http://{get_local_ip()}:8000"
    }

@app.post("/analyze/")
async def analyze(data: ImageBase64Request):
    try:
        # 이미지 읽기
        print("✅ 받은 base64 길이:", len(data.image_base64))
        image_bytes = base64.b64decode(data.image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"이미지 처리 실패: {str(e)}")

    # 문제 유형 + 위치 예측
    problem, location = run_pipeline(image, model=model)

    # 해결책 생성
    solution = return_solution(problem, location)

    return {
        "problem": problem,
        "location": location,
        "solution": solution
    }

@app.post("/chat/")
async def chat(data: ChatRequest):
    try:
        # AI와 채팅
        response = chat_with_ai(data.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅 처리 실패: {str(e)}")


# ------------------------ 제품 추천 (Google Custom Search API) ------------------------ #
class RecommendRequest(BaseModel):
    problem: str
    location: str

def _extract_price_from_text(text: str) -> int:
    """텍스트에서 가격 정보를 추출합니다."""
    # 가격 패턴 매칭 (원, 만원, 천원 등)
    price_patterns = [
        r'(\d{1,3}(?:,\d{3})*)\s*원',
        r'(\d{1,3}(?:,\d{3})*)\s*만원',
        r'(\d{1,3}(?:,\d{3})*)\s*천원',
        r'\$(\d{1,3}(?:,\d{3})*)',
        r'(\d{1,3}(?:,\d{3})*)\s*₩'
    ]
    
    for pattern in price_patterns:
        match = re.search(pattern, text)
        if match:
            price_str = match.group(1).replace(',', '')
            try:
                price = int(price_str)
                if '만원' in text:
                    price *= 10000
                elif '천원' in text:
                    price *= 1000
                return price
            except ValueError:
                continue
    return None

def _extract_rating_from_text(text: str) -> float:
    """텍스트에서 별점 정보를 추출합니다."""
    # 별점 패턴 매칭
    rating_patterns = [
        r'(\d\.?\d?)\s*점',
        r'(\d\.?\d?)\s*★',
        r'(\d\.?\d?)\s*별',
        r'평점\s*(\d\.?\d?)',
        r'rating\s*(\d\.?\d?)',
        r'(\d\.?\d?)\s*/\s*5'
    ]
    
    for pattern in rating_patterns:
        match = re.search(pattern, text.lower())
        if match:
            try:
                rating = float(match.group(1))
                if rating <= 5:
                    return rating
            except ValueError:
                continue
    return None

def _google_search_products(keyword: str, limit: int = 10) -> list:
    """Google Custom Search API를 사용해서 제품을 검색합니다."""
    api_key = os.environ.get("GOOGLE_SEARCH_API_KEY")
    search_engine_id = os.environ.get("GOOGLE_SEARCH_ENGINE_ID")
    
    if not api_key or not search_engine_id:
        print("Google Search API 키가 설정되지 않았습니다.")
        return []

    try:
        service = build("customsearch", "v1", developerKey=api_key)
        
        # 쇼핑몰 사이트에서 검색하도록 쿼리 최적화
        search_query = f"{keyword} 구매 가격 리뷰"
        
        result = service.cse().list(
            q=search_query,
            cx=search_engine_id,
            num=limit,
            safe='active'
        ).execute()

        products = []
        items = result.get('items', [])
        
        for item in items:
            title = item.get('title', '')
            snippet = item.get('snippet', '')
            link = item.get('link', '')
            
            # 이미지 URL 추출
            image_url = None
            if 'pagemap' in item and 'cse_image' in item['pagemap']:
                image_url = item['pagemap']['cse_image'][0].get('src')
            elif 'pagemap' in item and 'metatags' in item['pagemap']:
                for meta in item['pagemap']['metatags']:
                    if 'og:image' in meta:
                        image_url = meta['og:image']
                        break
            
            # 가격 추출
            price = _extract_price_from_text(title + ' ' + snippet)
            
            # 별점 추출
            rating = _extract_rating_from_text(title + ' ' + snippet)
            
            # 쇼핑몰 사이트인지 확인 (네이버쇼핑, 쿠팡, 11번가, G마켓 등)
            is_shopping_site = any(site in link.lower() for site in [
                'shopping.naver.com', 'coupang.com', '11st.co.kr', 
                'gmarket.co.kr', 'auction.co.kr', 'interpark.com',
                'lotte.com', 'homeplus.co.kr', 'emart.com'
            ])
            
            products.append({
                "title": title,
                "snippet": snippet,
                "price": price,
                "rating": rating,
                "link": link,
                "imageUrl": image_url,
                "is_shopping_site": is_shopping_site,
                "ad": False
            })
        
        return products
        
    except Exception as e:
        print(f"Google Search API 오류: {e}")
        return []

def _filter_and_rank_products(products: list, limit: int = 2) -> list:
    """제품을 필터링하고 순위를 매깁니다."""
    # 쇼핑몰 사이트 우선, 가격 정보 있는 것 우선, 별점 높은 것 우선
    def sort_key(product):
        score = 0
        
        # 쇼핑몰 사이트 가산점
        if product.get('is_shopping_site', False):
            score += 100
            
        # 가격 정보 있으면 가산점
        if product.get('price') is not None:
            score += 50
            
        # 별점 가산점 (0-50점)
        if product.get('rating') is not None:
            score += product['rating'] * 10
            
        return score
    
    # 정렬 후 상위 제품만 반환
    sorted_products = sorted(products, key=sort_key, reverse=True)
    
    # 결과 정리
    results = []
    for product in sorted_products[:limit]:
        results.append({
            "title": product['title'][:100],  # 제목 길이 제한
            "price": product.get('price'),
            "link": product['link'],
            "imageUrl": product.get('imageUrl'),
            "rating": product.get('rating'),
            "ad": False
        })
    
    return results

def _keyword_groups(problem: str, location: str) -> list:
    """문제 유형에 따른 키워드 그룹 생성"""
    p = problem.lower() if problem else ""
    
    if "누수" in p or "물" in p or "새" in p:
        return [
            {"group": "방수용품", "required": True, "keywords": ["방수테이프", "실리콘 실란트", "누수차단제"]},
            {"group": "수리도구", "required": False, "keywords": ["배관렌치", "파이프커터", "배관공구세트"]},
        ]
    elif "균열" in p or "갈라짐" in p or "크랙" in p:
        return [
            {"group": "보수재료", "required": True, "keywords": ["균열보수제", "벽면퍼티", "크랙보수재"]},
            {"group": "도구", "required": False, "keywords": ["퍼티나이프", "사포지", "페인트롤러"]},
        ]
    elif "곰팡" in p:
        return [
            {"group": "곰팡이제거제", "required": True, "keywords": ["곰팡이제거제", "곰팡이방지제", "락스"]},
            {"group": "청소용품", "required": False, "keywords": ["청소용 스크러버", "고무장갑", "방진마스크"]},
        ]
    elif "페인트" in p or "도색" in p or "칠" in p:
        return [
            {"group": "페인트", "required": True, "keywords": ["벽면페인트", "수성페인트", "프라이머"]},
            {"group": "도구", "required": False, "keywords": ["페인트붓", "롤러", "마스킹테이프"]},
        ]
    elif "타일" in p:
        return [
            {"group": "타일보수", "required": True, "keywords": ["타일접착제", "타일그라우트", "타일보수재"]},
            {"group": "도구", "required": False, "keywords": ["타일커터", "고무망치", "그라우트제거기"]},
        ]
    elif "기름" in p or "때" in p:
        return [
            {"group": "세정제", "required": True, "keywords": ["베이킹소다", "기름때제거제", "주방세제"]},
            {"group": "청소도구", "required": False, "keywords": ["사포", "연마패드", "청소브러시"]},
        ]
    elif "녹" in p or "부식" in p:
        return [
            {"group": "녹제거제", "required": True, "keywords": ["녹제거제", "방청제", "부식방지제"]},
            {"group": "연마도구", "required": False, "keywords": ["사포", "스틸울", "연마패드"]},
        ]
    else:
        # 기본 그룹
        return [
            {"group": "기본수리용품", "required": True, "keywords": ["만능접착제", "수리테이프", "실리콘"]},
            {"group": "도구", "required": False, "keywords": ["드라이버세트", "망치", "펜치세트"]},
        ]

def _fallback_results(groups: list) -> list:
    """API 실패 시 기본 검색 링크 제공"""
    results = []
    for g in groups:
        items = []
        for i, kw in enumerate(g["keywords"][:2]):  # 최대 2개
            items.append({
                "title": f"{kw} - 네이버쇼핑에서 검색",
                "price": None,
                "link": f"https://search.shopping.naver.com/search/all?query={kw}",
                "imageUrl": None,
                "rating": None,
                "ad": False
            })
        results.append({
            "group": g["group"],
            "required": g["required"],
            "items": items
        })
    return results

@app.post("/recommend/")
async def recommend(req: RecommendRequest):
    """제품 추천 API - Google Custom Search 사용"""
    groups = _keyword_groups(req.problem, req.location)
    has_keys = bool(os.environ.get("GOOGLE_SEARCH_API_KEY") and os.environ.get("GOOGLE_SEARCH_ENGINE_ID"))

    if not has_keys:
        print("Google Search API 키가 없어서 기본 검색 링크를 제공합니다.")
        return {"groups": _fallback_results(groups)}

    grouped = []
    for g in groups:
        all_products = []
        
        # 각 키워드로 제품 검색
        for kw in g["keywords"]:
            products = _google_search_products(kw, limit=5)
            all_products.extend(products)
        
        # 제품 필터링 및 순위 매기기
        if all_products:
            best_products = _filter_and_rank_products(all_products, limit=2)
        else:
            # 검색 실패 시 기본 링크 제공
            best_products = _fallback_results([g])[0]["items"]
        
        grouped.append({
            "group": g["group"], 
            "required": g["required"], 
            "items": best_products
        })

    return {"groups": grouped}