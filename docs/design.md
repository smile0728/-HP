# Design

## 技術構成

- フレームワーク: React 19
- ビルドツール: Vite 6
- 言語: TypeScript
- スタイル: Tailwind CSS v4
- アニメーション: `motion`
- アイコン: `lucide-react`
- 紙吹雪演出: `canvas-confetti`
- 音声: Web Audio API
- 認証/DB: Firebase Authentication, Cloud Firestore
- 永続化: Firestore, ブラウザ `localStorage`

## アプリ構造

```text
src/
  App.tsx
  data.ts
  types.ts
  index.css
  main.tsx
  components/
    AdminPanel.tsx
    Announcements.tsx
    CursorSparks.tsx
    ExchangeDiary.tsx
    FortuneGame.tsx
    Gallery.tsx
    LoadingScreen.tsx
    MusicPlayer.tsx
    ProfileCards.tsx
  lib/
    firebase.ts
  assets/images/
    alohaz_main_1779675458356.png
    alohaz_logo_1779675480937.png
firebase-applet-config.json
firebase-blueprint.json
firestore.rules
```

## データ設計

### MemberProfile

メンバー情報を表す。`smile` と `caramel` の2名を想定する。

- `id`: メンバー識別子
- `name`: 英語名
- `jpName`: 日本語名
- `color`, `subColor`: 表示用カラー
- `signature`: 署名風文言
- `tagline`: 紹介文
- `birthday`: 誕生日
- `bloodType`: 血液型
- `likes`: 好きなもの
- `dislikes`: 苦手なもの
- `message`: 本人メッセージ
- `stickerStyle`: 付箋表示用スタイル

### DanceVideo

動画シアターの動画データを表す。

- `id`
- `title`
- `originalSong`
- `youtubeUrl`
- `thumbnailUrl`
- `releasedDate`
- `smileComment`
- `caramelComment`
- `heartsCount`

### DiaryEntry

交換日記本文を表す。

- `id`
- `date`
- `author`
- `title`
- `content`
- `response`
- `stickers`

### FanComment

ファン付箋コメントを表す。

- `id`
- `diaryId`
- `userName`
- `avatarSeed`
- `content`
- `timestamp`
- `stickyColor`

### FortuneResult

ガチャ結果を表す。

- `title`
- `description`
- `luckLevel`
- `commentSmile`
- `commentCaramel`
- `luckyItem`
- `luckyDance`
- `ratingSmile`
- `ratingCaramel`

### Firestore 管理データ

`src/lib/firebase.ts` では、公開画面と管理画面で使う Firestore データ型を定義する。

- `PhotoEntry`: 写真 ID、画像 URL、タイトル、日付、コメント、公開状態
- `DiaryRecord`: 日記 ID、日付、著者、タイトル、本文、返信、ステッカー配列、公開状態
- `AnnouncementEntry`: お知らせ ID、タイトル、本文、日付、公開状態
- `GachaFortune`: ガチャ ID、季節、タイトル、結果名、結果メッセージ、画像 URL、レアリティ、開始日、終了日、表示順、公開状態など
- `SeasonLetter`: 手紙 ID、季節、タイトル、本文、著者、画像 URL、開始日、終了日、公開状態など
- `DailyStat`: 日付 ID、ページビュー、ガチャ回数、コンプリート数、ギャラリー閲覧、SNSクリック、動画クリック
- `UserGachaState`: ファンごとの最終抽選日、当日結果、収集済み運勢、宛名、更新日時

## 画面構成

### App

アプリ全体のレイアウトとトップレベル状態を持つ。

主な責務:

- `/admin` パス判定と `AdminPanel` 表示
- ローディング画面の表示制御
- スクロールナビゲーション
- ヒーロー、動画、プロフィール、日記、ギャラリー、ガチャの配置
- ロゴ連打による隠しモーダル制御
- 動画選択と動画推し数の一時状態管理
- キャンディ雨とクリック効果音の発火
- ファンホームページ表示時のページビュー計測

主な state:

- `isLoading`
- `logoClicks`
- `showSecret`
- `activeVideo`
- `videoLikes`
- `hasLikedVideo`
- `fallingCandies`

### Announcements

公開中のお知らせを表示する。

- `getAnnouncements()` から公開お知らせを取得
- データが空の場合は何も描画しない
- 一覧クリックで詳細モーダルを表示
- 詳細表示時に Web Audio API で短い効果音を鳴らす

### AdminPanel

運営管理室を提供する。

- `/admin` で `App` から直接表示される
- Firebase Auth の `onAuthStateChanged` でログイン状態を監視
- Google ログイン後、Firestore の `admins/{uid}` ドキュメントが存在しないユーザーはサインアウトする
- `isMockFirebase` の場合は模擬管理者ログインを許可する
- 認証状態の確認中はローディング表示を出す
- 権限チェック失敗やログイン失敗時はログイン画面にエラーを表示する
- 認証後、以下のデータを並列取得する
  - 写真
  - 日記
  - お知らせ
  - ガチャ
  - 手紙
  - 日次統計
