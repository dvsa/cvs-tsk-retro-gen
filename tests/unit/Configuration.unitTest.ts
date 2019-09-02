import {expect} from "chai";
import {Configuration} from "../../src/utils/Configuration";
import {IInvokeConfig, ISPConfig} from "../../src/models";


// tslint:disable-next-line:only-arrow-functions
describe("ConfigurationUtil", function() {
    const config: Configuration = Configuration.getInstance();
    const branch = process.env.BRANCH;

    context("when calling getConfig() and config file is present", () => {
        it("should return config instance", () => {
            const configInstance: any = config.getConfig();
            expect(configInstance).not.eql(undefined);
        });
    });

    context("when calling getSharePointConfig() and secrets file is present", () => {
        it("should return config instance", () => {
            const sharePointConfigInstance: ISPConfig = config.getSharePointConfig();
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
