## 🏠 HomeFix (캡스톤 디자인 프로젝트)
&emsp; 사용자의 주거 환경 문제를 진단하고 해결책을 제시하는 AI 기반 홈 케어 서비스

## 📌 Project Overview
* 개발 기간: 2025.03 - 2025.12 (졸업 작품)
* 주요 기능:
   * AI 이미지 분석을 통한 문제 진단 및 해결책 제공
   * ChatBot과의 채팅을 통한 문제 진단 및 해결책 제공
   * 필요 준비물을 위한 제품 추천 링크 제공
* **핵심 목표**: 전문가의 도움 없이도 초보자가 주거 문제를 쉽게 해결할 수 있는 플랫폼 구축


## 🛠️ Tech Stack
**Frontend**
* **Framework**: Expo (React Native)
* **State Management**: React Hooks (useState, useEffect)
* **Navigation**: React Navigation

**Backend & AI**
* **Server**: Flask (Python)
* **Database/Auth**: Firebase (Authentication, Realtime Database)
* **AI Model**: EfficientNetV2-m

## 🖥️ Preview
앱은 시각적인 결과물(GIF or 이미지)

## 🌟 Key Features & Implementation
1. AI 기반 이미지 분석
   * 사용자가 촬영한 사진을 Flask 서버로 전송하여 하자의 종류와 심각도를 분석합니다.
   * 두 단계에 걸친 문제 분류: 문제 유형 예측 모델(1개) + 문제 위치 예측 모델(7개)
2. 실시간 데이터 연동
   * Firebase를 활용하여 사용자 정보 및 진단 기록을 실시간으로 관리합니다.
3. 사용자 친화적 UI/UX
   * Expo를 활용하여 iOS와 Android 환경에서 동일한 사용자 경험을 제공하도록 설계되었습니다.
  
## ⚙️ Installation & Setup
실행에 필요한 세팅

## 📁 Project Structure
```
├── assets/             # 이미지 및 정적 자원
├── components/         # 재사용 가능한 UI 컴포넌트
├── screens/            # 각 페이지 구성 (Main, Diagnosis, Community 등)
├── App.js              # 엔트리 포인트 및 네비게이션 설정
└── app.json            # Expo 설정 파일
```

## 💡 Troubleshooting & Lessons Learned
* 이슈:
* 해결:
* 성과: 
