import {expect} from "chai";
import {SharePointAuthenticationService} from "../../src/services/SharePointAuthenticationService";
import sinon from "sinon";

describe("SharepointAuthenticationService", () => {
    context("getToken()", () => {
        context("when rp throws error",  () => {
            const stub = sinon.fake.throws(new Error("Demo error"));
            const mock = {post: stub};
            const sharePointAuthenticationService = new SharePointAuthenticationService(mock);
            it("should throw error", async () => {
                try {
                    await sharePointAuthenticationService.getToken();
                    expect.fail();
                } catch (error) {
                    expect(error.message).to.equal("Demo error");
                }
            });
        });
        context("when rp doesn't throw error" , () => {
            const stub = sinon.fake.returns("Good response");
            const mock = {post: stub};
            it("should not throw error", async () => {
                const sharePointAuthenticationService = new SharePointAuthenticationService(mock);
                try {
                    const response = await sharePointAuthenticationService.getToken();
                    expect(response).to.eql("Good response");
                } catch (e) {
                    expect.fail();
                }
            });
        });
    });
});
