const mockUnmarshall = jest.fn();

import { expect } from "chai";
import { retroGen } from "../../src/functions/retroGen";
import { RetroGenerationService } from "../../src/services/RetroGenerationService";
// import mockContext from "aws-lambda-mock-context";
import sinon from "sinon";
// import mockConfig from "../util/mockConfig";

jest.mock("@aws-sdk/util-dynamodb", () => ({
  unmarshall: mockUnmarshall,
}));

const sandbox = sinon.createSandbox();
const mockPayload =
  "{\n" +
  '    "Records": [\n' +
  "        {\n" +
  '            "messageId": "6f8739e2-a9f0-45a5-ae97-21de4d4a223c",\n' +
  '            "receiptHandle": "AQEBh9gJn2UhJUXEfsnp8zZtDDo6if2tQL6XlDf23Ng+vE1JF2Z/vRENKz+3II6NFkOkL9EBCnQTeI8WxHR0HZ/+iHCuAixcWHQ8G+vp1l8pXBgRtCJVj3Zf+lVxXGhA9kEmwc5FomblrxGD1gOv092VMUCnQZAToeQwwTTjKOSU2u1QSv18CS7mm68xFmfn72CQhmRxbeLE3oWY1ehEgmCC45aoWFHskmTRwDe/BGhtlD0Gvpcy/5zEycoXhT7/LxRMNb2TgQ+Lef/b770foiYAuW6EcfIeE1J7/RH96Lvp7q1XGOWqJo8bZySDsTOdWqiPXnuUWW75iC72Pu5EChKswBF9cOzJWofc4QUCKxpgGEvp9o7so3cKMZx0nGOzsOtbKDvjQAblfjDgBCDol5GibA==",\n' +
  '            "body": "{\\"eventID\\":\\"7c4f89cd30f907cee1dce7105cfb0ac3\\",\\"eventName\\":\\"MODIFY\\",\\"eventVersion\\":\\"1.1\\",\\"eventSource\\":\\"aws:dynamodb\\",\\"awsRegion\\":\\"eu-west-1\\",\\"dynamodb\\":{\\"ApproximateCreationDateTime\\":1718274373,\\"Keys\\":{\\"id\\":{\\"S\\":\\"6e4bd304-446e-4678-8289-d34sca9256e9\\"}},\\"NewImage\\":{\\"testerStaffId\\":{\\"S\\":\\"132\\"},\\"testStationPNumber\\":{\\"S\\":\\"87-1369564\\"},\\"testerEmail\\":{\\"S\\":\\"tester@dvsa.gov.uk\\"},\\"testStationType\\":{\\"S\\":\\"gvts\\"},\\"testStationEmail\\":{\\"S\\":\\"teststationname@dvsa.gov.uk\\"},\\"startTime\\":{\\"S\\":\\"2022-01-01T10:00:40.561Z\\"},\\"endTime\\":{\\"S\\":\\"2022-01-01T12:00:40.561Z\\"},\\"id\\":{\\"S\\":\\"6e4bd304-446e-4678-8289-d34sca9256e9\\"},\\"testStationName\\":{\\"S\\":\\"Rowe, Wunsch and Wisoky\\"},\\"activityType\\":{\\"S\\":\\"visit\\"},\\"activityDay\\":{\\"S\\":\\"2022-01-01\\"},\\"testerName\\":{\\"S\\":\\"Gica\\"}},\\"OldImage\\":{\\"testerStaffId\\":{\\"S\\":\\"132\\"},\\"testStationPNumber\\":{\\"S\\":\\"87-1369564\\"},\\"testerEmail\\":{\\"S\\":\\"tester@dvsa.gov.uk\\"},\\"testStationType\\":{\\"S\\":\\"gvts\\"},\\"testStationEmail\\":{\\"S\\":\\"teststationname@dvsa.gov.uk\\"},\\"startTime\\":{\\"S\\":\\"2022-01-01T10:00:40.561Z\\"},\\"endTime\\":{\\"NULL\\":true},\\"id\\":{\\"S\\":\\"6e4bd304-446e-4678-8289-d34sca9256e9\\"},\\"testStationName\\":{\\"S\\":\\"Rowe, Wunsch and Wisoky\\"},\\"activityType\\":{\\"S\\":\\"visit\\"},\\"activityDay\\":{\\"S\\":\\"2022-01-01\\"},\\"testerName\\":{\\"S\\":\\"Gica\\"}},\\"SequenceNumber\\":\\"4138100000000062483042156\\",\\"SizeBytes\\":669,\\"StreamViewType\\":\\"NEW_AND_OLD_IMAGES\\"},\\"eventSourceARN\\":\\"arn:aws:dynamodb:eu-west-1:006106226016:table/cvs-cb2-12581-activities/stream/2024-06-12T13:13:09.068\\"}",\n' +
  '            "attributes": {\n' +
  '                "ApproximateReceiveCount": "1",\n' +
  '                "SentTimestamp": "1718274373730",\n' +
  '                "SenderId": "AIDAISMY7JYY5F7RTT6AO",\n' +
  '                "ApproximateFirstReceiveTimestamp": "1718274373734"\n' +
  "            },\n" +
  '            "messageAttributes": {},\n' +
  '            "md5OfBody": "5de3621a912f3225c7dc9500a4efcae8",\n' +
  '            "eventSource": "aws:sqs",\n' +
  '            "eventSourceARN": "arn:aws:sqs:eu-west-1:006106226016:retro-gen-cb2-12581-queue",\n' +
  '            "awsRegion": "eu-west-1"\n' +
  "        }\n" +
  "    ]\n" +
  "}";

describe("Retro Gen Function", () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });
  afterAll(() => {
    jest.setTimeout(5000);
  });
  context("Receiving an empty event (of various types)", () => {
    it("should throw errors (event = {})", async () => {
      try {
        await retroGen({});
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Event is empty");
      }
    });
    it("should throw errors (event = null)", async () => {
      try {
        await retroGen(null);
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Event is empty");
      }
    });
    it("should throw errors (event has no records)", async () => {
      try {
        await retroGen({ something: true });
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Event is empty");
      }
    });
    it("should throw errors (event Records is not array)", async () => {
      try {
        await retroGen({ Records: true });
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Event is empty");
      }
    });
    it("should throw errors (event Records array is empty)", async () => {
      try {
        await retroGen({ Records: [] });
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Event is empty");
      }
    });
  });
});
