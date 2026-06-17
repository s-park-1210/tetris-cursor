# 테트리스

입문자를 위한 브라우저 테트리스 게임입니다. HTML, CSS, JavaScript만 사용하며 빌드 도구나 외부 라이브러리가 필요하지 않습니다.

## 실행 방법

### 로컬

1. 이 프로젝트 폴더를 연다.
2. `index.html`을 더블클릭하거나 브라우저 창에 끌어다 놓는다.
3. **시작** 버튼을 누르면 게임이 시작된다.

### Live Server (선택)

VS Code / Cursor의 **Live Server** 확장을 사용하면 저장 시 자동 새로고침된다.

1. `index.html`을 연다.
2. 우클릭 → **Open with Live Server**

### 온라인 (GitHub Pages)

배포 후 아래 주소에서 플레이할 수 있다.

`https://s-park-1210.github.io/tetris-cursor/`

## 조작법

게임 시작 후 키보드로 조작한다.

| 키 | 동작 |
|---|---|
| ← (ArrowLeft) | 왼쪽 이동 |
| → (ArrowRight) | 오른쪽 이동 |
| ↓ (ArrowDown) | 한 칸 빠르게 내리기 |
| ↑ (ArrowUp) | 회전 |
| Space | 즉시 내리기 (hard drop) |

충돌이 발생하는 이동·회전은 적용되지 않는다.

## 구현 기능

- 10 × 20 게임 보드 (CSS Grid)
- 7가지 테트로미노 (I, O, T, S, Z, J, L)
- 자동 낙하 및 충돌 판정
- 키보드 이동, 회전, soft drop, hard drop
- 블록 고정, 라인 클리어, 점수 계산
- 게임 오버 및 재시작

## 점수 규칙

블록을 고정한 뒤 한 번에 삭제된 줄 수에 따라 점수가 올라간다.

| 삭제 줄 수 | 점수 |
|-----------|------|
| 1줄 | 100 |
| 2줄 | 300 |
| 3줄 | 500 |
| 4줄 | 800 |

## 게임 오버

새 블록을 스폰할 공간이 없으면 게임이 종료된다. **재시작** 버튼으로 다시 플레이할 수 있다.

## 품질 점검 방법

배포 전 아래 항목을 수동으로 확인한다.

1. **시작** 클릭 → 블록 자동 낙하
2. ← → ↓ ↑ Space 키 조작
3. 한 줄을 가득 채워 라인 삭제 및 점수 증가
4. 블록을 위까지 쌓아 게임 오버 표시
5. **재시작** 후 보드·점수 초기화 및 게임 재개
6. 브라우저 개발자 도구(F12) → Console에 에러 없음

## GitHub Pages 배포 방법

1. GitHub에 `tetris-cursor` 저장소를 만든다.
2. `index.html`, `style.css`, `script.js`, `README.md`, `.gitignore`를 `main` 브랜치 루트에 푸시한다.
3. 저장소 **Settings → Pages**로 이동한다.
4. **Source**를 `Deploy from a branch`로 선택한다.
5. **Branch**를 `main`, **Folder**를 `/ (root)`로 설정하고 저장한다.
6. 1~2분 후 `https://s-park-1210.github.io/tetris-cursor/`에서 확인한다.

## 파일 구조

```
tetris-cursor/
├── index.html   # 화면 구조
├── style.css    # 스타일
├── script.js    # 게임 로직
├── README.md    # 프로젝트 안내
└── .gitignore   # Git 제외 규칙
```
