import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { fakerJA as faker } from "@faker-js/faker"; // 日本語データを使用


const options = ["2026-W1", "2026-W2"];
const times = ["Mon_1200", "Mon_1230", "Mon_1800",
    "Tue_1200", "Tue_1900",
    "Wed_1200", "Wed_1500",
    "Thu_1200", "Thu_1800",
    "Fri_1200", "Fri_1900"];

const client = new DynamoDBClient({ region: "ap-northeast-1"});
const docClient = DynamoDBDocumentClient.from(client);

export const scan = async() => {
    const scanCommand = new ScanCommand({
        ProjectionExpression: "UserId",
        TableName: "UserProfile",
    });
    const response = await docClient.send(scanCommand);
    console.log(response.Items);
    if(!response.Items){
        console.log("データがありません");
        return;
    }

    for (let i = 0; i < response.Items.length; i++ ){
    const weekly = {
        WeekId: faker.helpers.arrayElement(options),
        UserId: response.Items[i]?.UserId,
        AvailableTime: faker.helpers.arrayElements(times, {min:1, max:3}),
    }
    const command = new PutCommand({
        TableName: "WeeklyEntry",
        Item: weekly,
    });

    try {
        await docClient.send(command);
        console.log(`✅ 登録完了: ${weekly.WeekId} ${weekly.UserId} ${weekly.AvailableTime}`)
    } catch (error){
        console.error(`❌ エラー: ${weekly.UserId}`, error);
    } 
}
console.log("✨ 全データの投入が完了しました！");
}
scan();