from typing import Dict, List, Tuple, Optional
from .generator import is_specific_question, generate_clarification_question, needs_context, generate_contextual_answer

class ConversationManager:
    """대화 상태 관리 클래스 - 문맥 유지"""
    
    def __init__(self):
        self.waiting_for_clarification = False
        self.user_original_question = None
        self.conversation_history = []  # 대화 기록 저장
    
    def reset(self):
        """대화 상태 초기화 (history는 유지)"""
        self.waiting_for_clarification = False
        self.user_original_question = None
    
    def reset_all(self):
        """대화 상태와 history 모두 초기화"""
        self.waiting_for_clarification = False
        self.user_original_question = None
        self.conversation_history = []
    
    def add_to_history(self, user_message: str, ai_response: str):
        """대화 기록에 추가"""
        self.conversation_history.append({
            "user": user_message,
            "ai": ai_response
        })
    
    def get_conversation_context(self) -> str:
        """대화 문맥을 문자열로 반환"""
        if not self.conversation_history:
            return ""
        
        context_parts = []
        for exchange in self.conversation_history:
            context_parts.append(f"사용자: {exchange['user']}")
            context_parts.append(f"AI: {exchange['ai']}")
        
        return "\n".join(context_parts)

# 전역 대화 관리자
conversation_manager = ConversationManager()

def is_specific_content(user_message: str, context: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    """
    메시지가 구체적인지 판단 (GPT 기반)
    """
    
    # 모든 경우 GPT 기반 구체성 판단
    is_specific = gpt_based_specificity(user_message, context)
    
    if is_specific:
        return True, "specific"
    else:
        return False, "general"

def gpt_based_specificity(user_message: str, context: Optional[str] = None):
    """GPT를 사용한 구체성 판단 (문맥 고려)"""
    try:
        conversation_context = conversation_manager.get_conversation_context()
        return is_specific_question(user_message, conversation_context)
    except Exception as e:
        print(f"GPT 구체성 판단 중 에러 발생: {e}")
        # 에러 발생 시 기본적으로 구체적이라고 판단 (fallback)
        return True

def generate_clarification_question_gpt(user_message: str, question_type: str) -> str:
    """GPT를 사용한 추가 질문 생성"""
    # 원본 질문 저장
    conversation_manager.user_original_question = user_message
    conversation_manager.waiting_for_clarification = True
    
    try:
        return generate_clarification_question(user_message)
    except Exception as e:
        print(f"GPT 추가 질문 생성 중 에러 발생: {e}")
        # 에러 발생 시 기본 추가 질문 반환
        return "더 구체적인 정보가 필요합니다. 어떤 문제가 발생했고, 어디에서 발생했는지 알려주세요."

def create_specific_query(user_message: str) -> str:
    """구체적인 검색 쿼리 생성"""
    
    if conversation_manager.waiting_for_clarification:
        # 추가 정보를 받은 경우
        original_question = conversation_manager.user_original_question or ""
        specific_query = f"{user_message}에서 {original_question}"
        
        # 대화 상태 초기화
        conversation_manager.reset()
        
        return specific_query
    else:
        # 이미 구체적인 질문인 경우
        return user_message

def process_user_message(user_message: str, is_new_topic: bool = False) -> Tuple[str, bool, bool]:
    """
    사용자 메시지를 처리하고 응답 생성 (문맥 유지)
    
    Returns:
        Tuple[응답_메시지, 최종_답변_여부, 문맥_필요_여부]
    """
    
    # 추가 질문을 기다리는 중인지 확인
    if conversation_manager.waiting_for_clarification:
        is_specific, _ = is_specific_content(user_message)
        
        if is_specific:
            # 구체적인 답변을 받았으므로 최종 답변 생성
            specific_query = create_specific_query(user_message)
            # 대화 기록에 추가
            conversation_manager.add_to_history(user_message, specific_query)
            conversation_manager.reset()  # 대화 상태만 초기화 (history 유지)
            return specific_query, True, False
        else:
            # 여전히 구체적이지 않은 답변
            follow_up = "더 구체적인 정보를 알려주세요."
            conversation_manager.add_to_history(user_message, follow_up)
            return follow_up, False, False
    
    # 새로운 질문인 경우
    if is_new_topic:
        conversation_manager.reset_all()  # 새로운 주제면 완전 초기화
    
    # 문맥이 필요한지 먼저 확인
    conversation_context = conversation_manager.get_conversation_context()
    requires_context = needs_context(user_message, conversation_context)
    
    if requires_context:
        # 문맥이 필요한 질문이므로 바로 문맥 기반 답변 생성
        conversation_manager.add_to_history(user_message, "문맥 기반 답변")
        return user_message, True, True  # 문맥 필요 플래그 True
    
    # 문맥이 필요하지 않은 경우 기존 로직
    is_specific, question_type = is_specific_content(user_message)
    
    if is_specific:
        # 구체적인 질문이므로 바로 처리
        conversation_manager.add_to_history(user_message, user_message)
        return user_message, True, False
    else:
        # 구체적이지 않은 질문이므로 추가 질문 생성
        clarification_question = generate_clarification_question_gpt(user_message, question_type)
        conversation_manager.add_to_history(user_message, clarification_question)
        return clarification_question, False, False
