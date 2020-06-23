import { expect } from "chai";
import { Configuration } from "../../src/utils/Configuration";
import {IInvokeConfig, IS3Config, ISPConfig} from "../../src/models";
import mockConfig from "../util/mockConfig";

describe("ConfigurationUtil", () => {
  mockConfig();
  const config: Configuration = Configuration.getInstance();
  const branch = process.env.BRANCH;

  context("when calling getConfig() and config file is present", () => {
    it("should return config instance", () => {
      const configInstance: any = config.getConfig();
      expect(configInstance).not.eql(undefined);
    });
  });

  context("when calling .getS3Config()", () => {
    it("should return config instance", async () => {
      const s3config: IS3Config = await config.getS3Config();
      expect(s3config).not.eql(undefined);
    });
  });

  context("when calling getSharePointConfig() and secrets file is present", () => {
    it("should return config instance", async () => {
      const sharePointConfigInstance: ISPConfig = await config.getSharePointConfig();
      expect(sharePointConfigInstance).not.eql(undefined);
    });
  });

  context("when calling getInvokeConfig() and the BRANCH environment variable is not defined", () => {
    it("should return local invokeConfig", () => {
      process.env.BRANCH = "";
      const invokeConfigInstance: IInvokeConfig = config.getInvokeConfig();
      expect(invokeConfigInstance.params.endpoint).to.not.be.eql(undefined);
      expect(invokeConfigInstance.params.endpoint).to.be.eql("http://localhost:3013");
    });
  });
  context("when calling getInvokeConfig() and the BRANCH environment variable is local", () => {
    it("should return local invokeConfig", () => {
      process.env.BRANCH = "local";
      const invokeConfigInstance: IInvokeConfig = config.getInvokeConfig();
      expect(invokeConfigInstance.params.endpoint).to.not.be.eql(undefined);
      expect(invokeConfigInstance.params.endpoint).to.be.eql("http://localhost:3013");
    });
  });
  process.env.BRANCH = branch;
});
