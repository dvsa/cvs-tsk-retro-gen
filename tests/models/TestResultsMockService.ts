import {LambdaService} from "../../src/services/LambdaService";
import {Service} from "../../src/models/injector/ServiceDecorator";
import {Configuration} from "../../src/utils/Configuration";

@Service()
class TestResultsMockService {
    private readonly lambdaClient: LambdaService;
    private readonly config: Configuration;
    public getTestResultsMockResponse: any;
    // @ts-ignore
    public expandTestResultsMockResponse: any[];

    constructor(lambdaClient: LambdaService) {
        this.lambdaClient = lambdaClient;
        this.config = Configuration.getInstance();
    }

    /**
     * Mock method to retrieve testResults.
     * @param params - present here just to match the signature of the real method
     */
    public getTestResults(params: any): Promise<any> {
        return Promise.resolve(this.expandTestResults(this.getTestResultsMockResponse));
    }

    /**
     * Utility method present here just to match the main service model
     * @param testResults - testResults object
     */
    private expandTestResults(testResults: any): any[] {
        // @ts-ignore
        return Promise.resolve(this.expandTestResultsMockResponse);
    }
}

export { TestResultsMockService };