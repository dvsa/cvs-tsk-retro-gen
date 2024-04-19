import { LambdaService } from "../../src/services/LambdaService";
import mockConfig from "../util/mockConfig";
import { LambdaClient, InvokeCommand, InvokeCommandOutput } from "@aws-sdk/client-lambda";
import { mockClient } from "aws-sdk-client-mock";
import { toUint8Array } from "@smithy/util-utf8";
describe("When LambdaService ", () => {
  const service = new LambdaService(new LambdaClient({}));
  const mockLambdaClient = mockClient(LambdaClient);
  mockConfig();

  afterAll(() => {
    service.lambdaClient.destroy();
  });
  describe("gets 404", () => {
    it("should return an empty 200", async () => {
      const payload = await service.validateInvocationResponse({ Payload: toUint8Array('{"statusCode": 404, "body": "No resource match the selected criteria"}'), StatusCode: 200 });
      expect(payload.statusCode).toEqual(200);
      expect(payload.body).toEqual("[]");
    });
  });

  describe("gets 503", () => {
    it("should throw an error", async () => {
      mockLambdaClient.on(InvokeCommand).resolves({
        Payload: toUint8Array('{ "statusCode": 503, "body": "Service unavailable" }'),
        StatusCode: 200,
      } as unknown as InvokeCommandOutput);
      try {
        const payload = await service.validateInvocationResponse(
          await service.invoke({
            FunctionName: "test",
            InvocationType: "RequestResponse",
            Payload: toUint8Array('{ "key": "test" }'),
          })
        );
      } catch (e) {
        expect(e.message).toContain("Lambda invocation returned error");
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe("validateInvocationResponse is called", () => {
    describe("with 200 response", () => {
      describe("with well structured body", () => {
        it("returns parsed body", async () => {
          const expectedResponse = { statusCode: 200, body: "my body" };
          mockLambdaClient.on(InvokeCommand).resolves({
            Payload: toUint8Array('{ "statusCode": 200, "body": "my body" }'),
            StatusCode: 200,
          } as unknown as InvokeCommandOutput);
          const resp = await service.validateInvocationResponse(
            await service.invoke({
              FunctionName: "test",
              InvocationType: "RequestResponse",
              Payload: toUint8Array('{ "key": "test" }'),
            })
          );
          expect(resp).toEqual(expectedResponse);
        });
      });

      describe("with empty body", () => {
        it("returns parsed body", async () => {
          mockLambdaClient.on(InvokeCommand).resolves({
            Payload: toUint8Array('{ "statusCode": 200, "body": "" }'),
            StatusCode: 200,
          } as unknown as InvokeCommandOutput);
          expect.assertions(1);
          try {
            await service.validateInvocationResponse(
              await service.invoke({
                FunctionName: "test",
                InvocationType: "RequestResponse",
                Payload: toUint8Array('{ "key": "test" }'),
              })
            );
          } catch (e) {
            expect(e.message).toContain("Lambda invocation returned bad data");
          }
        });
      });
    });

    describe("with body saying 404 response", () => {
      it("returns 200 response with empty array", async () => {
        const response = toUint8Array('{ "statusCode": 404, "body": "my body" }');
        const expectedResponse = { statusCode: 200, body: "[]" };
        mockLambdaClient.on(InvokeCommand).resolves({
          Payload: response,
          StatusCode: 200,
        } as unknown as InvokeCommandOutput);
        const output = await service.validateInvocationResponse(
          await service.invoke({
            FunctionName: "test",
            InvocationType: "RequestResponse",
            Payload: toUint8Array('{ "key": "test" }'),
          })
        );
        expect(output).toEqual(expectedResponse);
      });
    });

    describe("with body saying non-404 error code", () => {
      it("returns error", async () => {
        const response = toUint8Array('{ "statusCode": 418, "body": "I am a teapot" }');
        mockLambdaClient.on(InvokeCommand).resolves({
          Payload: response,
          StatusCode: 200,
        } as unknown as InvokeCommandOutput);
        expect.assertions(2);
        try {
          await service.validateInvocationResponse(
            await service.invoke({
              FunctionName: "test",
              InvocationType: "RequestResponse",
              Payload: toUint8Array('{ "key": "test" }'),
            })
          );
        } catch (e) {
          expect(e.message).toContain("Lambda invocation returned error");
          expect(e.message).not.toContain("with empty payload");
        }
      });
    });

    describe("with genuine 404", () => {
      it("returns error", async () => {
        expect.assertions(2);
        try {
          service.validateInvocationResponse({ Payload: "", StatusCode: 404 } as any);
        } catch (e) {
          expect(e.message).toContain("Lambda invocation returned error");
          expect(e.message).toContain("with empty payload");
        }
      });
    });
  });
});