- 各タブのフォームから `save*` / `delete*` API を呼び出す
- 変更後は `refreshData()` で管理画面の一覧を再取得する
- 主要な管理フォームは公開/非公開フラグを持ち、公開画面は `visible` なデータだけを表示する

管理画面のタブ構成:

- `dashboard`: 日次統計、登録件数、簡易グラフを表示
- `announcements`: お知らせの作成、編集、削除、公開/非公開
- `diary`: 交換日記の作成、編集、削除、公開/非公開
- `photos`: アルバム写真の作成、編集、削除、公開/非公開
- `gacha`: おみくじ結果定義の作成、編集、削除、公開/非公開
- `letters`: コンプリート手紙定義の作成、編集、削除、公開/非公開

### LoadingScreen

入場前のスプラッシュ画面。

- `rolling`, `collided`, `loaded` の3段階表示
- 40ms ごとに進捗を2%ずつ増加
- 約2.1秒後に入場ボタンを表示
- 入場ボタン押下で開始音を鳴らし、親の `onComplete` を呼ぶ

### CursorSparks

クリック位置に絵文字パーティクルを表示する演出コンポーネント。

- `window` の click イベントを購読
- 1クリックにつき6個の絵文字を生成
- `motion` で上方向に散るアニメーションを行う

### MusicPlayer

Web Audio API による簡易 8bit プレイヤー。

- トラックはコンポーネント内の `TRACKS` 配列で定義
- `AudioContext`、`OscillatorNode`、`GainNode` で音を生成
- `setTimeout` で次ノートをスケジュール
- コンポーネント unmount 時に再生を停止

### ProfileCards

メンバー紹介カード。

- `MEMBERS` から選択中メンバーを取得
- `activeTab` で `smile` / `caramel` を切り替える
- タブ切り替え時に `AnimatePresence` で本文を差し替える

### ExchangeDiary

交換日記とファン付箋コメント機能。

- 日記本文は `getDiaries()` から取得
- コメントは `localStorage` の `alohaz_diary_comments` から復元
- 保存データがない場合は初期コメント2件を投入
- 投稿時は選択中日記 ID に紐づくコメントを先頭追加
- 削除時は対象コメントを配列から除外して再保存

### Gallery

スクラップブック風アルバム。

- `getPhotos()` から写真を取得し、表示用にカテゴリー、説明文、ステッカー、回転角を付与
- `activeTab` でカテゴリー絞り込み
- `selectedPhotoIndex` でライトボックス表示を制御
- 前後移動は取得済みの `photos` 配列全体を循環する

### FortuneGame

1日1回のおみくじガチャ、コレクション、コンプリートレターを担当する。

主な state:

- `isPlaying`
- `result`
- `isDrawRestricted`
- `lastDrawDate`
- `collection`
- `showLetter`
- `canvasGenerating`
- `visitorName`
- `tempName`
- `showNameModal`
- `fanAccountId`
- `gachaSaveStatus`

初期化:

- `localStorage` の既存ガチャ状態を先に復元
- Firebase 匿名ログインでファン用 UID を取得
- `users/{uid}/gacha/state` を読み込み、ローカル状態とマージ
- マージ後の状態を画面、`localStorage`、Firestore に反映
- 匿名ログインまたは Firestore が使えない場合は `localStorage` 保存で継続

抽選:

- 再抽選制限がなければ `isPlaying` を有効化
- 1.5秒後に `FORTUNES` からランダム選択
- 当日結果、抽選日、収集済み運勢を `localStorage` と Firestore に保存
- 新しい運勢レベルならコレクションに追加

画像生成:

- `canvas` を動的作成
- 背景、枠、運勢バッジ、本文、メンバーコメント、ラッキー項目を描画
- `toDataURL('image/png')` からダウンロードリンクを生成

コンプリートレター:

- `collection.length >= 6` で解除
- 宛名未登録なら名前入力モーダルを開く
- 登録後、訪問者名入りの手紙を表示する

## スタイリング方針

### ビジュアルテーマ

- キャンディポップ
- 平成レトロ
- スクラップブック
- おもちゃ箱、ゲームセンター、手書きノート感

### カラーパレット

`src/index.css` の Tailwind テーマで定義する。

- `brand-orange`: `#FF8C00`
- `brand-yellow`: `#FFD700`
- `brand-pink`: `#FF69B4`
- `brand-cream`: `#FFF9E5`
- `dark-charcoal`: `#4A2C2A`

### フォント

Google Fonts から以下を読み込む。

- `M PLUS Rounded 1c`
- `Fredoka`
- `JetBrains Mono`

### UI 表現

- 太い枠線
- ずらした影
- 角丸カード
- ステッカー、テープ、付箋、ポラロイド表現
- `motion` による弾む・回る・拡大する演出

