# Project State

## Current Status

Phase 1(암기 핵심)과 Phase 2의 JEV 제외 부분(단어장, 카드 복습, 교과서·시험 설정, 홈 D-day, 해석·메모 직접 입력)이 구현되었고, 사용자가 iPhone Expo Go 실기기 검증을 마쳤다고 보고했습니다(2026-10-02, 세부 항목은 기록되지 않음). 이 환경에서는 실기기를 확인할 수 없어 사용자 보고를 그대로 따릅니다. JEV(API 키) 관련 작업은 공개 저장소라는 이유로 보류 중입니다. Phase 3(지문 채우기)의 만들 수 있는 코드(복습 일정, 홈 표시, 일괄 가져오기)는 구현을 마쳤고 실기기 확인 전입니다. 교과서 1·2과 본문과 학평 12지문의 가져오기 묶음이 로컬(`docs/sources/private/import/`)에 준비되어 있습니다.

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
- Phase 3 코드(2026-10-02): 복습 일정(`reviewDates`·`nextReviewDue`)과 홈 표시, 일괄 가져오기(lib·db·화면·변환 도구). 단위·DB 테스트와 웹 하니스 확인, 실기기 미확인(자세한 내용은 Recent Changes)
- Phase 1 화면 코드: 지문 목록, 지문 등록(붙여넣기→문장 교정→저장), 지문 상세, 문장 교정, 암기 지문 선택, 암기(방식·단계 선택). `expo export --platform ios` 번들 성공. 순수 컴포넌트(ClozeView, SentenceEditor, SentenceBlock의 디바운스 저장·언마운트 저장)는 임시 렌더 테스트로 확인(커밋하지 않음). 타입 라우트(`.expo/types`)를 생성한 상태에서 `tsc` 통과

## In Progress

- None

## Next

1. 실기기 확인(사용자): 이번에 추가한 홈의 다음 복습일·남은 지문 수와 일괄 가져오기 화면(붙여넣기 속도 포함)
2. 가져오기 실행(사용자): 학평 12지문은 `docs/sources/private/import/hakpyeong/`, 교과서 21개는 `.../textbook/`의 JSON을 앱 `지문` 탭의 "JSON으로 한꺼번에 가져오기"에 붙여넣음. 클라우드 환경은 비활성 시 회수되므로 사용자가 받은 zip을 쓰는 편이 안전함
3. 교과서 손글씨·해석 추출(보류): 원본 PDF를 이 환경에서 받지 못함. 10MB 이하로 쪼갠 PDF를 Google Drive에 두거나 세션에 직접 올려 주면 쪽 이미지로 읽어 추출 가능. 사용자가 본문은 나중으로 미룸
4. 학평 해석·손필기 검수(사용자): `REVIEW.md`의 낮은 신뢰도 항목
5. JEV 연결은 사용자 요청으로 보류 중. 재개하려면 공개 저장소에 키가 들어가지 않는 방식(사용자 입력만, 코드·문서에 값 없음)을 정하고 열린 질문 해소

## Blockers

1. **교과서 손글씨·해석**: Google Drive 커넥터의 파일 다운로드는 10MB 제한이고 이 환경은 drive.google.com 직접 접속이 차단돼(403) 41MB PDF를 받지 못함. Drive의 텍스트 변환본(1~40쪽만 포함)에서는 인쇄체만 쓸 수 있고 손글씨 인식은 깨져 있음. 해소: 사용자가 PDF를 10MB 이하로 나누어 Drive에 올리거나 세션에 직접 업로드.
2. **교과서 40쪽 이후**: 변환본이 40쪽에서 끝남(1과 전체와 2과 본문까지). 시험 범위 1~2과의 읽기 본문은 모두 포함됨. 2과의 나머지(문법·쓰기 등)와 3과 이후는 없음.

## Open Questions

