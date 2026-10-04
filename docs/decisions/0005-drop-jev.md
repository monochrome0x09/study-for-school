# 0005. JEV 연결을 하지 않는다

- 상태: 확정
- 날짜: 2026-10-04

## 결정

앱에서 JEV API로 문장별 해석·핵심 어휘 초안을 만드는 계획을 접는다. 해석·메모·단어는 가져오기 묶음(docs/decisions/0004)이나 직접 입력으로 넣는다. `mobile/src/lib/ai/jev.ts`(키 읽기와 `analyzeSentences` TODO 스텁)는 어디서도 쓰이지 않는 채로 둔다.

## 이유

- 사용자가 가진 JEV는 OpenRouter에서 받은 것이라고 확인함(2026-10-04). OpenRouter 문서([Jev 안내](https://openrouter.ai/docs/guides/community/jev))에 따르면 이 Jev는 TypeSafe의 구조화된 판단 모델로 선택·참/거짓·점수를 확률로 돌려주며 "does not produce reasoning traces, explanations, or free-form text. It is not a drop-in replacement for a chat model"이라고 한다.
- 따라서 이 앱이 맡기려던 문장별 한국어 해석과 어휘 초안(자유 문장 생성)은 이 모델로 만들 수 없다.
- 시험이 2026-10-15라서 다른 AI 서비스를 새로 붙이는 일보다, 이미 준비한 지문 44개(공식 해설의 해석, 손필기, AI 분석)로 암기하는 일이 낫다. 우회 GPT 서버는 성능이 낮아 쓰지 않기로 했었다(PROJECT.md).

## 영향

- PLAN.md의 JEV 항목 세 개(주소 확보, 설정 화면의 주소·키 입력, `analyzeSentences` 구현)는 취소로 표시한다.
- `expo-secure-store` 의존성과 `lib/ai/jev.ts`는 지우지 않았다(파일 삭제와 의존성 변경은 사용자 확인이 필요한 변경). 필요 없다고 확인되면 함께 지운다.
- 나중에 해석을 자동으로 만들고 싶으면 자유 문장을 생성하는 모델(OpenRouter의 챗 모델 등)이 필요하다. 그때는 키를 기기 SecureStore에만 저장하는 방식(저장소·번들·`EXPO_PUBLIC_` 환경변수에 넣지 않음)으로 새로 결정한다.
