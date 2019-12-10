import {SharePointAuthenticationService} from "../../src/services/SharePointAuthenticationService";
import sinon from "sinon";
import mockConfig from "../util/mockConfig";

describe("SharepointAuthenticationService", () => {
    mockConfig();
    context("getToken()", () => {
        context("when rp throws error",  () => {
            const stub = sinon.fake.throws(new Error("Demo error"));
            const mock = {post: stub};
            const sharePointAuthenticationService = new SharePointAuthenticationService(mock);
            it("should throw error", async () => {
                expect.assertions(1);
                try {
                    await sharePointAuthenticationService.getToken();
                } catch (error) {
                    expect(error.message).toEqual("Demo error");
                }
            });
        });
        context("when rp doesn't throw error" , () => {
            const stub = sinon.fake.returns("Good response");
            const mock = {post: stub};
            it("should not throw error", async () => {
                const sharePointAuthenticationService = new SharePointAuthenticationService(mock);
                expect.assertions(1);
                const response = await sharePointAuthenticationService.getToken();
                expect(response).toEqual("Good response");
            });
        });
    });
});