- **JEV 연결 보류**: 저장소가 공개라는 이유로 사용자가 JEV 키 관련 작업 제외를 지시함.
- **JEV API 주소**: 알 수 없음. `mobile/src/lib/ai/jev.ts`의 `analyzeSentences`가 TODO로 남아 있음. (JEV 연결을 재개할 때 필요)
- **JEV 인증 방식**: 알 수 없음(헤더 키, Bearer 토큰 등 미확인).
- **JEV 응답 형식**: 알 수 없음. 현재 `JevSentenceResult`(index, ko, vocab[])는 가정한 앱 내부 타입이며 JEV 응답 형식이 아님.
- **빈칸 단계별 비율**: 선형(27.5/45/62.5%)으로 정함(docs/decisions/0002). 실제로 써 보고 어려우면 조정.
- **전달받은 PDF의 지문 입력 방식**: 이미지 스캔이라 붙여넣을 텍스트가 없고 앱에는 OCR을 넣지 않기로 함(docs/decisions/0001). 영문·각주·손필기·해석은 추출해 `docs/sources/private/extracted/`에 두었음(아래 Recent Changes). 앱으로 들여오는 방식(`txt/` 붙여넣기 / JSON 일괄 가져오기 화면 신설)은 사용자 결정 필요.
- **린트**: eslint가 승인 목록에 없어 미설정. 필요하면 사용자에게 추가 의존성 승인 요청.
- **jest**: `jest-expo`의 하위 의존성으로만 설치됨(직접 의존성 아님). 버전을 고정해야 하면 사용자 승인 필요.
- **실기기 동작**: 웹 시뮬레이션 검증은 했으나 iPhone Expo Go는 미확인. 웹으로 확인할 수 없는 것: 네이티브 `expo-sqlite`/`kv-store` 동작, `Alert.alert` 대화상자(웹에서는 동작하지 않아 지문 삭제 확인창과 입력 오류 안내를 확인하지 못함), 터치·키보드 동작, iOS 레이아웃. 웹 검증 중 `SharedArrayBuffer` 헤더가 없으면 `kv-store` 쓰기가 실패했으나 iOS와는 무관한 웹 제한.

## Recent Changes

- 2026-10-02: 사용자 결정 반영(학평 41~45번 공동 지문 제외, 데이터 내보내기는 만들지 않음, 교과서 손글씨 추출은 나중으로 미룸)과 만들 수 있는 Phase 3 기능 구현. (1) 복습 일정: `lib/review`의 `reviewDates`·`nextReviewDue`·`reviewLabel`(시험일 7·3·1일 전, 복습일 당일이면 그날, 단위 테스트 15건, 일부러 `>=`를 `>`로 바꿔 테스트가 실패함을 확인), 홈에 다음 복습일과 남은 지문 수 표시. 지문별 `review.next_due`는 쓰지 않음. (2) 일괄 가져오기(`docs/decisions/0004-bulk-import.md`): `lib/importer`(묶음 검증, 오류 시 전부 거부), `db/importer.ts`(중복 지문 건너뛰기, 지문별 트랜잭션, 단어를 문장에 연결), `app/import.tsx`와 지문 탭 진입 버튼. `db/passages.ts`에서 `insertPassageRow`를 분리(동작 동일). 테스트는 importer 파서와 DB 합쳐 새로 35건, 일부러 중복 확인을 끄고 실패함을 확인. (3) 변환 도구 `docs/sources/tools/to-import-bundle.mjs`(추출 JSON → 가져오기 묶음, 연도는 `--year`로 직접 받음). 비공개 `private/import/`에 학평 12개(연도 2025는 PLAN의 계획값이며 스캔에 없음, 사용자 확인 필요)와 교과서 21개(문단 단위) 묶음을 만들고 앱의 파서로 전부 오류 0건임을 확인. 웹 하니스(Chromium, iPhone 크기)로 가져오기 흐름 18개 항목(오류 안내, 미리보기, 12개·21개 등록, 재가져오기 시 건너뜀, 상세의 해석·메모, 단어장, 홈 문구)을 조작해 확인, 콘솔 오류 0건. 한계: 실기기 미확인(특히 수십 KB JSON 붙여넣기), 중복 판단은 출처 필드만 봄, 학평 메모는 글자가 있는 손필기만 담고 밑줄·동그라미 등 표시는 넣지 않음.

