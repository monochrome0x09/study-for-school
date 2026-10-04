# 0006. 웹앱(PWA)으로 호스팅해 컴퓨터 없이 쓰기

날짜: 2026-10-04

## 배경

Expo Go는 컴퓨터의 개발 서버(`expo start`)에 붙어서 실행되므로 컴퓨터를 끄면 앱이 열리지 않습니다. 사용자는 컴퓨터를 끈 상태에서도 쓰고 싶어 하고, 컴퓨터는 Windows 또는 Linux(Mac 아님)입니다. 앱스토어 배포는 하지 않는 개인용입니다.

## 선택지와 판단

- 네이티브 설치(Xcode 직접 설치): Mac이 필요해 불가.
- EAS Update로 Expo Go에 올리기: Expo Go에서의 사용이 문서로 확인되지 않음. 확인하지 못한 방법은 택하지 않음.
- 웹 빌드를 정적 호스팅하고 iPhone Safari에서 "홈 화면에 추가": 컴퓨터 불필요, 의존성 추가 없음. 사용자가 선택.

## 결정

`expo export -p web`(`npm run build:web`)으로 만든 정적 파일(`mobile/dist`, git 제외)을 무료 정적 호스팅(Netlify 또는 Cloudflare Pages)에 올려 PWA로 씁니다.

- 지문·단어·해석 데이터는 호스팅되는 파일에 들어 있지 않습니다. 사용자가 홈 화면 앱 안에서 가져오기 JSON을 붙여넣어 기기 안에만 저장합니다.
- `expo-sqlite` 웹 지원(alpha)을 위해 `metro.config.js`에 `wasm` 에셋 확장자를 추가하고, `public/_headers`로 `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`를 보냅니다(SharedArrayBuffer 필요). `public/_redirects`는 SPA 경로 대체.
- `public/index.html`, `manifest.json`, 아이콘으로 홈 화면 추가 시 전체 화면(standalone)으로 열리게 함.
- 웹에서는 `Alert.alert`가 동작하지 않아 `components/dialogs.ts`가 웹에서는 `alert`/`confirm`을 쓰도록 함.
- 웹에서 `navigator.storage.persist()`를 요청함(허용 여부는 브라우저가 정함).

## 알려진 한계

- iPhone Safari에서의 동작은 확인하지 못했습니다. 이 환경은 Chromium만 있어 Chromium에서 운영 빌드와 같은 헤더로 가져오기·새로고침 유지·타이핑·삭제 확인을 확인했습니다. COEP `require-corp` 선택도 Safari 호환 기준의 추정입니다.
- 서비스 워커가 없어 인터넷 연결이 필요합니다(오프라인 사용 불가).
- 데이터는 기기 브라우저 저장소에 있어 Expo Go의 데이터와 별개이며, Safari 탭과 홈 화면 앱의 저장소도 서로 다릅니다. 홈 화면 앱은 7일 미사용 삭제 정책에서 제외된다고 알려져 있으나 확인하지 못했습니다. 가져오기용 JSON(zip)은 백업으로 보관해야 합니다.
- Expo Go 경로는 대체 수단으로 그대로 둡니다.
