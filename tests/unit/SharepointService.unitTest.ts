import { SharePointService } from "../../src/services/SharePointService";
import mockConfig from "../util/mockConfig";


describe("SharepointService", () => {
  mockConfig();

  context("upload()", () => {
    context("when rp throws error", () => {
      const mock = { put: jest.fn().mockRejectedValue(new Error("Demo error")) };
      it("should throw error", async () => {
        const sharepointService = new SharePointService(mock);
        expect.assertions(1);
        try {
          await sharepointService.upload("demoFileName", Buffer.from("Demo FileBuffer"), "demoToken");
        } catch (error) {
          expect(error.message).toEqual("Demo error");
        }
      });
    });
    context("when rp doesn't throw error", () => {
      const mock = { put: jest.fn().mockReturnValue("Good response") };
      it("should not throw error", async () => {
        const sharepointService = new SharePointService(mock);
        expect.assertions(1);
        const response = await sharepointService.upload("demoFileName", Buffer.from("Demo FileBuffer"), "demoToken");
        expect(response).toEqual("Good response");
      });
    });

    context("When uploading a large file", () => {
      it("should create the upload session and successfully put the file to the generated url ", async () => {
        const mock = {
          put: jest.fn().mockReturnValue("Success response"),
          post: jest.fn().mockReturnValue(Promise.resolve({uploadUrl: "test"}))
        };
        const sharepointService = new SharePointService(mock);
        expect.assertions(2);
        const response = await sharepointService.uploadLargeFile("testFileName", Buffer.from("test string"), "testToken", "testFolder");
        expect(mock.put).toHaveBeenCalledTimes(1);
        expect(response).toEqual("Success response");
      });
    });

    context("When uploading", () => {
      it("should should fail if the session was not created successfully", async () => {
        const mock = {
          put: jest.fn().mockReturnValue("Success response"),
          post: jest.fn().mockReturnValue(Promise.reject("Error response"))
        };

        const sharepointService = new SharePointService(mock);
        expect.assertions(1);
        try {
          await sharepointService.uploadLargeFile("testFileName", Buffer.from("test string"), "testToken", "testFolder");
        } catch (error) {
          expect(error).toBe("Error response");
        }
      });
    });
  });
});
