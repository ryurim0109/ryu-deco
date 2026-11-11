# ᓚᘏᗢ ryu-deco

**Decorate your GitHub, pixel by pixel.**

픽셀 월드에 개발자 소개와 기술 스택을 담아 GitHub 프로필 README용 배너를 만드는 에디터입니다.

## 로컬 실행

Node.js 20.9 이상에서 실행할 수 있습니다.

```bash
npm ci
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`을 엽니다. 편집 내용은 현재 브라우저의 `localStorage`에 저장됩니다.

## GitHub Pages 배포

배포 대상 주소는 `https://ryurim0109.github.io/ryu-deco/`입니다.

저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다. 이후 `main`에 푸시하면 `.github/workflows/pages.yml`이 포맷·타입 검사, 정적 빌드, 브라우저 테스트를 실행한 뒤 GitHub Pages에 배포합니다. Actions 탭에서 **Deploy to GitHub Pages → Run workflow**로 수동 실행할 수도 있습니다.

Next.js의 `output: "export"`로 생성한 `out/` 디렉터리를 배포합니다. 배포 경로는 GitHub Pages 설정에서 가져오며, 로컬 개발은 기존 루트 주소에서 동작합니다.

배포 환경과 같은 경로를 로컬에서 확인하려면 다음과 같이 실행합니다.

```bash
NEXT_PUBLIC_BASE_PATH=/ryu-deco npm run build
npm start -- --base-path /ryu-deco
```

`http://127.0.0.1:4173/ryu-deco/`에서 정적 배포 결과를 확인합니다. 이 빌드에 대한 브라우저 검사는 다음 명령으로 실행합니다.

```bash
NEXT_PUBLIC_BASE_PATH=/ryu-deco PLAYWRIGHT_STATIC=1 npm run test:e2e
```

## Phase 1 · Pixel Dev Card

- 개발자 유형 7개 중 하나를 선택하고 이름, 소개 문구, 기술 스택을 편집합니다. 기술 스택은 드래그나 화살표 버튼으로 정렬합니다.
- Snowy Night 테마에 픽셀 캐릭터와 장식을 놓습니다. Canvas에서 드래그하거나 오른쪽 패널에서 위치와 크기를 조절합니다. 색상, 레이어 순서, 삭제, 실행 취소도 지원합니다.
- 미리보기의 장면을 800×240 또는 1600×480 PNG로 저장합니다. 선택 테두리는 편집 화면에만 표시됩니다.
- 모바일에서는 미리보기 아래에서 Editor와 Customize & export를 전환합니다.

## Phase 2 · Animated Pixel World

- Snowy Night, Spring Garden, Cozy Room, Starry Sky 배경을 선택합니다. 각 배경에는 숲, 벚나무, 방, 밤하늘 등 다른 픽셀 구성이 들어 있습니다.
- Effects에서 Falling Snow, Twinkling Stars, Floating, Walking을 각각 켜고 끕니다. 미리보기의 재생 버튼으로 애니메이션을 일시정지하거나 이어서 재생합니다.
- File format을 GIF로 바꾸면 4초 루프를 저장합니다. 최대 40프레임과 128색을 사용하며, 생성 중 진행률 확인과 취소가 가능합니다. 효과를 모두 끄면 한 프레임만 저장합니다.
- PNG는 현재 보이는 프레임을 저장합니다. GIF는 저장을 시작한 시점의 편집 내용을 기준으로 공통 렌더러에서 전체 루프를 생성합니다.
- 배경, 효과, 출력 형식도 브라우저에 저장됩니다. 기존 Phase 1 프로젝트를 그대로 불러올 수 있습니다.

## Phase 3 · Pixel Drawing Studio

**Character → Draw a character**에서 직접 픽셀 캐릭터를 만듭니다.

- 16×16 또는 32×32 그리드에서 연필, 지우개, 기본 팔레트와 사용자 색상을 사용합니다. 빠른 드래그에도 선이 이어지며, 한 번의 드래그를 실행 취소하거나 다시 실행할 수 있습니다.
- 체크무늬 영역은 투명합니다. 그리드 크기를 바꾸면 nearest-neighbor 방식으로 그림을 변환하며 실행 취소로 원본을 복원할 수 있습니다.
- 프레임을 추가·복제·삭제하고 각 프레임을 그려 최대 8프레임 애니메이션을 만듭니다. 미리보기에서 재생·일시정지하고 4초 동안의 반복 횟수를 선택합니다.
- 그림은 편집 중에도 자동 저장됩니다. **Save & close** 후 Character 라이브러리에서 다시 편집하거나, **Add drawing to world**로 배치합니다. 라이브러리는 최대 12개 그림을 저장합니다.
- 같은 그림을 여러 개 배치할 수 있습니다. 원본을 수정하면 배치된 사본도 갱신됩니다. 원본 삭제는 사본도 함께 삭제하며 월드의 실행 취소로 복구할 수 있습니다.
- 사용자 캐릭터도 위치·크기·레이어와 Floating·Walking 효과를 지원합니다. PNG와 GIF에 사용자 그림과 프레임 애니메이션이 포함됩니다.
- 키보드로도 그릴 수 있습니다. 캔버스에 포커스를 두고 방향키로 칸을 이동한 다음 Space 또는 Enter로 그립니다. B는 연필, E는 지우개, ⌘/Ctrl+Z는 실행 취소입니다.

## GitHub README에 적용하기

1. 에디터에서 PNG 또는 GIF 형식을 선택하고 **Download**를 누릅니다.
2. 다운로드한 `pixel-dev-card.png` 또는 `pixel-dev-card.gif`를 저장소의 `assets/` 폴더에 추가합니다.
3. **Copy Markdown**으로 코드를 복사해 저장소 루트의 `README.md`에 붙여 넣습니다. 파일 이름이나 폴더가 다르면 **File & README settings**에서 맞춥니다.

```markdown
![My Pixel Dev Card](./assets/pixel-dev-card.gif)
```

GitHub 프로필에 표시하려면 본인 사용자 이름과 같은 이름의 공개 저장소 `username/username`에서 위 단계를 진행합니다. 이 배너는 README 콘텐츠이며 GitHub가 표시하는 기본 Pinned 저장소 카드와 별개입니다.

## 검증

코드 포맷은 `npm run format`으로 적용하고, `npm run format:check`로 검사합니다.

```bash
npm run typecheck
npm run build
npm run test:e2e
```

브라우저 테스트에는 Google Chrome이 필요합니다. Playwright가 로컬 개발 서버를 실행해 프로필 편집, 자동 저장, 장식 조작, PNG 픽셀 일치, 배경 전환, 애니메이션 제어, GIF 프레임 디코딩, Markdown 복사, 오류 복구, 모바일 패널을 검증합니다. 픽셀 그리기, 실행 취소, 리사이즈, 사용자 캐릭터 저장·수정·삭제, 프레임별 색상의 GIF 출력도 검증합니다.

Next.js App Router, strict TypeScript, Tailwind CSS, Zustand와 Canvas를 사용합니다. `lib/pixel/`에서 픽셀 에셋과 장면을 그리며, `store/`에서 편집 상태와 저장을 관리합니다. `lib/export/`는 Canvas 이미지와 README 코드를 생성합니다.

**Made with ♡ by RyuRim**
