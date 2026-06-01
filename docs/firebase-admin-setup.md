# Firebase 本番設定チェック

## 初期管理者 UID 登録

1. Firebase Console で対象プロジェクト `aloha-z-hp` を開く。
2. Authentication > Users で管理者にしたい Google アカウントの UID を確認する。
3. Firestore Database > Data で `admins` コレクションを開く。
4. ドキュメント ID に確認した UID を指定して作成する。
5. フィールドは任意だが、運用確認用に以下を入れる。

```text
createdAt: 登録日
role: admin
```

## 本番公開前チェック

- Authentication の Google プロバイダが有効である。
- Authentication の Anonymous プロバイダが有効である。
- Authentication の Authorized domains に本番ドメインが含まれている。
- Firestore database ID が `(default)` で、ロケーションが `asia-northeast1` である。
- `firestore.rules` を Firebase にデプロイ済みである。
- 管理者以外の Google アカウントでは `/admin` に入れない。
- 匿名ユーザーは自分の `users/{uid}/gacha/state` だけ読書きできる。
- `daily_stats` は公開読み取りできず、書き込みは1イベントにつき1カウント増分だけ許可される。

## ルールのデプロイ

```bash
npx firebase deploy --only firestore:rules
```

Hosting は GitHub Actions で自動デプロイされるが、Firestore ルール変更は上記コマンドで明示的にデプロイする。
