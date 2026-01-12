# おごり自販機マッチング - 検証用リポジトリ (PoC)

このリポジトリは、社内マッチングアプリ「おごり自販機」の開発に向けた技術検証（PoC）を行うためのプロジェクトです。
Teams × Power Automate × AWS (Serverless) 構成における実現可能性、およびバックエンドロジックの検証を目的としています。

## 🎯 検証のゴール

1.  **データ基盤:** AWS SDK v3 を用いた DynamoDB の操作手法の確立。
2.  **ロジック:** 複数条件（時間、属性）を考慮したマッチングアルゴリズムの実装。
3.  **連携:** Teams (Power Automate) と AWS 間での双方向通信の疎通。
4.  **UI/UX:** Adaptive Cards を用いたフォーム入力および動的リスト（救済リスト）の表示確認。

## 🛠️ 技術スタック

*   **Language:** TypeScript / Node.js
*   **AWS:** DynamoDB, Lambda, API Gateway, EventBridge
*   **Teams:** Power Automate, Adaptive Cards
*   **Libraries:** `@aws-sdk/*`, `@faker-js/faker`

## 📂 ディレクトリ構成 (想定)

```text
.
├── src/
│   ├── db/
│   │   ├── seed_user.ts       # UserProfile ダミーデータ投入
│   │   ├── seed_entry.ts      # WeeklyEntry エントリーデータ投入
│   │   └── test_query.ts      # データ取得(Query/Scan)検証
│   ├── logic/
│   │   └── matching.ts        # [Core] マッチングアルゴリズム実装
│   ├── api/
│   │   └── handler.ts         # Lambda用ハンドラー (API Gateway連携)
│   └── ui/
│       └── adaptive_card.ts   # カードJSON生成ロジック
├── package.json
└── README.md
```

## 🧪 検証ロードマップ & チェックリスト

検証は以下の4つのフェーズで進行します。

### Phase 1: データベース操作 (AWS SDK v3)
ローカル環境から DynamoDB を操作できるか検証するフェーズ。
- [x] **Setup:** AWS SDK v3 のインストールと `aws configure` 設定
- [x] **Table:** DynamoDB テーブル作成 (`UserProfile`, `WeeklyEntry`)
- [x] **Put:** `PutCommand` によるデータ保存 (Faker.js でダミーデータ生成)
- [x] **Scan:** `ScanCommand` による全件取得テスト
- [x] **Query:** `QueryCommand` による特定週 (`WeekId`) のエントリー取得
- [ ] **Error:** エラーハンドリング (型不一致や必須欠損時の挙動確認)

### Phase 2: マッチングロジック (Algorithm)
取得したデータを元に、Node.js 上で最適なペアを作成できるか検証するフェーズ。
- [ ] **Basic:** 単純マッチング（希望時間が一致するペアをランダムに作成）
- [ ] **Scoring:** 優先度ロジック（年次・部署・性別などを考慮した重み付け）
- [ ] **Remainder:** 端数処理（マッチしなかったユーザーのリスト化）
- [ ] **Exclusion:** 排他制御（同じユーザーが重複してマッチしないことの確認）
- [ ] **Output:** 結果をコンソールに出力し、想定通りのペアか確認

### Phase 3: Teams 連携・UI (Power Automate)
Teams と AWS の間でのデータ連携および表示崩れがないか検証するフェーズ。
- [ ] **Inbound (PA→AWS):** Power Automate から API Gateway へ JSON を POST できるか
- [ ] **Outbound (AWS→PA):** Lambda から Power Automate (Webhook) へ通知を送れるか
- [ ] **UI Design:** Adaptive Cards Designer で作成したJSONが Teams で崩れず表示されるか
- [ ] **Dynamic UI:** 動的コンテンツ（救済リストの繰り返し表示）が正しく描画されるか
- [ ] **Action:** カードのボタンを押して、入力値が正しく送信されるか

### Phase 4: 運用・非機能要件
実運用を想定した挙動の検証フェーズ。
- [ ] **Scheduler:** EventBridge から Lambda が定期実行されるか
- [ ] **Timeout:** Lambda の処理が Teams のタイムアウト（約10-15秒）以内に収まるか
- [ ] **Security:** API Gateway への API Key 認証設定と、PA側でのヘッダー付与

---

## 🚀 実行方法 (ローカル検証)

### 1. セットアップ
```bash
# 依存パッケージのインストール
npm install

# AWSクレデンシャルの設定 (未設定の場合)
aws configure
```
### 2.データ投入(DB検証)

```bash
# ユーザーマスタ作成 (20件)
npx ts-node src/seed_user.ts

# エントリーデータ作成 (特定の週)
npx ts-node src/seed_entry.ts
```
### 3.ロジック検証
```bash
# マッチング実行結果をコンソール出力
npx ts-node src/matching_logic.ts
```
## 📝 設計メモ (DynamoDB Schema)

### UserProfile Table
ユーザーの固定情報を管理します。

| 項目 | 型 | 役割 | 備考 |
| :--- | :--- | :--- | :--- |
| **UserId** | String | **PK** | Teamsのメールアドレス想定 |
| Name | String | 属性 | 表示名 |
| Department | String | 属性 | 部署（マッチングロジック用） |
| JoinYear | Number | 属性 | 入社年次（同期判定用） |

### WeeklyEntry Table
週ごとのエントリー状況を管理します。

| 項目 | 型 | 役割 | 備考 |
| :--- | :--- | :--- | :--- |
| **WeekId** | String | **PK** | `YYYY-Wxx` 形式 |
| **UserId** | String | **SK** | UserProfileのPKと紐付け |
| AvailableSlots | List | データ | 希望時間の配列 |
| IsPublicAllowed | Bool | データ | 救済リストへの掲載可否 |
| Status | String | 状態 | `Entry` / `Matched` / `Approved` / `Rejected` |
| MatchedPartner | String | 結果 | マッチした相手のUserId |