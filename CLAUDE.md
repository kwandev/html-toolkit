# CLAUDE.md

Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드.

## 이 저장소는

- 단일 파일·빌드 없는 프론트엔드 유틸리티 모음. **도구 하나 = HTML 파일 하나**.
- 서버·회원가입·업로드·추적 없이 전부 브라우저에서 동작. `file://`(더블클릭) 또는 임의의 정적 호스트로 실행.
- 빌드 단계·프레임워크·번들러·런타임 의존성 없음. `node_modules`는 린터/포매터 전용.

## 구조

- **`index.html`** (루트) — 랜딩 페이지. `window.TOOLS`를 읽어 도구 카드 그리드 렌더링. `tool` 속성 _없이_ `<app-shell>`을 써서 자동 도구 헤더 대신 자체 hero 표시.
- **`app/shared.js`** — 유일한 공유 JS. `file://` 로드를 위해 **ES 모듈이 아닌 클래식 스크립트**. ① 단일 진실 공급원 `window.TOOLS` 정의, ② `<app-shell>` 커스텀 엘리먼트(Shadow DOM 헤더/`<main><slot></slot></main>`/푸터) 정의.
- **`app/<slug>.html`** — 도구당 파일 하나. 순서: 디자인 시스템 CSS 인라인 → `<script src="shared.js">` → 도구 전용 CSS → 본문을 `<app-shell tool="<slug>">`로 감쌈.

## 커밋 컨벤션

Conventional Commits prefix를 반드시 사용하고, 제목과 본문은 한국어로 작성한다.

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 formatting, 세미콜론 누락 등 코드 변경이 없는 경우
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드 업무 수정, 패키지 매니저 수정

형식: `type: 한국어 제목`

### 도구 페이지 부팅 흐름

1. 브라우저가 `*.html` 로드. 인라인 `<style>`이 디자인 시스템 즉시 제공(독립 실행 시에도 스타일 유지).
2. `<script src="shared.js">` 실행 → `window.TOOLS` 등록 + `customElements.define("app-shell", …)`.
3. 브라우저가 `<app-shell>` 업그레이드 → `connectedCallback()`이 헤더/푸터 + `<slot>`을 가진 Shadow DOM 생성. 태그 사이 마크업이 slot으로 들어감.
4. `tool="<slug>"` 설정 시 `TOOLS`에서 slug를 찾아 `<h1>`/설명 헤더 블록 자동 생성.

### 핵심 제약 (수정 전 필독)

- **`shared.js`는 클래식 스크립트 유지.** ES 모듈로 바꾸면 `file://` 로딩이 깨짐 — 프로젝트의 핵심.
- **`TOOLS[].href`는 프로젝트 루트 기준**(예: `app/box-shadow.html`). `shared.js`가 `document.currentScript.src`로 `ROOT`를 계산해 절대 URL로 변환 → 루트 `index.html`이든 `app/` 도구든 링크 동작. 페이지 기준 경로로 바꾸지 말 것.
- **디자인 시스템 CSS는 모든 HTML에 인라인 중복.** 토큰(`--accent`, 간격)·공통 스타일(`.btn`, `.panel`, `.field`) 변경 시 _모든_ HTML 수정 필요. 단일 파일 이식성을 위한 의도된 비용.
- **`app/shared.css`는 디자인 시스템 원본 사본이나 어떤 페이지도 로드하지 않음** — 인라인 `<style>`이 정본. `shared.css`만 고치면 화면 변화 없음. 새 도구 작성 시 복사 원본으로 사용(아래 "새 도구 추가하기").
- **`<app-shell>` 스타일은 Shadow DOM 격리.** `--*` 토큰은 경계를 넘어 상속되나 `box-sizing`·문서 클래스는 안 됨 → 셸이 내부에서 `:host, *, *::before, *::after { box-sizing: border-box }` 재선언. 호스트는 `:host`, 내부 노드는 `*`.

## 새 도구 추가하기

