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
- 永続化: ブラウザ `localStorage`

## アプリ構造

```text
src/
  App.tsx
  data.ts
  types.ts
  index.css
  main.tsx
  components/
    CursorSparks.tsx
    ExchangeDiary.tsx
    FortuneGame.tsx
    Gallery.tsx
    LoadingScreen.tsx
    MusicPlayer.tsx
    ProfileCards.tsx
  assets/images/
    alohaz_main_1779675458356.png
    alohaz_logo_1779675480937.png
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

## 画面構成

### App

アプリ全体のレイアウトとトップレベル状態を持つ。

主な責務:

- ローディング画面の表示制御
- スクロールナビゲーション
- ヒーロー、動画、プロフィール、日記、ギャラリー、ガチャの配置
- ロゴ連打による隠しモーダル制御
- 動画選択と動画推し数の一時状態管理
- キャンディ雨とクリック効果音の発火

主な state:

- `isLoading`
- `logoClicks`
- `showSecret`
- `activeVideo`
- `videoLikes`
- `hasLikedVideo`
- `fallingCandies`

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

- 初期日記は `INITIAL_DIARY`
- コメントは `localStorage` の `alohaz_diary_comments` から復元
- 保存データがない場合は初期コメント2件を投入
- 投稿時は選択中日記 ID に紐づくコメントを先頭追加
- 削除時は対象コメントを配列から除外して再保存

### Gallery

スクラップブック風アルバム。

- `GALLERY_PHOTOS` を `ALBUM_PHOTOS` に拡張し、カテゴリー、説明文、ステッカーを付与
- `activeTab` でカテゴリー絞り込み
- `selectedPhotoIndex` でライトボックス表示を制御
- 前後移動は `ALBUM_PHOTOS` 全体を循環する

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

初期化:

- `alohaz_gacha_collection` から収集状況を復元
- `alohaz_last_draw_date` が今日なら再抽選不可にする
- `alohaz_today_fortune` があれば結果を復元
- `alohaz_visitor_name` から宛名を復元

抽選:

- 再抽選制限がなければ `isPlaying` を有効化
- 1.5秒後に `FORTUNES` からランダム選択
- 当日結果と抽選日を保存
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

| キー | 内容 |
| --- | --- |
| `alohaz_diary_comments` | 交換日記のファンコメント配列 |
| `alohaz_last_draw_date` | 最終ガチャ抽選日 `YYYY-MM-DD` |
| `alohaz_today_fortune` | 当日の `FortuneResult` |
| `alohaz_gacha_collection` | 収集済み `luckLevel` 配列 |
| `alohaz_visitor_name` | コンプリートレターの宛名 |

## 外部依存とリソース

- ローカル画像:
  - `/src/assets/images/alohaz_main_1779675458356.png`
  - `/src/assets/images/alohaz_logo_1779675480937.png`
- 外部画像:
  - `picsum.photos` の動画サムネイル、ギャラリー画像
- 外部フォント:
  - Google Fonts

## エラーハンドリング

- `localStorage` の JSON parse 失敗時は例外を握りつぶし、初期値に戻す。
- Web Audio API の実行失敗は `try/catch` で無視する。
- Canvas 画像生成失敗時は `console.error` に出力し、生成中状態を解除する。

## セキュリティとプライバシー

- ユーザー入力は React の通常レンダリングで表示されるため、HTML としては解釈されない。
- コメント、訪問者名はブラウザ内にのみ保存される。
- サーバー送信、認証、個人情報管理は行わない。

## 実装上の注意点

- Vite の `server.hmr` は `DISABLE_HMR` 環境変数で制御される。
- `vite.config.ts` には `@` エイリアスがプロジェクトルートとして定義されている。
- `metadata.json` には Gemini API の capability が記載されているが、現状の画面コードでは Gemini 呼び出しは確認できない。
- `.env.example` は存在するが、現状の UI 挙動では API キー必須処理は見当たらない。
