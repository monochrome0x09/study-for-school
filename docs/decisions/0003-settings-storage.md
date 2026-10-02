# 0003. 교과서·시험 설정의 저장 위치

- 상태: 확정
- 날짜: 2026-10-01

## 결정

교과서 이름, 시험 범위, 시험일은 SQLite 테이블이 아니라 `expo-sqlite`에 포함된 키-값 저장소(`expo-sqlite/kv-store`)에 JSON 하나(`study.settings`)로 저장한다. 읽기·쓰기 코드는 `mobile/src/lib/settings/storage.ts`, 형식·검증은 `mobile/src/lib/settings/index.ts`다. 저장된 값이 없거나 깨졌으면 기본값(NE능률 고2 영어 2, 1~2과, 2026-10-15)을 쓴다.

## 이유와 기각한 대안

- 5개 테이블(`docs/spec.md` §2)을 유지하기 위함. 설정 테이블을 새로 만들면 스키마 정본과 마이그레이션을 바꿔야 한다. 기각: 6번째 테이블.
- `expo-sqlite/kv-store`는 승인된 의존성(`expo-sqlite`) 안에 있어 새 외부 패키지가 필요 없다. 기각: AsyncStorage(새 의존성, 승인 필요).
- `expo-secure-store`는 키 같은 비밀 값용이라 일반 설정에는 쓰지 않는다.

## 한계

- kv-store의 읽기·쓰기는 Node/jest에서 실행할 수 없어 실기기에서만 확인할 수 있다(미확인). 형식 처리(`parseSettings` 등)는 단위 테스트로 검증했다.
