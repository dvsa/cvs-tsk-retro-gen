import { expect } from "chai";
import { retroGen } from "../../src/functions/retroGen";
import { RetroGenerationService } from "../../src/services/RetroGenerationService";

describe("Retro Gen Function", () => {
  beforeAll(() => {
    jest.setTimeout(10000);
  });
  afterAll(() => {
    jest.setTimeout(5000);
  });
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
        await retroGen({ something: true });
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Event is empty");
      }
    });
    it("should throw errors (event Records is not array)", async () => {
      try {
        await retroGen({ Records: true });
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Event is empty");
      }
    });
    it("should throw errors (event Records array is empty)", async () => {
      try {
        await retroGen({ Records: [] });
        expect.fail();
      } catch (e) {
        expect(e.message).to.deep.equal("Event is empty");
      }
    });
  });
});
