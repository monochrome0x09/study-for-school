# Project

## Overview

내신 영어 학습 앱(가칭). 나 혼자 쓰는 개인용 iPhone 앱이며 배포하지 않고 Expo Go로 실행합니다. 앱스토어/플레이스토어의 "체리(Chery)" 앱 구조를 참고합니다.

## Goal

시험일(2026-10-15)까지 교과서 1~2과와 고2 학평 독해 지문을 '붙여넣기 → 본문 분석 → 5단계 빈칸 암기 → 단어장' 흐름으로 학습합니다.

## Background

- 대상: NE능률 고2 영어 2(2022개정) 교과서 + 고2 학력평가(듣기 제외, 독해 18~45번) 지문.
- Chery는 영어 본문을 제공하지 않아 직접 입력해야 하고 완전 빈칸 모드가 없다는 빈틈이 있습니다. 자세한 내용은 `docs/research/chery-analysis.md`.
- 일정: 1~2일 안에 1단계(MVP)를 완성하고, 이후 약 11일은 직접 사용하며 지문 입력과 보정을 합니다.
- AI: 보유한 JEV API 하나뿐입니다. 우회로 연결한 GPT 서버는 성능이 낮아 사용하지 않습니다.

### 학습 흐름

지문 하나를 '등록 → 분석 → 암기 → 복습' 순으로 돌립니다. 교과서와 학력평가는 시작 화면만 다릅니다.

- 교과서(NE능률 고2 영어 2): Lesson 선택·시험일 입력 → 지문 붙여넣기와 문장 교정 → JEV 해석·어휘 초안을 만들고 내가 수정 → 빈칸 암기 1~5단계 통과 → 10/8·10/12·10/14(시험 7일·3일·1일 전)에 지문과 단어 재암기
- 학력평가(듣기 제외, 샘플 2025 고2 9월): 회차 생성 후 독해 문항 번호별로 지문 붙여넣기 → 샘플 지문 1개로 분석·암기를 끝까지 돌려 앱 검증 → 이후 나머지 번호 추가

## Core Questions

- None

## Scope

### Included

- 지문 등록(붙여넣기 + 문장 단위 교정), 교과서·시험 설정(D-day), 학평 회차 등록
- 5단계 빈칸 암기(힌트 없음·첫글자·직접 타이핑·문장 순서 맞추기)
- JEV 기반 본문 분석(문장별 해석·핵심 어휘 초안, 내가 수정), 단어장
- 진도 표시(2단계, 이후)

기능·데이터 모델의 정본은 `docs/spec.md`.

### Excluded

- 문제 풀이, 실전 모드, 변형 문제, 오답 노트
- 서버, 계정/동기화, 사진 OCR, 필기
- 한국사 등 암기 과목(지금은 구현하지 않고 구조만 막지 않음)

## Constraints

- 시험 범위: 교과서 1~2과. 시험일: 2026-10-15. 샘플 지문: 2025 고2 9월 학평.
- 개인용·비배포. 사용자가 직접 등록한 지문만 처리하고 자기 기기에만 저장합니다.
- AI는 JEV API만 사용하며 호출 코드는 `mobile/src/lib/ai/jev.ts` 한 파일에 모읍니다. API 키는 기기에만 저장합니다.
- 화면 문구에 '영어'를 하드코딩하지 않습니다. 영어 전용 기능은 subject가 영어일 때만 노출합니다.
- 콘텐츠: 사용자가 직접 등록한 지문만 처리하고 자기 기기에만 저장합니다. 본문·문제를 앱에 미리 넣어 배포하지 않습니다.
- AI가 만든 해석·어휘 초안은 틀릴 수 있으므로 사용자가 검수해 확정합니다.
- 앱을 타인에게 공개하거나 판매하게 되면 교과서 출판사와 시험 출제 기관의 이용 조건을 미리 확인해야 합니다(법률 자문이 아니며 출시 전 확인 필요).

## Development

### Stack

- 언어/런타임: TypeScript, Node.js (React Native / Expo Go)
- 프레임워크/주요 라이브러리: Expo, expo-router, expo-sqlite, expo-secure-store, jest-expo
- 패키지 매니저: npm

### Commands

모든 명령은 `mobile/`에서 실행합니다.

| 용도 | 명령 |
| --- | --- |
| 설치 | `npm install` |
| 실행 | `npx expo start` (iPhone의 Expo Go로 접속) |
| 테스트 | `npm test` |
| 타입체크 | `npm run typecheck` |
| 린트/포맷 | TBD (eslint 미설정) |
| 빌드 | 없음 (Expo Go 사용, 배포하지 않음) |

완료 전 검증에는 위 테스트와 타입체크 명령을 사용합니다.

### Code Structure

```
/                      문서 구조(AGENTS.md, PROJECT/TASK/STATE/PLAN/CHECKLIST.md)
docs/                  정본·근거 (spec.md, research/, decisions/, templates/)
outputs/               최종 산출물 (앱 코드 아님)
mobile/                Expo 앱 (코드는 전부 여기)
  src/app/             expo-router 화면 (홈·지문 목록·지문 등록·암기·단어장·설정)
  src/db/              스키마와 마이그레이션
  src/lib/sentences/   문장 분할
  src/lib/cloze/       빈칸 생성
  src/lib/review/      복습 일정
  src/lib/ai/jev.ts    JEV API 호출 (한 파일)
```

### Git Conventions

- 브랜치 규칙: TBD
- 커밋 메시지 규칙: TBD
- git 저장소 초기화 여부: 완료

## Success Criteria

- 시험 범위(교과서 1~2과)의 지문이 모두 앱에 등록되고 5단계까지 통과합니다.
- 2025 고2 9월 학평 지문 1개로 등록 → 암기 5단계까지 앱이 끝까지 동작합니다.

## Deliverables

- iPhone Expo Go에서 실행되는 앱(`mobile/`)
- 정본·근거 문서(`docs/`)

## Important Decisions

- 앱 코드는 `mobile/`, Expo + TypeScript + expo-router + expo-sqlite, 서버 없음, 사진 OCR 제외 — `docs/decisions/0001-stack-and-layout.md`

## Notes

- 기획 원본: `README.md`
- 확장 여지(한국사 등 암기 과목): 지금은 영어만 만들되 구조를 막지 않기 위해 세 가지를 지킵니다.
  - passage에 subject 필드(기본값 영어)를 두고 화면 문구에 '영어'를 고정해 쓰지 않습니다.
  - 빈칸 암기·D-day·복습 일정은 텍스트가 있으면 어떤 과목에도 쓰이게 만들고, 문장 해석·단어장처럼 영어에만 필요한 기능은 subject가 영어일 때만 보여줍니다.
  - 한국사 같은 과목은 나중에 중요 용어를 직접 표시해 가리는 '키워드 빈칸'과 연표 순서 맞추기를 더하면 됩니다.
