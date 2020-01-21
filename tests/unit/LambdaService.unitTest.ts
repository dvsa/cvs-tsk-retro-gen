import { LambdaService } from "../../src/services/LambdaService";
import { Lambda } from "aws-sdk";
import mockConfig from "../util/mockConfig";

describe("When LambdaService ", () => {
  mockConfig();
  context("gets 404", () => {
    it("should return an empty 200", async () => {
      const service = new LambdaService(new Lambda());
      const payload = await service.validateInvocationResponse({ Payload: "{\"statusCode\": 404, \"body\": \"No resource match the selected criteria\"}", StatusCode: 200 });
      expect(payload.statusCode).toEqual(200);
      expect(payload.body).toEqual("[]");
    });
  });
  context("gets 503", () => {
    it("should throw an error", async () => {
      const service = new LambdaService(new Lambda());
      try {
        const payload = await service.validateInvocationResponse({ Payload: "{\"statusCode\": 503, \"body\": \"Service unavailable\"}", StatusCode: 200 });
      } catch (e) {
        expect(e.message).toContain("Lambda invocation returned error");
        expect(e).toBeInstanceOf(Error);
      }
    });
  });

  describe("validateInvocationResponse is called", () => {
    const service = new LambdaService(new Lambda());
    describe("with 200 response", () => {
      describe("with well structured body", () => {
        it("returns parsed body", () => {
          const expectedResponse = { statusCode: 200, body: "my body" };
          const resp = service.validateInvocationResponse({ Payload: JSON.stringify(expectedResponse), StatusCode: 200 });
          expect(resp).toEqual(expectedResponse);
        });
      });

      describe("with empty body", () => {
        it("returns parsed body", () => {
          const expectedResponse = { statusCode: 200, body: "" };
          expect.assertions(1);
          try {
            service.validateInvocationResponse({ Payload: JSON.stringify(expectedResponse), StatusCode: 200 });
          } catch (e) {
            expect(e.message).toContain("Lambda invocation returned bad data");
          }
        });
      });
    });
    describe("with body saying 404 response", () => {
      it("returns 200 response with empty array", () => {
        const response = { statusCode: 404, body: "my body" };
        const expectedResponse = { statusCode: 200, body: "[]" };
        const output = service.validateInvocationResponse({ Payload: JSON.stringify(response), StatusCode: 200 });
        expect(output).toEqual(expectedResponse);
      });
    });

    describe("with body saying non-404 error code", () => {
      it("returns error", () => {
        const response = { statusCode: 418, body: "I am a teapot" };
        expect.assertions(2);
        try {
          service.validateInvocationResponse({ Payload: JSON.stringify(response), StatusCode: 200 });
        } catch (e) {
          expect(e.message).toContain("Lambda invocation returned error");
          expect(e.message).not.toContain("with empty payload");
        }
      });
    });

    describe("with genuine 404", () => {
      it("returns error", () => {
        expect.assertions(2);
        try {
          service.validateInvocationResponse({ Payload: "", StatusCode: 404 });
        } catch (e) {
          expect(e.message).toContain("Lambda invocation returned error");
          expect(e.message).toContain("with empty payload");
        }
      });
    });

  });
});
