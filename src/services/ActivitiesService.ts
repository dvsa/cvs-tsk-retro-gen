import { IInvokeConfig } from "../models";
import { PromiseResult } from "aws-sdk/lib/request";
import { AWSError, Lambda } from "aws-sdk";
import { LambdaService } from "./LambdaService";
import { Configuration } from "../utils/Configuration";
import moment from "moment";

class ActivitiesService {
  private readonly lambdaClient: LambdaService;
  private readonly config: Configuration;

  constructor(lambdaClient: LambdaService) {
    this.lambdaClient = lambdaClient;
    this.config = Configuration.getInstance();
  }

  /**
   * Retrieves Activities based on the provided parameters
   * @param params - getActivities query parameters
   */
  public getActivities(params: any): Promise<any> {
    const config: IInvokeConfig = this.config.getInvokeConfig();
    const invokeParams: any = {
      FunctionName: config.functions.getActivities.name,
      InvocationType: "RequestResponse",
      LogType: "Tail",
      Payload: JSON.stringify({
        httpMethod: "GET",
        path: "/activities/details",
        queryStringParameters: params,
      }),
    };

    // TODO fail fast if activityType is not 'visit' as per CVSB-19853 - this code will be removed as part of the 'wait time epic'
    if (invokeParams.Payload.queryStringParameters.activityType !== "visit") {
      return Promise.resolve([]);
    }

    return this.lambdaClient.invoke(invokeParams).then((response: PromiseResult<Lambda.Types.InvocationResponse, AWSError>) => {
      const payload: any = this.lambdaClient.validateInvocationResponse(response); // Response validation
      const activityResults: any[] = JSON.parse(payload.body); // Response conversion
      console.log(`Wait Activities: ${activityResults.length}`);

      // Sort results by startTime
      activityResults.sort((first: any, second: any): number => {
        if (moment(first.startTime).isBefore(second.startTime)) {
          return -1;
        }

        if (moment(first.startTime).isAfter(second.startTime)) {
          return 1;
        }

        return 0;
      });

      return activityResults;
    });
  }
}

export { ActivitiesService };
