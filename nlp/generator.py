from openai import OpenAI
import os
from dotenv import load_dotenv

# .env 파일에서 OPENAI_API_KEY 불러오기
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_answer(question, context):
    """GPT를 사용해서 최종 답변 생성"""
    prompt = f"""
        당신은 유능한 AI 어시스턴트입니다. 반드시 아래 문맥(Context)에 기반하여 답변해주세요.
        문맥에 없는 내용은 상상하지 말고, 모르면 모른다고 말하세요.
        📌 문맥의 내용을 요약하지 말고, 단계별로 구체적으로 설명해주세요.
        특히 "해결 방법", "예방 팁"을 빠짐없이 반영하여 설명해주세요.

        [문맥 정보]
        {context}

        [질문]
        {question}
        """.strip()

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            { "role": "system", "content": "친절한 한국어 홈케어 전문가입니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=1024
    )
    return response.choices[0].message.content.strip()

def is_specific_question(question, conversation_context=""):
    """GPT를 사용해서 문맥을 고려한 구체성 판단"""
    
    context_prompt = ""
    if conversation_context:
        context_prompt = f"""
[이전 대화 내용]
{conversation_context}

"""
    
    prompt = f"""{context_prompt}다음 질문이 구체적인지 판단해주세요.

구체적인 질문의 기준:
1. 구체적인 대상(예: 후라이팬, 변기, 화장실, 싱크대 등)이 명시되어야 함
2. 구체적인 문제(예: 기름때, 막힘, 곰팡이, 물때 등)가 명시되어야 함

예시:
- "변기 막힘 해결법" → 구체적 (변기 + 막힘)
- "후라이팬 기름때 제거" → 구체적 (후라이팬 + 기름때)
- "기름때 제거법" → 애매함 (대상이 불명확)
- "화장실 청소" → 애매함 (문제가 불명확)

현재 질문: "{question}"

위 질문이 구체적인지 판단해서 "구체적" 또는 "애매함" 중 하나로만 답변해주세요.
""".strip()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "홈케어 질문의 구체성을 판단하는 전문가입니다. 이전 대화 내용을 고려하여 판단하고, '구체적' 또는 '애매함' 중 하나로만 답변합니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=50
    )
    
    result = response.choices[0].message.content.strip()
    print(f"GPT 구체성 판단: {question} → {result}")
    
    return result == "구체적"

def generate_clarification_question(question):
    """GPT를 사용해서 추가 질문 생성"""
    
    prompt = f"""
다음 질문이 애매하므로 구체적인 정보가 필요합니다. 사용자에게 추가 질문을 생성해주세요.

질문: "{question}"

다음 기준에 따라 추가 질문을 생성해주세요:
1. 구체적인 대상(어디서)이 명시되지 않은 경우 → 위치/대상 관련 질문
2. 구체적인 문제(무엇이)가 명시되지 않은 경우 → 문제 유형 관련 질문
3. 둘 다 애매한 경우 → 종합적인 추가 질문

예시:
- "기름때 제거법" → "어디에서 기름때를 제거하고 싶으신가요? (후라이팬, 인덕션, 벽지 등)"
- "화장실 청소" → "화장실에서 어떤 문제를 해결하고 싶으신가요? (곰팡이, 물때, 막힘 등)"
- "고장" → "어떤 것이 고장났고, 어떤 문제가 발생했나요?"

친근하고 도움이 되는 톤으로 추가 질문을 생성해주세요.
""".strip()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "홈케어 전문가로서 사용자에게 구체적인 정보를 요청하는 친근한 추가 질문을 생성합니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=200
    )
    
    result = response.choices[0].message.content.strip()
    print(f"GPT 추가 질문 생성: {question} → {result}")
    
    return result

def needs_context(question, conversation_context=""):
    """GPT를 사용해서 문맥이 필요한지 판단"""
    
    context_prompt = ""
    if conversation_context:
        context_prompt = f"""
[이전 대화 내용]
{conversation_context}

"""
    
    prompt = f"""{context_prompt}다음 질문이 이전 대화 내용을 참고해야 하는지 판단해주세요.

문맥이 필요한 질문의 예시:
- "가장 효과적인 방법은 뭐야?"
- "더 좋은 방법 있어?"
- "추천해줘"
- "어떤 게 제일 좋아?"
- "비용은 얼마나 들어?"
- "시간은 얼마나 걸려?"
- "주의사항은 뭐야?"
- "다른 방법도 있어?"

문맥이 필요하지 않은 질문의 예시:
- "변기 막힘 해결법"
- "후라이팬 기름때 제거"
- "화장실 곰팡이 제거"
- "새로운 질문"

현재 질문: "{question}"

위 질문이 이전 대화 내용을 참고해야 하는지 판단해서 "필요" 또는 "불필요" 중 하나로만 답변해주세요.
""".strip()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "대화 문맥 분석 전문가입니다. 질문이 이전 대화 내용을 참고해야 하는지 판단하고, '필요' 또는 '불필요' 중 하나로만 답변합니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=50
    )
    
    result = response.choices[0].message.content.strip()
    print(f"GPT 문맥 필요성 판단: {question} → {result}")
    
    return result == "필요"

def generate_contextual_answer(question, conversation_context, search_context=""):
    """문맥을 고려한 답변 생성"""
    
    # 관련 문서 부분을 별도로 처리
    docs_section = ""
    if search_context:
        docs_section = "[관련 문서]\n" + search_context
    
    prompt = f"""
[이전 대화 내용]
{conversation_context}

[현재 질문]
{question}

{docs_section}

위의 이전 대화 내용을 참고하여 현재 질문에 답변해주세요.

답변 시 고려사항:
- 이전에 언급된 내용과 연결하여 답변
- 구체적이고 실용적인 조언 제공
- 안전을 최우선으로 고려
- 단계별 설명 포함
- 필요한 도구나 재료 언급
""".strip()

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "홈케어 전문가로서 이전 대화 내용을 고려하여 현재 질문에 답변합니다."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=1024
    )
    
    result = response.choices[0].message.content.strip()
    print(f"GPT 문맥 기반 답변 생성: {question}")
    
    return result