- 2026-10-02: 교과서(NE능률 영어2 오선영) PDF에서 인쇄체 본문을 추출해 `docs/sources/private/textbook/`에 저장(git 제외). Drive 텍스트 변환본(PDF 1~40쪽 = 인쇄 8~47쪽)에서 읽기 지문 21개(1과 읽기 7·활동 2·문화 4, 2과 읽기 8), 각주, 쪽별 어휘 목록을 줄 범위로 잘라 정리(`textbook-ne-eng2-l1-l2.json`, `txt/` 21개). 변환본의 인쇄체는 깨끗하고 줄 번호·이스케이프를 지웠으며 앱의 `splitSentences`로 나눈 문장 수가 지문을 읽어 센 수와 일치함(각주는 별도 문장). 손글씨는 변환본의 자동 인식이 대부분 깨져 있어 판독본이 아니며 쪽별 원문만 `handwriting-ocr-raw/`에 보관(해석·주석 구조화 안 함). 한계: 사람 검수 전, 인쇄체 중 굵은 큰 제목의 일부 글자는 변환본에서 누락(본문에는 영향 없음), 본문 원본 PDF와 글자 단위 대조는 하지 못함. `docs/sources/README.md`·`FORMAT.md`에 형식과 한계를 기록. 사용자 실기기 검증 완료 보고를 PLAN.md에 반영.

- 2026-10-02: 스캔 PDF(학평 9월 19~24·29~34번, 12쪽)에서 영문 본문·각주·손필기·인쇄 해석을 추출해 `docs/sources/private/extracted/`에 저장(git 제외). 형식과 절차는 `docs/sources/FORMAT.md`, 검증·변환 도구는 `docs/sources/tools/`(추적, 지문 내용 없음). 결과: 지문 12개, 영문 본문은 서로 다른 구간으로 두 번 읽어 완전 일치, 손필기 280개(낮은 신뢰도 22개, `REVIEW.md`에 목록), 해석은 한 번 판독하고 영문 문장과 짝 맞춤(영문 문장 수 14/7/7/4/6/8/6/9/9/6/11/7, 20·22·31번은 콜론·세미콜론 때문에 해석 문장 1~2개를 묶어 짝지음). 앱의 `splitSentences`로 12개 실제 지문을 나눈 결과 모두 예상한 문장 수로 나뉘고 이상한 분할이 없었음(`①②③` 표지는 이 지문들에 인쇄된 형태로는 없었고 손필기에만 있음). 사람 검수는 아직 없음. 앱에는 이 JSON을 읽어 들이는 기능이 없어 현재는 `txt/`의 영문을 붙여넣어야 함(일괄 가져오기 화면은 제안만 함).

- 2026-10-02: 사용자가 모의고사 PDF를 전달. `docs/sources/private/hakpyeong-sep-variant-q19-34.pdf`에 복사해 두었고 이 폴더는 `.gitignore`로 제외(공개 저장소·콘텐츠 정책). 추적되는 `docs/sources/README.md`에 규칙과 파일 목록만 기록. 내용: 사용자가 직접 제작한 교재를 촬영한 스캔 12쪽, 9월 학평 19~24번·29~34번(쪽당 1지문, 제목에 '변형' 표기), 손글씨 필기·해석 포함, 이미지라 텍스트 복사 불가. 사용자 확인: '변형' 표기가 있어도 원문과 동일(원문과 대조하지는 않음). PLAN.md의 학평 18~45번 중 18, 25~28, 35~45번은 이 파일에 없음. 연도는 스캔에 적혀 있지 않음(PLAN의 2025는 계획상 값).

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

2026-10-02
