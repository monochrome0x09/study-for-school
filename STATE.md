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
- Phase 1 DB: `mobile/src/db/{passages,sentences,review}.ts`. 저장·교정 시 해석 이어받기·삭제 연쇄·통과 기록(MAX)은 `src/db/__tests__/`의 테스트(Node 내장 SQLite 어댑터 `db/testing/nodeSqlite.ts`)로 검증
- Phase 2 로직·DB: `lib/settings`, `lib/vocab`, `lib/subject.ts`, `db/vocab.ts`, `setReviewLevel` 단위 테스트(vocab 등록·중복 처리·삭제 연쇄·카드 단계는 `db/__tests__/vocab.test.ts`)
- Phase 2 화면 코드: 단어장 탭, 단어 카드 복습, 설정, 홈 D-day, 지문 상세(단어 눌러 등록, 해석·메모 입력). `expo export --platform ios` 번들 성공, 실기기 미확인
- Phase 1 화면 코드: 지문 목록, 지문 등록(붙여넣기→문장 교정→저장), 지문 상세, 문장 교정, 암기 지문 선택, 암기(방식·단계 선택). `expo export --platform ios` 번들 성공. 순수 컴포넌트(ClozeView, SentenceEditor, SentenceBlock의 디바운스 저장·언마운트 저장)는 임시 렌더 테스트로 확인(커밋하지 않음). 타입 라우트(`.expo/types`)를 생성한 상태에서 `tsc` 통과

## In Progress

- None

## Next

1. 실기기 확인(사용자): iPhone Expo Go로 열어 화면 동작, DB 초기화, 지문 등록→5단계 통과 확인
2. 샘플 검증(사용자): 2025 고2 9월 학평 지문 1개를 직접 등록해 5단계까지 통과(실제 지문은 저장소에 넣지 않음)
3. 실기기 확인(사용자): 단어 등록, 카드 복습, 설정 저장(kv-store), 홈 D-day, 해석·메모 저장
4. JEV 연결은 사용자 요청으로 보류 중. 재개하려면 공개 저장소에 키가 들어가지 않는 방식(사용자 입력만, 코드·문서에 값 없음)을 정하고 열린 질문 해소

## Blockers

Phase 3(지문 채우기)을 시작하려면 사용자가 해결해야 하는 외부 조건(2026-10-02 조사). 코드로 풀 수 없는 것만 적음.

