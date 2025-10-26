from .search import load_search_index, search_documents
from .generator import generate_answer, generate_contextual_answer
from .conversation import process_user_message
import numpy as np
from sklearn.preprocessing import normalize
import re
import urllib.parse

# 서버 시작 시 1회만 로딩
retriever, index, docs, problem_texts = load_search_index()

# 이미지 분석 결과로 솔루션 반환
def return_solution(label: str, loc: str):
    """이미지 분석 결과로 솔루션과 선택된 문제 제목(전체)을 반환"""
    question = f"{loc}에서 {label} 제거하는 법 알려줘."

    # 문서 검색 (상위 후보 및 최상위 인덱스 추출)
    query_embedding = retriever.encode([question], convert_to_tensor=False)
    query_embedding = np.array(query_embedding).astype("float32")
    query_embedding = normalize(query_embedding, norm='l2')

    distances, labels = index.search(query_embedding, k=5)
    best_dist = distances[0][0]
    top_idx = int(labels[0][0]) if labels is not None and len(labels[0]) > 0 else -1

    # 필터 기준 내 문서 구성 (기존 로직과 동일)
    filtered_docs = [
        docs[i] for i, dist in zip(labels[0], distances[0]) if dist <= best_dist + 0.05
    ] if labels is not None and len(labels) > 0 else []

    # 문맥 구성
    context = "\n\n---\n\n".join(filtered_docs)

    # GPT로 해결책 생성
    answer = generate_answer(question, context)

    # 최상위 매칭 문서의 문제 제목 (없으면 원래 label 사용)
    selected_problem = problem_texts[top_idx] if 0 <= top_idx < len(problem_texts) else label

    return answer, selected_problem


