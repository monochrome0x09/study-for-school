# Project State

## Current Status

세팅 단계(Phase 0)가 끝났고 PLAN.md Phase 1(암기 핵심)을 시작할 수 있습니다. `mobile/`에 Expo 앱 골격(placeholder 화면 6개, SQLite 스키마, lib 시그니처, 테스트 러너)이 있고 기능은 구현되지 않았습니다. 실기기(iPhone Expo Go) 확인은 아직 하지 않았습니다.

## Completed

- 문서 구조: CLAUDE.md, PROJECT/TASK/STATE/PLAN/CHECKLIST.md, docs/(spec, research, decisions, templates), outputs/
- `mobile/` Expo 앱 골격: TypeScript + expo-router, placeholder 화면 6개(홈·지문 목록·지문 등록·암기·단어장·설정)
- `mobile/src/db/`: 5개 테이블 스키마와 마이그레이션 (Node 내장 SQLite로 실행 검증)
- `mobile/src/lib/{sentences,cloze,review,ai}`: 시그니처와 타입만(본문 TODO)
- 테스트 러너(jest-expo)와 문장 분할·빈칸 생성 빈 테스트 파일(todo 6건)
- 검증: 타입체크, `npm test`, `npx expo start`(Metro 기동 및 iOS 번들 요청 200), `expo export --platform ios`

## In Progress

- None

## Next

1. 실기기 확인(사용자): iPhone Expo Go로 열어 6개 화면과 DB 초기화 확인
2. Phase 1: 지문 등록, 문장 분할(`lib/sentences`), 빈칸 암기 5단계(`lib/cloze`)
3. JEV 연결 전에 아래 열린 질문 해결(Phase 2)

## Blockers

- None

## Open Questions

- **JEV API 주소**: 알 수 없음. `mobile/src/lib/ai/jev.ts`의 `analyzeSentences`가 TODO로 남아 있음. (2일차 JEV 연결 전에 필요)
- **JEV 인증 방식**: 알 수 없음(헤더 키, Bearer 토큰 등 미확인).
- **JEV 응답 형식**: 알 수 없음. 현재 `JevSentenceResult`(index, ko, vocab[])는 가정한 앱 내부 타입이며 JEV 응답 형식이 아님.
- **빈칸 단계별 비율 중간값(2~4단계)**: 구현 시 정해 `docs/decisions/`에 기록.
- **린트**: eslint가 승인 목록에 없어 미설정. 필요하면 사용자에게 추가 의존성 승인 요청.
- **jest**: `jest-expo`의 하위 의존성으로만 설치됨(직접 의존성 아님). 버전을 고정해야 하면 사용자 승인 필요.
- **실기기 동작**: `expo-sqlite`/`expo-secure-store`는 Node에서 실행할 수 없어 실기기에서만 확인 가능. 미확인.

## Recent Changes

- 2026-10-01: 최초 세팅. 이 환경에서 `docs.expo.dev`, `namu.wiki`, `mise.team`이 차단되어 Expo 공식 문서 원본(GitHub의 expo/expo docs)과 `create-expo-app --help`, npm 메타데이터로 대신 확인함. `npx expo install`도 외부 API 차단으로 실패해 SDK 권장 버전을 직접 읽어 `npm install` 사용(자세한 내용은 docs/decisions/0001-stack-and-layout.md).
- 2026-10-01: Chery 분석(docs/research/chery-analysis.md)의 수치는 README.md의 기록을 옮긴 것이며 이 세션에서 원문을 재확인하지 못함.
- 2026-10-01: git 저장소는 이미 초기화되어 있어 `git init`은 하지 않았고, 커밋도 하지 않음(요청대로).

## Last Updated

2026-10-01
