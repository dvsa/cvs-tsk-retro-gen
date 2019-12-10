import {SharePointService} from "../../src/services/SharePointService";
import mockConfig from "../util/mockConfig";


describe("SharepointService", () => {
    mockConfig();

    context("upload()", () => {
        context("when rp throws error", () => {
            const mock = {put: jest.fn().mockRejectedValue(new Error("Demo error"))};
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
        context("when rp doesn't throw error" , () => {
            const mock = {put: jest.fn().mockReturnValue("Good response")};
            it("should not throw error", async () => {
                const sharepointService = new SharePointService(mock);
                expect.assertions(1);
                const response = await sharepointService.upload("demoFileName", Buffer.from("Demo FileBuffer"), "demoToken");
                expect(response).toEqual("Good response");
            });
        });
    });
});
