# toolkit — 단일 파일 프론트엔드 도구 모음

빌드 도구·서버·설치 없이, **HTML 파일을 더블클릭하면 바로 열리는** 프론트엔드 유틸리티 모음입니다.
도구 하나 = HTML 파일 하나. 회원가입·업로드·추적 없이 전부 브라우저 안에서 동작합니다.
`app/` 안의 각 도구 HTML은 홈을 거치지 않고도 파일 하나만 더블클릭해 **개별로 실행**할 수 있습니다 (CSS·JS가 인라인되어 단독으로도 완결됩니다).

## 실행 방법

```
# 그냥 더블클릭 (file://) — 서버 불필요
open index.html

# 또는 간단한 로컬 서버로
python3 -m http.server
# → http://localhost:8000
```

## 파일 구성

```
html-toolkit/
├─ README.md
├─ index.html          # 홈(랜딩) — 도구 목록을 카드로 표시
├─ robots.txt          # 크롤러 허용 + 사이트맵 위치 (루트에 둬야 크롤러가 인식)
├─ sitemap.xml         # 색인용 URL 목록
├─ public/             # favicon·PWA·소셜 에셋 (루트 절대경로 /public/…로 참조)
│  ├─ favicon.ico      # 32×32 파비콘
│  ├─ icon.svg         # 벡터 파비콘(>_)
│  ├─ apple-touch-icon.png  # iOS 홈 화면 아이콘 (180×180)
│  ├─ icon-192.png / icon-512.png / icon-mask.png  # PWA 아이콘
│  ├─ manifest.webmanifest  # PWA 매니페스트
│  └─ og.svg / og.png  # 소셜 공유 카드 이미지 (1200×630, og.svg가 원본)
└─ app/                # 개발 소스 파일
   ├─ shared.css       # 디자인 시스템 CSS 원본(복사용 정본)
   ├─ shared.js        # 모든 페이지가 공유하는 JS (도구 목록 + 공통 껍데기)
   └─ *.html           # 각 도구 파일 (하나당 1개, 개별 실행 가능)
```

| 파일             | 역할                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `index.html`     | 방문자가 처음 보는 홈. 도구 카드 목록을 보여주고 클릭 시 해당 도구로 이동                                                  |
| `app/*.html`     | 각 도구 파일. **`shared.css`·`shared.js`를 제외한 나머지 HTML은 모두 더블클릭만으로 개별 실행 가능한 완결된 도구**         |
| `app/shared.css` | 디자인 시스템 CSS의 원본 사본(복사용 정본). 새 도구를 만들 때 인라인 `<style>`로 복사해 사용 — 페이지가 직접 로드하진 않음 |
| `app/shared.js`  | ① 도구 목록 데이터(`window.TOOLS`) ② 공통 헤더/푸터 껍데기(`<app-shell>` 웹 컴포넌트)                                      |

> 맨 위에 동일한 디자인 시스템 CSS가 들어 있습니다. (트레이드오프: 토큰·공통 스타일 변경 시 **모든 HTML을 함께 수정**해야 함.)

## 한 페이지의 내부 구조

`box-shadow.html` 기준 예시:

```html
<head>
  <style>
    … 공유 디자인 시스템(색·폰트·버튼 등) …
  </style>
  <!-- 모든 파일 공통(복제) -->
  <script src="shared.js"></script>
  <!-- 공통 JS 로드 -->
  <style>
    … 이 도구 전용 스타일(.wrap, .stage 등) …
  </style>
  <!-- 이 파일만의 것 -->
</head>
<body>
  <app-shell tool="box-shadow">
    <!-- 공통 헤더/푸터를 자동으로 입혀줌 -->
    <div class="wrap">… 슬라이더·미리보기·복사 버튼 …</div>
    <!-- 도구 알맹이 -->
  </app-shell>
  <script>
    … 슬라이더 → 그림자 갱신 로직 …
  </script>
</body>
```

