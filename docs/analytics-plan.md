# Analytics(PostHog + GA4) 삽입 계획

> 상태: **설계 문서 / 미구현**. 나중에 작업하기 위해 보존. 구현 시점에 프로덕션 도메인 / GA4 Measurement ID /
> PostHog API key·region을 채워 넣으면 됨.

## Context

이 저장소는 **MPA(멀티 페이지)** 정적 사이트다. 각 도구는 별도의 완전한 HTML 페이지(`app/<slug>.html`)이고,
랜딩(`index.html`)에서 도구로 이동하는 것은 **다른 파일로의 실제 브라우저 내비게이션**이다. SPA가 아니다.

따라서 **`index.html`에만 analytics를 넣으면 랜딩 페이지뷰만 잡히고, 실제 제품인 도구 사용은 전부 누락**된다.
필요한 것은 "모든 페이지에서 실행되는 코드"이고, 이 프로젝트에서 그 단일 지점은 **`app/shared.js`** 다.
(확인됨: `index.html` + 4개 도구 = 5개 HTML 전부 `<script src=".../shared.js">`를 로드. 기존 analytics 없음.)

**결론: analytics는 `shared.js` 한 곳에 넣는다.** 그러면 기존 도구 전부 + 앞으로 추가되는 모든 도구가
별도 작업 없이 자동 추적된다 — "도구 하나 = 파일 하나, 보일러플레이트 0" 철학과 일치.

핵심 제약: `shared.js`는 의도적으로 `file://`(더블클릭)에서도 로드되고, 저장소는 오픈소스라 누구나 포크해
자기 도메인에 올린다. 무조건 실행하면 (1) `file://`·localhost에서 쓰레기 이벤트/오류, (2) 포크 트래픽이
내 대시보드로 유입, (3) 내 추적 ID가 남의 배포에서 동작. → **hostname 화이트리스트로 가드**한다.

설계 결정: **프라이버시 경량**(쿠키리스/최소 수집, 동의 배너 없음), **CDN 버전 고정** 로딩.

## 변경 대상

단일 파일: **`app/shared.js`**. (다른 HTML·도구 파일은 수정 불필요.)

`index.html`/도구 HTML에 인라인 디자인 시스템처럼 analytics 스니펫을 중복 삽입하지 **않는다** —
`shared.js`가 유일한 공유 JS이므로 거기 한 번이면 충분하고 중복은 유지보수 부담만 늘린다.

## 구현

`app/shared.js` 상단, `applyTheme(getTheme());`(현재 42행) 직후에 self-contained `initAnalytics()` 블록 추가.
(이 스크립트는 `<head>`에서 동기 실행되므로 페이지 로드 즉시 발화.) 전체를 `try/catch`로 감싸 어떤 경우에도
도구 동작을 깨지 않게 한다.

### 1) hostname 가드 (데이터 위생)

```js
// 프로덕션 도메인에서만 발화 — file://, localhost, 포크는 자동 제외.
const ANALYTICS_HOSTS = ["<프로덕션 도메인>", "www.<프로덕션 도메인>"]; // ← 실제 도메인으로 교체
const analyticsOn = ANALYTICS_HOSTS.includes(location.hostname);
```

`location.hostname`은 `file://`에서 빈 문자열, 로컬에서 `localhost`/`127.0.0.1` → 자동 배제.
**※ 실제 프로덕션 도메인은 구현 시점에 채워야 함(현재 미확정).**

### 2) 키는 공개 전제 — 그래도 가드는 필요

GA4 Measurement ID(`G-XXXXXXX`)와 PostHog project API key(`phc_...`)는 **클라이언트용 공개 키**라
오픈소스 저장소에 커밋해도 무방하다. hostname 가드는 *비밀 유지*가 아니라 *데이터 위생*(포크·로컬 차단)이 목적.
구현 시 GA4 Measurement ID, PostHog API key + region host(US `https://us.i.posthog.com` / EU `https://eu.i.posthog.com`)가 필요.

### 3) PostHog — jsDelivr 버전 고정 + 프라이버시 경량

- 로드: `https://cdn.jsdelivr.net/npm/posthog-js@<현재 최신 stable, 예: 1.x.x>/dist/array.full.js`
  (버전을 URL에 고정 — CLAUDE.md의 version-pinned 관례). 스크립트 onload 후 `window.posthog.init(...)`.
- 프라이버시 경량 init 옵션:
  - `persistence: "localStorage"` — **쿠키 미사용**, 익명 ID는 안정적으로 유지(메모리와 달리 페이지 이동 시 유니크 과대계상 없음).
  - `person_profiles: "identified_only"` — 익명 사용자 person 프로필 미생성.
  - `autocapture: false`, `disable_session_recording: true` — 최소 수집.
  - `capture_pageview: true`(기본) — MPA라 페이지 로드마다 `$pageview` 자동 발화.
- IP 익명화는 PostHog 프로젝트 설정의 **"Discard client IP data"** 토글로(서버측). 구현 후 콘솔에서 1회 설정.

### 4) GA4 — 표준 gtag + 프라이버시 경량

- 로드: `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX`(Google 제공, 버전 고정 불가).
- `dataLayer`/`gtag` 정의 후 `gtag("config", "G-XXXXXXX", { ... })`:
  - `allow_google_signals: false`, `allow_ad_personalization_signals: false` — 광고/크로스디바이스 기능 차단.
  - `anonymize_ip: true`.
  - MPA라 로드마다 `page_view` 자동 전송 — SPA 라우팅 처리 불필요.
- 트레이드오프: GA4는 기본적으로 1st-party analytics 쿠키를 사용한다. 위 설정은 *광고성* 식별을 끄지만
  완전 쿠키리스 GA4는 Consent Mode(default-denied)가 필요하고 데이터 품질이 크게 떨어진다.
  → 기본은 "광고 신호 off + IP 익명화 + 1st-party analytics 쿠키 허용"으로 두고, 더 엄격히 가려면 추후 Consent Mode 추가.

### 5) 발화 조건

`if (analyticsOn) { /* PostHog init + GA4 init */ }` — 가드 false면 스크립트 태그 주입·init 자체를 건너뛰어
로컬/포크에서 네트워크 요청 0.

## 검증

1. **로컬/`file://`에서 미발화 확인**: `index.html`을 더블클릭(`file://`) 및 `python3 -m http.server`(localhost)로 열고
   DevTools Network 탭에서 `posthog`/`googletagmanager` 요청이 **없는지**, Console 에러 없는지 확인.
2. **프로덕션 발화 확인**: 배포(또는 임시로 `ANALYTICS_HOSTS`에 `localhost` 추가) 후
   - PostHog: Activity/Live events에 `$pageview` 수신 확인.
   - GA4: Realtime 보고서에 활성 사용자/`page_view` 확인.
3. **전 페이지 커버리지**: index → 각 도구(text-diff, color-contrast, box-shadow, favicon-generator) 이동마다
   두 대시보드에서 페이지뷰가 1건씩 더 잡히는지 확인. (새 도구도 `shared.js` 로드만으로 자동 포함됨.)
4. 임시 추가했던 `localhost` 가드 항목 원복.

## 비고

- 대안(채택 안 함): 별도 `app/analytics.js`를 만들어 각 HTML이 로드 — 5개 파일 + 모든 신규 도구에 `<script>` 추가가
  필요해 "파일 하나 = 도구 하나" 이점을 깨므로 `shared.js` 단일 삽입이 우월.
