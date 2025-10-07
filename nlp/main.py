from .search import load_search_index, search_documents
from .generator import generate_answer, generate_contextual_answer
from .conversation import process_user_message
import numpy as np
from sklearn.preprocessing import normalize

# 서버 시작 시 1회만 로딩
retriever, index, docs, problem_texts = load_search_index()

# 이미지 분석 결과로 솔루션 반환
def return_solution(label: str, loc: str):
    """이미지 분석 결과로 솔루션 반환"""
    question = f"{loc}에서 {label} 제거하는 법 알려줘."
    
    # 문서 검색
    filtered_docs = search_documents(question, retriever, index, docs)
    
    # 문맥 구성
    context = "\n\n---\n\n".join(filtered_docs)
    
    # GPT로 해결책 생성
    answer = generate_answer(question, context)
    return answer

# 사용자 텍스트에 대한 솔루션 반환
def chat_with_ai(user_message: str):
    """
    사용자 메시지에 대한 스마트한 채팅 응답을 생성합니다.
    구체적이지 않은 질문의 경우 추가 질문을 통해 더 정확한 답변을 제공합니다.
    문맥이 필요한 질문의 경우 이전 대화를 고려한 답변을 생성합니다.
    """
    
    # 대화 처리
    response_message, is_final_answer, requires_context = process_user_message(user_message)
    
    if not is_final_answer:
        # 추가 질문이 필요한 경우
        return response_message
    
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
        
        return answer
    
    # 일반적인 최종 답변을 생성하는 경우
    search_query = response_message
    
    # 문서 검색
    filtered_docs = search_documents(search_query, retriever, index, docs)
    
    # 문맥 구성
    context = "\n\n---\n\n".join(filtered_docs)
    
    # 추가 컨텍스트 정보
    additional_context = f"""
    사용자 질문: {search_query}
    
    위의 관련 문서들을 참고하여 다음을 포함한 답변을 제공해주세요:
    - 안전을 최우선으로 고려한 조언
    - 단계별 해결 방법
    - 필요한 도구나 재료
    - 전문가 상담이 필요한 경우 언급
    """
    
    # 최종 컨텍스트 결합
    final_context = f"{additional_context}\n\n관련 문서:\n{context}"
    
    # GPT로 응답 생성
    answer = generate_answer(search_query, final_context)
    
    # 대화 기록에 최종 답변 추가
    from .conversation import conversation_manager
    conversation_manager.add_to_history(response_message, answer)
    
    return answer