## 동작 흐름

```
1. 브라우저가 *.html 로드
2. <script src="shared.js"> 실행
     → window.TOOLS(도구 목록) 등록
     → <app-shell> 커스텀 태그 정의 (customElements.define)
3. 브라우저가 <app-shell>을 발견 → connectedCallback() 자동 실행
     → Shadow DOM 생성 후 그 안에 header / main / footer 삽입
4. <app-shell> 사이에 쓴 내용물은 <main> 안의 <slot> 자리에 끼워져 표시됨
```

핵심 웹 컴포넌트 개념:

- **`<app-shell>`** — 머리말·본문 틀·꼬리말을 매 파일마다 다시 쓰지 않도록 자동으로 감싸주는 공통 껍데기. 내부 스타일은 Shadow DOM으로 격리됩니다.
- **`<slot>`** — "사용자가 넣은 내용물이 들어올 구멍". `<app-shell>` 사이에 적은 알맹이가 `<main>`의 `<slot>` 위치에 자동으로 꽂혀, **껍데기(공통)와 알맹이(도구별)가 분리**됩니다.
- **`tool="..."` 속성** — 어느 도구인지 알려주는 표식. 이 값으로 `window.TOOLS`에서 제목·설명을 찾아 본문 상단 제목 블록을 자동 생성합니다. 홈(`index.html`)은 이 속성이 없어 자기만의 hero/grid를 보여줍니다.
- **`:host`** — Shadow DOM 안에서 컴포넌트 자기 자신(`<app-shell>` 태그)을 가리키는 선택자. `*`는 내부 요소만 잡고 호스트는 못 잡으므로, 호스트까지 스타일링하려면 `:host`를 따로 써야 합니다.

## 도구 목록은 단일 진실 공급원

`shared.js`의 `window.TOOLS` 배열이 도구 정보의 유일한 출처입니다.

```js
window.TOOLS = [
  {
    slug: "box-shadow",
    name: "Box Shadow",
    href: "app/box-shadow.html", // 프로젝트 루트 기준 경로
    tag: "css",
    blurb: "Tune a CSS box-shadow with live preview and copy-ready output.",
  },
];
```

- `index.html`은 이 배열을 읽어 **카드 그리드**를 생성하고,
- `<app-shell>`은 이 배열에서 현재 도구의 **제목/설명**을 찾아 헤더 영역을 채웁니다.

> `href`는 **프로젝트 루트 기준** 경로(`app/box-shadow.html`)로 적습니다. `shared.js`가 자기 자신의 URL(`<root>/app/shared.js`)에서 루트를 계산해 절대 URL로 변환하므로, 루트의 `index.html`에서 로드되든 `app/`의 도구에서 로드되든 링크가 올바르게 동작합니다.

## 새 도구 추가하기

1. `app/`에 `<slug>.html` 생성 (예: `app/gradient.html`) — 기존 도구 HTML을 복사해서 시작
2. `app/shared.js`의 `window.TOOLS` 배열에 항목 1개 추가 (`href: "app/gradient.html"`)
3. 새 파일의 알맹이를 `<app-shell tool="gradient"> … </app-shell>` 안에 작성
4. `<head>`의 공통 블록(favicon · theme-color · canonical · Open Graph · Twitter)을 기존 도구에서 복사 — favicon·theme-color는 그대로 두고 **canonical/OG/Twitter의 제목·설명·경로(`/app/<slug>.html`)만 교체**한 뒤, `sitemap.xml`에 `<url>` 항목 1개 추가

→ 홈 카드 목록에 자동으로 표시되고, 공통 헤더/푸터도 자동으로 입혀집니다.

> **규칙:** 홈(`index.html`)은 루트에, 공통 JS와 도구 HTML은 **모두 `app/`에 평면 배치**합니다 (도구별 하위 폴더는 만들지 않음).

## 설계 원칙

