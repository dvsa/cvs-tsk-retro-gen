import {expect} from "chai";
import {RetroGenerationService} from "../../src/services/RetroGenerationService";
import {retroGen} from "../../src/functions/retroGen";
import mockContext from "aws-lambda-mock-context";
import sinon from "sinon";
const sandbox = sinon.createSandbox();

const ctx = mockContext();


describe("Retro Gen Function", () => {
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
                await retroGen({something: true});
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Event is empty");
            }
        });
        it("should throw errors (event Records is not array)", async () => {
            try {
                await retroGen({Records: true});
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Event is empty");
            }
        });
        it("should throw errors (event Records array is empty)", async () => {
            try {
                await retroGen({Records: []});
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
            try {
                await retroGen({Records: [{body: true }]});
                expect.fail();
            } catch (e) {
                expect(e.message).to.deep.equal("Oh no!");
            }
        });
    });
});
