# Project State

## Current Status

Phase 1(암기 핵심)과 Phase 2의 JEV 제외 부분(단어장, 카드 복습, 교과서·시험 설정, 홈 D-day, 해석·메모 직접 입력)의 코드가 작성되었습니다. Phase 1 내용: 문장 분할, 빈칸 생성, 지문 등록·교정·목록·상세, 암기 화면(5단계, 모드 4종), 통과 기록. 로직은 단위 테스트로 검증했고 화면은 iOS 번들까지만 확인했습니다. 실기기(iPhone Expo Go) 확인과 실제 지문 샘플 검증은 사용자가 해야 하므로 Phase 1은 완료로 보지 않습니다. JEV(API 키) 관련 작업은 공개 저장소라는 이유로 제외되었습니다.

## Completed

- 문서 구조: CLAUDE.md, PROJECT/TASK/STATE/PLAN/CHECKLIST.md, docs/(spec, research, decisions, templates), outputs/
- `mobile/` Expo 앱 골격: TypeScript + expo-router, placeholder 화면 6개(홈·지문 목록·지문 등록·암기·단어장·설정)
- `mobile/src/db/`: 5개 테이블 스키마와 마이그레이션 (Node 내장 SQLite로 실행 검증)
- `mobile/src/lib/{sentences,cloze}`는 구현됨. `lib/review`는 `daysUntilExam`만 구현이고 `reviewDates`·`nextReviewDue`는 TODO(Phase 3). `lib/ai/jev.ts`의 `analyzeSentences`는 TODO(보류)
- 테스트 러너(jest-expo)와 문장 분할·빈칸 생성 빈 테스트 파일(todo 6건)
- 검증(Phase 0): 타입체크, `npm test`, `npx expo start`(Metro 기동 및 iOS 번들 요청 200), `expo export --platform ios`
- Phase 1 로직: `splitSentences`, `blankRatio`/`generateCloze`/채점/섞기, `daysUntilExam`, 지문 검증, 교정 편집 함수와 단위 테스트(`npm test`), 빈칸 비율·통과 규칙 결정(docs/decisions/0002)
- Phase 1 DB: `mobile/src/db/{passages,review}.ts`. Node 내장 SQLite 어댑터로 저장·교정 시 해석 이어받기·삭제 연쇄·통과 기록(MAX)·합성 지문 1~5단계 통과를 실행 검증(임시 파일, 커밋하지 않음)
- Phase 2 로직·DB: `lib/settings`, `lib/vocab`, `lib/subject.ts`, `db/vocab.ts`, `setReviewLevel` 단위 테스트(`npm test` 총 48건) 및 Node SQLite 어댑터 실행 검증(vocab 등록·중복 처리·삭제 연쇄·카드 단계)
- Phase 2 화면 코드: 단어장 탭, 단어 카드 복습, 설정, 홈 D-day, 지문 상세(단어 눌러 등록, 해석·메모 입력). `expo export --platform ios` 번들 성공, 실기기 미확인
- Phase 1 화면 코드: 지문 목록, 지문 등록(붙여넣기→문장 교정→저장), 지문 상세, 문장 교정, 암기 지문 선택, 암기(방식·단계 선택). `expo export --platform ios` 번들 성공. 순수 컴포넌트(ClozeView, SentenceEditor)는 임시 렌더 테스트로 렌더링 확인(커밋하지 않음)

## In Progress

- None

## Next

1. 실기기 확인(사용자): iPhone Expo Go로 열어 화면 동작, DB 초기화, 지문 등록→5단계 통과 확인
2. 샘플 검증(사용자): 2025 고2 9월 학평 지문 1개를 직접 등록해 5단계까지 통과(실제 지문은 저장소에 넣지 않음)
3. 실기기 확인(사용자): 단어 등록, 카드 복습, 설정 저장(kv-store), 홈 D-day, 해석·메모 저장
4. JEV 연결은 사용자 요청으로 보류 중. 재개하려면 공개 저장소에 키가 들어가지 않는 방식(사용자 입력만, 코드·문서에 값 없음)을 정하고 열린 질문 해소

## Blockers

- None

## Open Questions

- **JEV 연결 보류**: 저장소가 공개라는 이유로 사용자가 JEV 키 관련 작업 제외를 지시함.
- **JEV API 주소**: 알 수 없음. `mobile/src/lib/ai/jev.ts`의 `analyzeSentences`가 TODO로 남아 있음. (JEV 연결을 재개할 때 필요)
- **JEV 인증 방식**: 알 수 없음(헤더 키, Bearer 토큰 등 미확인).
- **JEV 응답 형식**: 알 수 없음. 현재 `JevSentenceResult`(index, ko, vocab[])는 가정한 앱 내부 타입이며 JEV 응답 형식이 아님.
- **빈칸 단계별 비율**: 선형(27.5/45/62.5%)으로 정함(docs/decisions/0002). 실제로 써 보고 어려우면 조정.
- **린트**: eslint가 승인 목록에 없어 미설정. 필요하면 사용자에게 추가 의존성 승인 요청.
- **jest**: `jest-expo`의 하위 의존성으로만 설치됨(직접 의존성 아님). 버전을 고정해야 하면 사용자 승인 필요.
- **실기기 동작**: `expo-sqlite`/`expo-secure-store`는 Node에서 실행할 수 없어 실기기에서만 확인 가능. 미확인.

## Recent Changes

- 2026-10-01: Phase 2 구현(JEV 제외): 단어장, 단어 카드 복습, 설정(kv-store), 홈 D-day, 해석·메모 직접 입력, 영어 전용 기능 제어. `lib/ai/jev.ts`와 JEV 관련 항목은 그대로 두고 PLAN에 "보류"로 표시. 새 의존성 없음.
- 2026-10-01: Phase 1 구현(로직·DB·화면). 사용자 지시로 JEV API 키·주소 관련 작업은 제외. 실기기와 샘플 검증은 미실시. 새 의존성 추가 없음.

- 2026-10-01: 최초 세팅. 이 환경에서 `docs.expo.dev`, `namu.wiki`, `mise.team`이 차단되어 Expo 공식 문서 원본(GitHub의 expo/expo docs)과 `create-expo-app --help`, npm 메타데이터로 대신 확인함. `npx expo install`도 외부 API 차단으로 실패해 SDK 권장 버전을 직접 읽어 `npm install` 사용(자세한 내용은 docs/decisions/0001-stack-and-layout.md).
- 2026-10-01: Chery 분석(docs/research/chery-analysis.md)의 수치는 README.md의 기록을 옮긴 것이며 이 세션에서 원문을 재확인하지 못함.
- 2026-10-01: git 저장소는 이미 초기화되어 있어 `git init`은 하지 않았고, 커밋도 하지 않음(요청대로).

- 2026-10-01: PLAN.md를 세부 작업 체크리스트와 단계별 완료 기준(README.md 기준)으로 구체화하고, PROJECT.md에 학습 흐름·콘텐츠 정책·확장 여지를 보강. 진도 표시는 Phase 3의 선택 항목으로 둠.

## Last Updated

2026-10-01
