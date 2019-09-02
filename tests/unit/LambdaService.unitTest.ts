import { LambdaService } from "../../src/services/LambdaService";
import {expect} from "chai";
import {Lambda} from "aws-sdk";

describe("When LambdaService ", () => {
    context("gets 404", () => {
        it("should return an empty 200", async () => {
            const service = new LambdaService(new Lambda());
            const payload = await service.validateInvocationResponse({Payload: "{\"statusCode\": 404, \"body\": \"No resource match the selected criteria\"}", StatusCode: 200});
            expect(payload.statusCode).to.be.eql(200);
            expect(payload.body).to.be.eql("[]");
        });
    });
    context("gets 503", () => {
        it("should throw an error", async () => {
            const service = new LambdaService(new Lambda());
            try {
                const payload = await service.validateInvocationResponse({Payload: "{\"statusCode\": 503, \"body\": \"Service unavailable\"}", StatusCode: 200});
            } catch (e) {
                expect(e.message).to.contain("Lambda invocation returned error");
                expect(e).to.be.instanceOf(Error);
            }
        });
    });
});
