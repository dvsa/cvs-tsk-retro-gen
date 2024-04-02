import DynamoDB from "aws-sdk/clients/dynamodb";

export const processRecord = (record: any) => {
  const recordBody = JSON.parse(JSON.parse(record.body).Message);
  if (recordBody.eventName === "MODIFY" && recordBody.dynamodb && recordBody.dynamodb.NewImage) {
    return DynamoDB.Converter.unmarshall(recordBody.dynamodb.NewImage);
  }
  console.error(`process return undefined, record is ${JSON.stringify(recordBody)}`);
  return undefined;
};
