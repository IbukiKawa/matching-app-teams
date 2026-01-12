import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { fakerJA as faker } from "@faker-js/faker"; // 日本語データを使用

// 1. DynamoDBクライアントの初期化
// AWSの認証情報（プロファイルなど）はPCの設定を自動で読み込みます
const client = new DynamoDBClient({ region: "ap-northeast-1" }); 
const docClient = DynamoDBDocumentClient.from(client);

// 2. 部署と年次のリスト（ランダム選択用）
const DEPARTMENTS = ["営業部", "開発部", "人事部", "総務部", "マーケティング部"];
const JOIN_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024];

// 3. メイン処理
const main = async () => {
  console.log("🚀 データ投入を開始します...");

  // 20人分のデータを作成して投入
  for (let i = 0; i < 20; i++) {
    const user = {
      UserId: faker.internet.email(), // PK: メールアドレス
      Name: faker.person.fullName(),
      Department: faker.helpers.arrayElement(DEPARTMENTS),
      JoinYear: faker.helpers.arrayElement(JOIN_YEARS),
      Gender: faker.person.sex(),
    };

    // PutCommand: データを1件保存する
    const command = new PutCommand({
      TableName: "UserProfile",
      Item: user,
    });

    try {
      await docClient.send(command);
      console.log(`✅ 登録完了: ${user.Name} (${user.UserId})`);
    } catch (error) {
      console.error(`❌ エラー: ${user.Name}`, error);
    }
  }

  console.log("✨ 全データの投入が完了しました！");
};

main();