import {describe} from "mocha";
import {expect} from "chai";
// import {SharePointAuthenticationService} from "../../src/services/SharePointAuthenticationService";
// import * as request from "request-promise";
import { default as proxyquire } from "proxyquire";
import sinon from "sinon";
const stub = sinon.stub();
const SharePointAuthenticationService = proxyquire("../../src/services/SharePointAuthenticationService", { "request-promise": stub });

describe("SharepointAuthenticationService", () => {
    context("getToken()", () => {
        context("when rp throws error", () => {
            // const stub = sinon.fake.returns(new Error("Demo error"));
            // sinon.replace(request, "get", stub);
            const sharePointAuthenticationService = new SharePointAuthenticationService();
            it("should throw error", () => {
                sharePointAuthenticationService.getToken()
                    .then((response: any) => {
                        console.log(response);
                        console.log("here");
                    })
                    .catch((error: any) => {
                        console.error(error);
                        console.log("or here");
                });
            });
        });
    });
});