def extract_solution_section(doc_text: str) -> str:
    """문서에서 **해결책** 섹션만 추출"""
    pattern = r"\*\*해결책\*\*\s*\n(.*?)(?=\*\*|---|\Z)"
    match = re.search(pattern, doc_text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def get_supplies_for_problem(problem_title: str):
    """problem_title로 섹션 찾아서 준비물 파싱"""
    try:
        idx = problem_texts.index(problem_title)
    except ValueError:
        return [], []
    
    section = docs[idx]
    return parse_supplies_from_document(section)

def parse_supplies_from_document(doc_text: str) -> tuple[list[str], list[str]]:
    """문서에서 준비물(필수/선택) 파싱"""
    required_items = []
    optional_items = []
    
    # **준비물(필수)** 다음 두 줄만 추출
    req_pattern = r"\*\*준비물\(필수\)\*\*\n([^\n]+)\n?([^\n]*)?"
    req_match = re.search(req_pattern, doc_text)
    if req_match:
        # 두 줄을 합치되, 빈 줄은 제외
        req_lines = [req_match.group(1).strip(), req_match.group(2).strip()] if req_match.group(2) else [req_match.group(1).strip()]
        req_content = '\n'.join([line for line in req_lines if line])
        if req_content and "(없음)" not in req_content:
            required_items = [item.strip() for item in req_content.split(',') if item.strip()]
        print(f"[DEBUG] 추출된 필수 준비물 리스트: {required_items}")
    
    # **준비물(선택)** 다음 두 줄만 추출
    opt_pattern = r"\*\*준비물\(선택\)\*\*\n([^\n]+)\n?([^\n]*)?"
    opt_match = re.search(opt_pattern, doc_text)
    if opt_match:
        # 두 줄을 합치되, 빈 줄은 제외
        opt_lines = [opt_match.group(1).strip(), opt_match.group(2).strip()] if opt_match.group(2) else [opt_match.group(1).strip()]
        opt_content = '\n'.join([line for line in opt_lines if line])
        if opt_content and "(없음)" not in opt_content:
            optional_items = [item.strip() for item in opt_content.split(',') if item.strip()]
        print(f"[DEBUG] 추출된 선택 준비물 리스트: {optional_items}")
    else:
        print(f"[DEBUG] 준비물(선택) 패턴 매칭 실패")
    
    return required_items, optional_items

# 사용자 텍스트에 대한 솔루션 반환
def chat_with_ai(user_message: str):
    """
    사용자 메시지에 대한 스마트한 채팅 응답을 생성합니다.
    구체적이지 않은 질문의 경우 추가 질문을 통해 더 정확한 답변을 제공합니다.
    문맥이 필요한 질문의 경우 이전 대화를 고려한 답변을 생성합니다.
    
    Returns:
        dict: {"response": 답변, "is_specific": 구체성 여부, "supplies": 준비물 정보}
    """
    
    # 대화 처리
    response_message, is_final_answer, requires_context = process_user_message(user_message)
    
    if not is_final_answer:
        # 추가 질문이 필요한 경우 (애매한 질문)
        return {"response": response_message, "is_specific": False}
    
    if requires_context:
        # 문맥이 필요한 질문인 경우
        from .conversation import conversation_manager
        
        # 이전 대화 내용 가져오기
        conversation_context = conversation_manager.get_conversation_context()
        
        # 문서 검색 (선택적)
        filtered_docs = search_documents(response_message, retriever, index, docs)
        search_context = "\n\n---\n\n".join(filtered_docs) if filtered_docs else ""
        
        # 문맥 기반 답변 생성
        answer = generate_contextual_answer(response_message, conversation_context, search_context)
        
        # 대화 기록에 최종 답변 추가
        conversation_manager.add_to_history(response_message, answer)
        
        return {"response": answer, "is_specific": True}
    
    # 일반적인 최종 답변을 생성하는 경우
    search_query = response_message
    
    # 문서 검색
    filtered_docs = search_documents(search_query, retriever, index, docs)
    
    # 가장 관련성 높은 문서에서 해결책 추출
    solution_text = ""
    
    if filtered_docs:
        # 첫 번째 문서에서 해결책 섹션만 추출
        solution_text = extract_solution_section(filtered_docs[0])
        
        # 문제 제목 추출 (추가 보조 정보)
        title_match = re.search(r"## 문제[:：](.+)", filtered_docs[0])
        if title_match:
            problem_title = title_match.group(1).strip()
    
    # 준비물 정보 추출 (문서에서 직접 파싱)
    required_items, optional_items = [], []
    if filtered_docs:
        doc_text = filtered_docs[0]
        required_items, optional_items = parse_supplies_from_document(doc_text)
    
    # 준비물 검색 링크 생성
    supply_links = []
    for item in required_items:
        supply_links.append({
            "keyword": item,
            "type": "필수",
            "link": f"https://search.shopping.naver.com/search/all?query={urllib.parse.quote(item)}"
        })
    for item in optional_items:
        supply_links.append({
            "keyword": item,
            "type": "선택",
            "link": f"https://search.shopping.naver.com/search/all?query={urllib.parse.quote(item)}"
        })
    
    # 문맥 구성
    context = "\n\n---\n\n".join(filtered_docs)
    
    # 추가 컨텍스트 정보
    additional_context = f"""
    사용자 질문: {search_query}
    
    위의 관련 문서들을 참고하여 다음을 포함한 답변을 제공해주세요:
    - 안전을 최우선으로 고려한 조언
    - 단계별 해결 방법
    - 전문가 상담이 필요한 경우 언급
    
    ⚠️ 중요: 준비물이나 필요한 도구/재료를 직접 언급하지 마세요. 
    준비물은 별도로 제공됩니다.
    """
    
    # 최종 컨텍스트 결합
    final_context = f"{additional_context}\n\n관련 문서:\n{context}"
    
    # GPT로 응답 생성 (짧게)
    answer = generate_answer(search_query, final_context)
    
    # 대화 기록에 최종 답변 추가
    from .conversation import conversation_manager
    conversation_manager.add_to_history(response_message, answer)
    
    return {
        "response": answer,
        "is_specific": True,
        "supplies": supply_links,
        "solution": solution_text
    }