1. **앱을 iPhone에서 실제로 실행**(사용자가 직접 테스트할 컴퓨터가 있다고 확인함, 2026-10-02): 개발 서버(`npx expo start`)를 iPhone이 닿는 컴퓨터에서 돌려야 함(이 클라우드 환경은 iPhone이 접속할 수 없음). 필요: Node `^20.19.4 || ^22.13.0 || ^24.3.0`(react-native 0.86 요구, 확인함), 저장소 가져오기(PR #1 병합 또는 `claude/hopeful-mccarthy-k7n4gi` 체크아웃), `cd mobile && npm install`, iPhone과 같은 네트워크(또는 터널). 미확인: App Store의 Expo Go가 이 프로젝트의 SDK 57을 지원하는지, 서버를 꺼도 앱을 쓸 수 있는지(Expo Go는 개발 서버에서 번들을 받는 방식으로 알고 있으나 확인하지 못함).
2. **Phase 1·2 실기기 확인과 샘플 검증**: 아직 아무도 iPhone에서 앱을 열어 보지 않음. 문제가 있으면 Phase 3 입력 전에 고쳐야 함.
3. **지문 원문**: 교과서 1·2과와 2025 고2 9월 학평 18~45번의 본문은 저장소에 넣을 수 없어(공개 저장소, 콘텐츠 정책) 사용자가 기기에서 직접 붙여넣어야 함.

## Open Questions

- **JEV 연결 보류**: 저장소가 공개라는 이유로 사용자가 JEV 키 관련 작업 제외를 지시함.
- **JEV API 주소**: 알 수 없음. `mobile/src/lib/ai/jev.ts`의 `analyzeSentences`가 TODO로 남아 있음. (JEV 연결을 재개할 때 필요)
- **JEV 인증 방식**: 알 수 없음(헤더 키, Bearer 토큰 등 미확인).
- **JEV 응답 형식**: 알 수 없음. 현재 `JevSentenceResult`(index, ko, vocab[])는 가정한 앱 내부 타입이며 JEV 응답 형식이 아님.
- **빈칸 단계별 비율**: 선형(27.5/45/62.5%)으로 정함(docs/decisions/0002). 실제로 써 보고 어려우면 조정.
- **린트**: eslint가 승인 목록에 없어 미설정. 필요하면 사용자에게 추가 의존성 승인 요청.
- **jest**: `jest-expo`의 하위 의존성으로만 설치됨(직접 의존성 아님). 버전을 고정해야 하면 사용자 승인 필요.
- **실기기 동작**: 웹 시뮬레이션 검증은 했으나 iPhone Expo Go는 미확인. 웹으로 확인할 수 없는 것: 네이티브 `expo-sqlite`/`kv-store` 동작, `Alert.alert` 대화상자(웹에서는 동작하지 않아 지문 삭제 확인창과 입력 오류 안내를 확인하지 못함), 터치·키보드 동작, iOS 레이아웃. 웹 검증 중 `SharedArrayBuffer` 헤더가 없으면 `kv-store` 쓰기가 실패했으나 iOS와는 무관한 웹 제한.

## Recent Changes

- 2026-10-02: 문장 분할 수정(사용자 승인). `①~⑳` 원문자 표지로 시작하는 문장이 앞 문장에 붙지 않고 나뉘며(표지 글자는 그대로 둠), `*`로 시작하는 줄(각주)은 앞 문장에 붙지 않고 별도 문장으로 나뉨(삭제는 교정 화면에서). 수정 전 코드에서 새 테스트 3건이 실패함을 확인한 뒤 수정, 전체 80건 통과. 알려진 한계는 그대로: `U.S. Then`처럼 약어로 끝나는 문장은 나뉘지 않음. 실제 학평 지문으로는 아직 확인하지 못함.

- 2026-10-02: 사용자 승인(`@types/node`만)으로 devDependency `@types/node@^22` 추가(이미 jest 하위 의존성으로 26 버전이 설치돼 있었고 Node 22에 맞춰 직접 의존성으로 고정). `src/db/__tests__/`에 DB 테스트 22건과 `src/db/testing/nodeSqlite.ts` 어댑터를 커밋(전체 75건). Node 타입 참조는 어댑터 파일에만 둠. 코드를 일부러 깨뜨려(삭제 연쇄 누락, MAX 제거, 해석 이어받기 제거) 테스트가 실패함을 확인. `react-test-renderer`·컴포넌트 렌더 테스트는 추가하지 않음(승인 없음, 사용 중단 예고 때문에 보류). 한계: 어댑터는 `expo-sqlite` 네이티브와 같지 않으므로 실기기 검증을 대체하지 않음. `node:sqlite`는 실험 기능이라 실행 시 경고가 나옴.

- 2026-10-02: 동작 보존 리팩터링. (1) `lib/cloze`를 generate·grade·ratio·words·hints·order로 나누고 시드 난수·토큰 분리를 `lib/random.ts`·`lib/text.ts`로 이동(vocab이 cloze를 가져오던 역방향 의존 제거), (2) 1~5 단계 타입을 `lib/level.ts`의 `Level` 하나로 통일, (3) `practice/[id].tsx`(316줄)를 `components/practice/`로 분리, (4) 공통 `TextField`와 `components/dialogs.ts`로 입력칸 스타일·알림창 중복 제거, (5) `db/passages.ts`에서 `db/sentences.ts`·`db/util.ts` 분리, (6) 기본 과목 상수화, 미사용 `Placeholder` 삭제, (7) PROJECT.md 코드 구조 갱신. 시드 고정 출력(빈칸·섞기·카드 순서) 전후 동일 확인, 웹 하니스 36개 항목 재통과. 오류 알림 문구는 `Error: ` 접두어 없이 메시지만 표시(경미한 변경).

- 2026-10-02: 실기기 대신 웹 빌드(react-native-web + expo-sqlite의 wa-sqlite, Chromium, iPhone 크기·KST)로 화면 흐름을 Playwright로 실제 조작해 검증(임시 설정, 커밋하지 않음). 28+7개 항목 통과(지문 등록·문장 합치기·교정, 타이핑 1~5단계 통과 기록, 힌트 없음·첫글자 자기확인, 문장 순서 정오 판정, 단어 등록·카드 복습, 해석 입력 후 새로고침 유지, 설정 변경 후 D-day, 목록 5단계 표시), 콘솔 오류 0건. 이 과정에서 두 가지를 고침: 타이핑 입력칸 너비를 `minWidth`→`width`로(웹에서 과도하게 넓어짐), 문장 교정 후 지문 상세에 이전 해석이 남던 문제(문장 id 재사용 → `SentenceBlock` key에 문장 내용 포함).

- 2026-10-01: 빈칸 후보에서 한 글자 토큰((A)·(B) 표지, a, I) 제외(docs/decisions/0002 반영). 학평 지문의 각주 풀이(`* word: 뜻`)는 문장으로 나뉘므로 교정 화면에서 삭제해야 함.
- 2026-10-01: Phase 2 구현(JEV 제외): 단어장, 단어 카드 복습, 설정(kv-store), 홈 D-day, 해석·메모 직접 입력, 영어 전용 기능 제어. `lib/ai/jev.ts`와 JEV 관련 항목은 그대로 두고 PLAN에 "보류"로 표시. 새 의존성 없음.
- 2026-10-01: Phase 1 구현(로직·DB·화면). 사용자 지시로 JEV API 키·주소 관련 작업은 제외. 실기기와 샘플 검증은 미실시. 새 의존성 추가 없음.

- 2026-10-01: 최초 세팅. 이 환경에서 `docs.expo.dev`, `namu.wiki`, `mise.team`이 차단되어 Expo 공식 문서 원본(GitHub의 expo/expo docs)과 `create-expo-app --help`, npm 메타데이터로 대신 확인함. `npx expo install`도 외부 API 차단으로 실패해 SDK 권장 버전을 직접 읽어 `npm install` 사용(자세한 내용은 docs/decisions/0001-stack-and-layout.md).
- 2026-10-01: Chery 분석(docs/research/chery-analysis.md)의 수치는 README.md의 기록을 옮긴 것이며 이 세션에서 원문을 재확인하지 못함.
- 2026-10-01: git 저장소는 이미 초기화되어 있어 `git init`은 하지 않았고, 커밋도 하지 않음(요청대로).

- 2026-10-01: PLAN.md를 세부 작업 체크리스트와 단계별 완료 기준(README.md 기준)으로 구체화하고, PROJECT.md에 학습 흐름·콘텐츠 정책·확장 여지를 보강. 진도 표시는 Phase 3의 선택 항목으로 둠.

## Last Updated

2026-10-01
