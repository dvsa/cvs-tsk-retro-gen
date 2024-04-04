const mockProcessRecord = jest.fn();

import { expect } from "chai";
import { retroGen } from "../../src/functions/retroGen";
import { RetroGenerationService } from "../../src/services/RetroGenerationService";
// import mockContext from "aws-lambda-mock-context";
import sinon from "sinon";
// import mockConfig from "../util/mockConfig";

jest.mock("@dvsa/cvs-microservice-common/functions/sqsFilter", () => ({
  processRecord: mockProcessRecord,
}));

const sandbox = sinon.createSandbox();
const mockPayload =
  '{\n "Type" : "Notification",\n "MessageId" : "-c9d5---",\n "TopicArn" : "tf-visit",\n "Message" : "{\\"eventID\\":\\"f9e63bf29bd6adf174e308201a97259f\\",\\"eventName\\":\\"MODIFY\\",\\"eventVersion\\":\\"1.1\\",\\"eventSource\\":\\"aws:dynamodb\\",\\"awsRegion\\":\\"eu-west-1\\",\\"dynamodb\\":{\\"ApproximateCreationDateTime\\":1711549645,\\"Keys\\":{\\"id\\":{\\"S\\":\\"6e4bd304-446e-4678-8289-dasdasjkl\\"}},\\"NewImage\\":{\\"testerStaffId\\":{\\"S\\":\\"132\\"},\\"testStationPNumber\\":{\\"S\\":\\"87-1369564\\"},\\"testerEmail\\":{\\"S\\":\\"tester@dvsa.gov.uk1111\\"},\\"testStationType\\":{\\"S\\":\\"gvts\\"},\\"testStationEmail\\":{\\"S\\":\\"teststationname@dvsa.gov.uk\\"},\\"startTime\\":{\\"S\\":\\"2022-01-01T10:00:40.561Z\\"},\\"endTime\\":{\\"S\\":\\"2022-01-01T10:00:40.561Z\\"},\\"id\\":{\\"S\\":\\"6e4bd304-446e-4678-8289-dasdasjkl\\"},\\"testStationName\\":{\\"S\\":\\"Rowe, Wunsch and Wisoky\\"},\\"activityType\\":{\\"S\\":\\"visit\\"},\\"activityDay\\":{\\"S\\":\\"2022-01-01\\"},\\"testerName\\":{\\"S\\":\\"namey mcname\\"}},\\"OldImage\\":{\\"testerStaffId\\":{\\"S\\":\\"132\\"},\\"testStationPNumber\\":{\\"S\\":\\"87-1369564\\"},\\"testerEmail\\":{\\"S\\":\\"tester@dvsa.gov.uk1111\\"},\\"testStationType\\":{\\"S\\":\\"gvts\\"},\\"testStationEmail\\":{\\"S\\":\\"teststationname@dvsa.gov.uk\\"},\\"startTime\\":{\\"S\\":\\"2022-01-01T10:00:40.561Z\\"},\\"endTime\\":{\\"S\\":\\"2022-01-01T10:00:40.561Z\\"},\\"id\\":{\\"S\\":\\"6e4bd304-446e-4678-8289-dasdasjkl\\"},\\"testStationName\\":{\\"S\\":\\"Rowe, Wunsch and Wisoky\\"},\\"activityType\\":{\\"S\\":\\"visit\\"},\\"activityDay\\":{\\"S\\":\\"2022-01-01\\"},\\"testerName\\":{\\"S\\":\\"231232132\\"}},\\"SequenceNumber\\":\\"1234\\",\\"SizeBytes\\":704,\\"StreamViewType\\":\\"NEW_AND_OLD_IMAGES\\"},\\"eventSourceARN\\":\\"arn:aws::eu--1::/cvs---//:32:37.491\\"}",\n "Timestamp" : "2024-03-27T14:27:25.926Z",\n "SignatureVersion" : "1",\n "Signature" : "+/+/+3//+//2f3y0TI+/+//---"\n}';

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

  context("Inner services fail", () => {
    afterEach(() => {
      sandbox.restore();
    });

    it("Should throw an error (generateRetroReport fails)", async () => {
      sandbox.stub(RetroGenerationService.prototype, "generateRetroReport").throws(new Error("Oh no!"));
      mockProcessRecord.mockReturnValueOnce("All good");
      try {
        await retroGen({ Records: [{ body: mockPayload }] });
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Oh no!");
      }
    });
  });
});
