# 0001. 스택과 디렉터리 구조

- 상태: 확정
- 날짜: 2026-10-01

## 결정

1. 앱 코드는 `mobile/`에 둔다. 루트의 md 구조(PROJECT/TASK/STATE/PLAN/CHECKLIST, `docs/`)와 분리한다. `outputs/`는 앱 코드가 아닌 최종 산출물용이다.
2. Expo(React Native) + TypeScript, expo-router, 저장소는 expo-sqlite, 서버는 두지 않는다.
3. 사진 OCR 네이티브 모듈은 제외한다.

## 이유와 기각한 대안

- **`mobile/` 분리**: 앱의 `package.json`·`node_modules`와 문서를 섞지 않기 위함. 기각: 루트에 앱 생성(문서 구조와 충돌), `outputs/`에 앱 코드(산출물 용도와 다름).
- **Expo + TypeScript**: 배포 없이 iPhone의 Expo Go로 바로 실행·수정할 수 있어 1~2일 일정에 맞음. 기각: 네이티브(Swift) 앱(개발 시간, Xcode 필요), PWA(기기 내 저장·설정 화면 구성이 불리).
- **expo-router**: Expo 기본 템플릿의 파일 기반 라우팅이라 화면 추가가 쉬움. 기각: 직접 react-navigation 구성(보일러플레이트 증가).
- **expo-sqlite**: 5개 테이블을 그대로 쓰고 오프라인에서 동작. 기각: AsyncStorage(관계형 조회가 불편), 원격 DB(서버·계정이 범위 밖).
- **서버 없음**: 개인용이고 계정/동기화가 범위 밖. 기각: 자체 서버, BaaS.
- **사진 OCR 제외**: 네이티브 모듈은 Expo Go에서 쓰기 어렵다. 대신 iPhone의 사진 속 텍스트 복사 후 붙여넣기. 기각: 개발 빌드(dev client) 전환(일정 부담).

## 구현 중 확인한 사항 (2026-10-01)

- `docs.expo.dev`가 이 환경에서 차단되어, 공식 문서 원본(`expo/expo` 저장소의 docs)과 `create-expo-app --help`, npm 메타데이터로 확인했다. 프로젝트 생성은 `npx create-expo-app@latest mobile --no-agents-md`(기본 템플릿 = TypeScript + expo-router)를 썼고, 예제 코드는 템플릿의 `reset-project` 스크립트로 제거했다. `--no-agents-md`는 루트 AGENTS.md와 겹치지 않게 하기 위함이다.
- Expo의 호환성 API도 차단되어 `npx expo install`이 실패했다. 그래서 `expo` 패키지에 들어 있는 SDK 권장 버전(`bundledNativeModules.json`)을 읽어 `npm install`로 설치했다: `expo-sqlite ~57.0.3`, `expo-secure-store ~57.0.4`, `jest-expo ~57.0.5`. `@types/jest`는 jest 29 계열(`^29`)로 맞췄다.
- 테스트 러너 `jest`는 직접 의존성이 아니라 `jest-expo`의 하위 의존성으로 설치된다. 이후 `jest` 버전을 직접 고정해야 하면 사용자 승인이 필요하다.
- TypeScript 6은 `@types/*`를 자동 포함하지 않아 `tsconfig.json`에 `"types": ["jest"]`를 추가했다.
- `expo lint`는 eslint가 승인 목록에 없어 설정하지 않았고 `lint` 스크립트를 제거했다.
- 빈칸 단계별 비율의 중간값(2~4단계)은 Phase 1에서 `0002-cloze-ratio-and-pass-rules.md`로 정했다.