## 永続化設計

### localStorage

| キー | 内容 |
| --- | --- |
| `alohaz_diary_comments` | 交換日記のファンコメント配列 |
| `alohaz_last_draw_date` | 最終ガチャ抽選日 `YYYY-MM-DD` |
| `alohaz_today_fortune` | 当日の `FortuneResult` |
| `alohaz_gacha_collection` | 収集済み `luckLevel` 配列 |
| `alohaz_visitor_name` | コンプリートレターの宛名 |
| `alohaz_firestore_*` | Firestore フォールバック用の各コレクション |

### Firestore

| コレクション | 用途 |
| --- | --- |
| `photos` | ギャラリー写真 |
| `diaries` | 交換日記本文 |
| `announcements` | お知らせ |
| `fortunes` | 管理対象ガチャ結果 |
| `letters` | 季節/コンプリート手紙 |
| `daily_stats` | 日次テレメトリー |
| `admins` | 管理者 UID |
| `users/{uid}/gacha/state` | ファンごとのガチャ保存状態 |

`src/lib/firebase.ts` は各コレクションに対して以下の操作関数を提供する。

- 写真: `getPhotos`, `savePhoto`, `deletePhoto`
- 日記: `getDiaries`, `saveDiary`, `deleteDiary`
- お知らせ: `getAnnouncements`, `saveAnnouncement`, `deleteAnnouncement`
- おみくじ: `getFortunes`, `saveFortune`, `deleteFortune`
- 手紙: `getLetters`, `saveLetter`, `deleteLetter`
- 統計: `logTelemetryEvent`, `getDailyStats`
- 共有コメント: `getFanComments`, `saveFanComment`, `deleteFanComment`
- 推し/いいね: `getLikeEngagement`, `toggleLikeReaction`
- ファン用ガチャ状態: `ensureFanUser`, `getUserGachaState`, `saveUserGachaState`

Firebase がモック設定、または Firestore 読み込みに失敗した場合は `alohaz_firestore_` 接頭辞の `localStorage` データを使用する。
ガチャ状態は専用の `alohaz_*` キーも併用し、匿名ログイン初期化時に Firestore へ移行する。

## 外部依存とリソース

- ローカル画像:
  - `/src/assets/images/alohaz_main_1779675458356.png`
  - `/src/assets/images/alohaz_logo_1779675480937.png`
- 外部画像:
  - `picsum.photos` のギャラリー画像
  - YouTube サムネイル画像
- 外部フォント:
  - Google Fonts
- Firebase:
  - `firebase-applet-config.json` の Firebase プロジェクト設定
  - `firestore.rules` のセキュリティルール

## エラーハンドリング

- `localStorage` の JSON parse 失敗時は例外を握りつぶし、初期値に戻す。
- Web Audio API の実行失敗は `try/catch` で無視する。
- Canvas 画像生成失敗時は `console.error` に出力し、生成中状態を解除する。
- Firestore 操作失敗時は `handleFirestoreError()` で操作種別、パス、認証情報を JSON 化してログ出力する。
- 一部の読み書きは Firebase 失敗時に `localStorage` フォールバックを使う。

## セキュリティとプライバシー

- ユーザー入力は React の通常レンダリングで表示されるため、HTML としては解釈されない。
- コメントは共有掲示板として Firestore に保存され、公開表示される。
- 訪問者名はブラウザ内と本人の匿名UID配下のガチャ状態に保存される。
- 管理画面は Firebase Authentication の Google ログインで保護する。
- ファン向けガチャ保存は Firebase Authentication の匿名ログインで UID を発行する。
- Firestore ルールでは `admins/{uid}` の存在で管理者判定を行い、管理者メールはコードにもルールにも含めない。
- 初期管理者は Firebase Console などから `admins/{uid}` を作成して登録する必要がある。
- `admins/{uid}` は本人または管理者が個別取得でき、一覧取得と書き込みは管理者に限定する。
- `users/{uid}/gacha/state` は `request.auth.uid == uid` の本人だけが読み書きできる。
- `fan_comments/{commentId}` は誰でも読める。作成は匿名ログイン済みユーザーに限定し、削除は投稿者本人または管理者に限定する。
- `like_reactions/{reactionId}` は誰でも読める。作成は匿名ログイン済みユーザーに限定し、`kind_targetId_uid` 形式のドキュメントIDで1対象1ユーザー1回に制限する。
- Firebase の API キーはクライアント設定として含まれるため、アクセス制御は Firestore ルール側で担保する。

## 実装上の注意点

- Vite の `server.hmr` は `DISABLE_HMR` 環境変数で制御される。
- `vite.config.ts` には `@` エイリアスがプロジェクトルートとして定義されている。
- `metadata.json` に Gemini API capability は設定しない。現状の画面コードでは Gemini 呼び出しを行わない。
- ルーティングは `window.location.pathname` と `history.pushState` による簡易実装である。
