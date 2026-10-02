# 기능 명세·데이터 모델·기술 구성 (정본)

이 문서는 앱의 기능, 데이터 모델, 기술 규칙의 정본입니다. 기획 배경은 `README.md`, 결정의 이유는 `docs/decisions/`를 봅니다.

## 1. 기능

단계 1이 이번 MVP이고 단계 2는 이후입니다.

| 기능 | 내용 | 대상 | 단계 |
| --- | --- | --- | --- |
| 지문 등록 | 텍스트 붙여넣기 + 문장 단위 교정. 사진 속 글자는 iPhone에서 복사해 붙여넣기 | 공통 | 1 |
| 교과서·시험 설정 | NE능률 고2 영어 2(2022개정), 범위 1~2과, 시험일 D-day | 교과서 | 1 |
| 학평 회차 | 연도·월 회차, 독해 문항(18~45번)의 지문을 번호별로 등록. 듣기 제외 | 학평 | 1 |
| 빈칸 암기 | 5단계 난이도. 힌트 없음·첫글자·직접 타이핑·문장 순서 맞추기 모드 | 공통 | 1 |
| 본문 분석 | JEV로 문장별 해석·핵심 어휘 초안을 만들고 내가 수정 | 공통 | 1 |
| 단어장 | 지문에서 단어를 눌러 등록, 카드 복습 | 공통 | 1 |
| 진도 표시 | 지문별 암기 단계, 남은 지문 수 | 공통 | 2 |

제외: 문제 풀이, 실전 모드, 변형 문제, 오답 노트, 서버, 계정/동기화, 사진 OCR, 필기.

## 2. 데이터 모델 (SQLite 5개 테이블)

스키마의 실제 정의는 `mobile/src/db/migrations.ts`, 행 타입은 `mobile/src/db/types.ts`입니다.

| 테이블 | 필드 | 비고 |
| --- | --- | --- |
| passage | id, subject(기본 '영어'), track(교과서/학평), 출처 메타(학교·교과서·단원 또는 연도·월·문항 번호), 원문 | 학습의 단위 |
| sentence | passage_id, order, en, ko, note | `order`는 SQLite 예약어라 컬럼명은 `ord` |
| vocab | word, meaning, passage_id, sentence_id | |
| question | passage_id, type, stem, choices, answer, explanation, tag | 이번 계획에서는 사용하지 않음. 스키마만 유지 |
| review | item_type, item_id, level(1~5), next_due | 단일 사용자 전제라 user_id 없음 |

구현 시 정한 컬럼 구성(출처 메타는 `source_school`, `source_book`, `source_unit`, `source_year`, `source_month`, `source_number`로 나눔, 원문은 `body`)은 `migrations.ts`를 기준으로 합니다.

AI 결과의 캐시는 별도 테이블을 만들지 않고 `sentence.ko`, `sentence.note`, `vocab`에 저장합니다(5개 테이블 유지).

## 3. 기술 규칙

- **스택**: Expo(React Native) + TypeScript, expo-router, expo-sqlite, 서버 없음. 코드는 `mobile/`에 둡니다. 근거: `docs/decisions/0001-stack-and-layout.md`.
- **문장 분할**: 규칙 기반(마침표, 약어 예외) + 사용자 교정. (`mobile/src/lib/sentences/`)
- **빈칸 생성**: 단계별 빈칸 비율은 1단계 10% → 5단계 80%이고 중간값과 통과 규칙은 `docs/decisions/0002-cloze-ratio-and-pass-rules.md`에 있습니다. 내용어를 우선하고, 지문별 고정 시드로 같은 지문은 같은 빈칸이 나옵니다. (`mobile/src/lib/cloze/`)
- **설정 저장**: 교과서·시험 범위·시험일은 테이블이 아니라 `expo-sqlite/kv-store`에 저장합니다. 근거: `docs/decisions/0003-settings-storage.md`.
- **복습 일정**: 시험일 기준 7일 전·3일 전·1일 전(시험일 10/15 → 10/8, 10/12, 10/14). (`mobile/src/lib/review/`)
- **AI 호출**: 코드는 파일 하나(`mobile/src/lib/ai/jev.ts`)에 모읍니다. 설정 화면에서 주소와 키를 입력받고, 키는 기기에만 저장(expo-secure-store)합니다. 결과는 SQLite에 캐시합니다. JEV의 실제 주소·인증 방식·응답 형식은 아직 확인되지 않았고, 저장소가 공개라는 이유로 연결 작업은 사용자 요청에 따라 보류 중입니다(`STATE.md` 열린 질문). 그동안 문장 해석·메모는 직접 입력합니다.
- **과목 확장 여지**: 화면 문구에 '영어'를 하드코딩하지 않습니다. 영어 전용 기능(문장 해석, 단어장)은 `passage.subject`가 영어일 때만 노출합니다. 한국사 등 암기 과목은 지금 구현하지 않고 구조만 막지 않습니다.

## 4. 화면

| 화면 | 라우트 파일 |
| --- | --- |
| 홈(D-day, 지문·통과 현황) | `mobile/src/app/(tabs)/index.tsx` |
| 지문 목록 | `mobile/src/app/(tabs)/passages.tsx` |
| 지문 등록(붙여넣기 → 문장 교정 → 저장) | `mobile/src/app/passage-new.tsx` |
| 지문 상세(문장, 단어 눌러 등록, 해석·메모 직접 입력) | `mobile/src/app/passage/[id].tsx` |
| 문장 교정(저장된 지문) | `mobile/src/app/passage-edit/[id].tsx` |
| 암기 지문 선택 | `mobile/src/app/(tabs)/memorize.tsx` |
| 암기(방식·단계 선택 후 진행) | `mobile/src/app/practice/[id].tsx` |
| 단어장(목록·수정·삭제) | `mobile/src/app/(tabs)/vocab.tsx` |
| 단어 카드 복습 | `mobile/src/app/vocab-review/index.tsx` |
| 설정(교과서·범위·시험일. JEV 항목은 보류) | `mobile/src/app/(tabs)/settings.tsx` |