1. `app/<slug>.html` 생성. 빈 파일에서 시작하거나 기존 도구(예: `app/box-shadow.html`) 복사.
2. **디자인 시스템:** `<head>` 맨 위 `<style>`에 `app/shared.css` **내용을 통째로 복사·붙여넣기**. `<link href="shared.css">`로 연결 금지 — 단일 파일 이식성 유지(`file://`에서도 스타일 동작). 기존 도구를 복사했다면 이미 인라인돼 있으니 `shared.css` 기준 최신 동기화만 확인. 도구 전용 CSS는 그 아래 별도 `<style>`에.
3. `app/shared.js`의 `window.TOOLS`에 `href: "app/<slug>.html"` 항목 추가.
4. 도구 내용물을 `<app-shell tool="<slug>"> … </app-shell>` 안에 작성.

- 홈 카드·공통 헤더/푸터는 자동 표시.
- **배치 규칙:** 홈(`index.html`)은 루트, 소스(공유 JS + 모든 도구)는 `app/`에 평면 배치. 도구별 하위 폴더 금지.

## 단일 HTML 도구 제작 규칙 & 패턴

> 출처: Simon Willison의 단일 HTML 파일 도구 글. 이 저장소는 이미 핵심 원칙을 따름 — 새 도구를 만들 때 아래를 적용.

**기본 원칙**

- 단일 파일: HTML 한 파일에 JS·CSS 인라인 → 호스팅·배포·공유 부담 최소 (적용됨)
- 빌드 없음: 컴파일 필요한 프레임워크 금지. 생성 프롬프트에 "No React" 명시. `file://` 더블클릭으로 즉시 실행 (적용됨)
- 짧게 유지: 도구당 수백 줄(~500줄) 이하 → LLM이 통째로 읽고 빠르게 수정·리믹스
- 의존성은 CDN: npm·번들러 대신 cdnjs/jsDelivr에서 **버전 고정 URL**로 로드 → 복붙 단순성·장기 재현성

**상태 저장**

- URL: 공유·북마크할 만한 적당한 양의 상태는 URL 프래그먼트/쿼리에
- localStorage: 큰 상태·자동저장·민감정보(API 키)는 localStorage에 — URL·코드에 키 하드코딩 금지

**입출력 (브라우저 네이티브 우선)**

- 복붙을 1급 인터페이스로: 붙여넣기 → 변환 → "클립보드 복사" 버튼(모바일 포함)
- 리치 클립보드 활용: paste 이벤트의 text/HTML/이미지/파일 포맷
- 파일 입력: `<input type="file">`로 로컬 파일 직접 읽기 (서버 업로드 없음)
- 파일 출력: 결과 파일을 클라이언트에서 생성·다운로드

**외부 연동 (서버리스 유지)**

- CORS 열린 API 직접 호출: PyPI, GitHub(raw.githubusercontent.com), Gist, Bluesky, Mastodon, iNaturalist 등
- LLM API 직접 호출 가능(OpenAI/Anthropic/Gemini는 CORS 허용) — 키는 localStorage 보관
- 무거운 작업은 WASM으로: Pyodide(브라우저 Python), Tesseract.js(OCR) 등 CDN 로드

**배포·기록**

- 정적 호스팅(Cloudflare Pages 등). LLM 플랫폼 샌드박스(Artifacts) 직접 호스팅은 제약·광고 때문에 회피
- footer에 "view source" 링크 → 원본 프롬프트/트랜스크립트 커밋 연결
- 생성 프롬프트·트랜스크립트를 함께 보존 → 다음 도구 리믹스 자산

**AI 협업 워크플로**

- 프로토타입: Claude Artifacts / ChatGPT Canvas / Gemini Canvas
- 복잡한 도구: Claude Code / Codex CLI (Playwright로 브라우저 테스트)
- 기존 도구를 이름으로 참조하거나 유사 예제 검색 후 리믹스
- 능력 탐색용 진단 도구(clipboard-viewer, cors-fetch, keyboard-debug, exif)로 새 가능성 발굴
