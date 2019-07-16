import {describe} from "mocha";
import {expect} from "chai";
import {SharePointService} from "../../src/services/SharePointService";
import sinon from "sinon";


describe("SharepointService", () => {
    context("upload()", () => {
        context("when rp throws error", () => {
            const stub = sinon.fake.throws(new Error("Demo error"));
            const mock = {put: stub};
            it("should throw error", async () => {
                const sharepointService = new SharePointService(mock);
                try {
                    await sharepointService.upload("demoFileName", Buffer.from("Demo FileBuffer"), "demoToken");
                    expect.fail();
                } catch (error) {
                    expect(error.message).to.eql("Demo error");
                }
            });
        });
        context("when rp doesn't throw error" , () => {
            const stub = sinon.fake.returns("Good response");
            const mock = {put: stub};
            it("should not throw error", async () => {
                const sharepointService = new SharePointService(mock);
                try {
                    const response = await sharepointService.upload("demoFileName", Buffer.from("Demo FileBuffer"), "demoToken");
                    expect(response).to.eql("Good response");
                } catch (e) {
                    expect.fail();
                }
            });
        });
    });
});