- **단일 파일** — 도구 하나는 HTML 파일 하나로 완결. CSS는 인라인되어 단독 실행 시에도 스타일 유지.
- **빌드 없음** — 번들러·프레임워크·의존성 없음. `shared.js`는 ES 모듈이 아닌 클래식 스크립트라 `file://`에서도 그대로 로드됨.
- **평면 구조** — 홈은 루트, 소스(공통 JS + 도구)는 `app/`에 평면 배치 (도구별 하위 폴더 없음).

## SEO & 배포

각 페이지 `<head>`에는 검색·소셜 공유용 메타가 들어 있습니다. 디자인 시스템 CSS와 마찬가지로 **모든 HTML에 복제**되어 있으므로, 공통 값을 바꾸면 모든 파일을 함께 수정해야 합니다.

- **페이지별 정적 메타** — favicon·theme-color(전 페이지 동일 블록) + `<title>` / `description` / canonical / Open Graph / Twitter Card(도구별). 소셜 크롤러는 JS를 실행하지 않으므로 `shared.js` 런타임 주입이 아니라 **각 HTML에 정적으로** 둡니다(빌드·CI 없이 단순 복제).
- **공유 이미지** — `public/og.png`(원본 `public/og.svg`). 브랜드를 바꾸면 `og.svg`를 고치고 다시 래스터화: `rsvg-convert -w 1200 -h 630 public/og.svg -o public/og.png`.
- **아이콘** — `public/`에 모던 세트 전체: `favicon.ico`(32×32) + `icon.svg`(벡터) + `apple-touch-icon.png`(iOS) + PWA 아이콘(`icon-192/512/mask.png`) + `manifest.webmanifest`. 모든 페이지가 동일한 `<link>` 블록(루트 절대경로 `/public/…`)으로 참조. 다시 만들려면 `app/favicon-generator.html`에 `icon.svg`를 넣어 생성.
- **크롤링** — `robots.txt`(전체 허용 + 사이트맵 위치), `sitemap.xml`(전체 URL 목록).
- **언어** — 본문은 영어(`lang="en"`), `og:locale`은 `en_US` + `ko_KR` 대체. 한국어 검색 최적화를 본격적으로 하려면 한국어 콘텐츠 페이지(`/ko/…`)와 `hreflang`을 별도로 추가해야 합니다(현재 범위 밖).

### origin(도메인) 바꾸기

origin은 `https://toolkit.twentyquad.com`으로 설정돼 있습니다. 포크해서 **다른 도메인으로 배포하려면 아래 위치를 한 번에 치환**합니다:

- 5개 HTML(`index.html` + `app/*.html`)의 canonical / `og:url` / `og:image` / `twitter:image`
- `robots.txt`의 `Sitemap:` 줄
- `sitemap.xml`의 모든 `<loc>`

```
# 예: 저장소 루트에서
grep -rl 'toolkit.twentyquad.com' . --include='*.html' --include='*.xml' --include='*.txt'
# 위 파일들에서 https://toolkit.twentyquad.com → https://<실제-도메인> 으로 일괄 치환
```

> canonical/OG는 위 origin을 가리키므로, **도메인이 실제로 연결·배포된 뒤**에 검색엔진(Search Console 등)에 `sitemap.xml`을 제출하세요.
>
> **경로:** 에셋은 루트 절대경로(`/public/…`)로 참조합니다. **Cloudflare Pages**로 루트 도메인(`toolkit.twentyquad.com`)에서 서빙하므로 그대로 동작합니다(하위경로로 호스팅하면 `/public/…`가 깨지니 그땐 상대경로로 전환). `robots.txt`·`sitemap.xml`은 크롤러가 origin 루트(`/robots.txt`)에서만 찾으므로 반드시 루트에 둡니다. `file://` 더블클릭에서는 루트 절대경로 파비콘이 로드되지 않지만 도구 동작에는 영향이 없습니다.
