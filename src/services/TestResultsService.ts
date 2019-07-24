import {IInvokeConfig} from "../models";
import {PromiseResult} from "aws-sdk/lib/request";
import {AWSError, Lambda} from "aws-sdk";
import {LambdaService} from "./LambdaService";
import {Configuration} from "../utils/Configuration";
import moment from "moment";
import {Service} from "../models/injector/ServiceDecorator";

@Service()
class TestResultsService {
    private readonly lambdaClient: LambdaService;
    private readonly config: Configuration;

    constructor(lambdaClient: LambdaService) {
        this.lambdaClient = lambdaClient;
        this.config = Configuration.getInstance();
    }

    /**
     * Retrieves test results based on the provided parameters
     * @param params - getTestResultsByTesterStaffId query parameters
     */
    public getTestResults(params: any): Promise<any> {
        const config: IInvokeConfig = this.config.getInvokeConfig();
        const invokeParams: any = {
            FunctionName: config.functions.testResults.name,
            InvocationType: "RequestResponse",
            LogType: "Tail",
            Payload: JSON.stringify({
                httpMethod: "GET",
                path: "/test-results/getTestResultsByTesterStaffId",
                queryStringParameters: params
            }),
        };
        return this.lambdaClient.invoke(invokeParams)
        .then((response: PromiseResult<Lambda.Types.InvocationResponse, AWSError>) => {
            const payload: any = this.lambdaClient.validateInvocationResponse(response); // Response validation
            const testResults: any[] = JSON.parse(payload.body); // Response conversion


            // Sort results by testEndTimestamp
            testResults.sort((first: any, second: any): number => {
                if (moment(first.testEndTimestamp).isBefore(second.testEndTimestamp)) {
                    return -1;
                }

                if (moment(first.testEndTimestamp).isAfter(second.testEndTimestamp)) {
                    return 1;
                }

                return 0;
            });

            return this.expandTestResults(testResults);
        });
    }

    /**
     * Helper method for expanding a single record with multiple test types
     * into multiple records with a single test type
     * @param testResults
     */
    private expandTestResults(testResults: any): any[] {
        return testResults
        .map((testResult: any) => { // Separate each test type in a record to form multiple test results
            const splittedRecords: any[] = [];
            const templateRecord: any = Object.assign({}, testResult);
            Object.assign(templateRecord, {});

            testResult.testTypes.forEach((testType: any, i: number, array: any[]) => {
                const clonedRecord: any = Object.assign({}, templateRecord); // Create test result from template
                Object.assign(clonedRecord, { testTypes: testType }); // Assign it the test type

                splittedRecords.push(clonedRecord);
            });

            return splittedRecords;
        })
        .reduce((acc: any[], val: any) => acc.concat(val), []); // Flatten the array
    }
}

export { TestResultsService };
