import {IActivityParam, IInvokeConfig} from "../models";
import { InvocationResponse } from "@aws-sdk/client-lambda";
import { LambdaService } from "./LambdaService";
import { Configuration } from "../utils/Configuration";
import { toUint8Array } from "@smithy/util-utf8";
import moment from "moment";
import { ActivitySchema } from "@dvsa/cvs-type-definitions/types/v1/activity";

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
  public getActivities(params: IActivityParam): Promise<ActivitySchema[]> {
    const config: IInvokeConfig = this.config.getInvokeConfig();
    const invokeParams: any = {
      FunctionName: config.functions.getActivities.name,
      InvocationType: "RequestResponse",
      LogType: "Tail",
      Payload: toUint8Array(
        JSON.stringify({
          httpMethod: "GET",
          path: "/activities/details",
          queryStringParameters: params,
        })
      ),
    };

    // TODO fail fast if activityType is not 'visit' as per CVSB-19853 - this code will be removed as part of the 'wait time epic'
    if (params.activityType !== "visit") {
      return Promise.resolve([]);
    }

    return this.lambdaClient.invoke(invokeParams).then((response: InvocationResponse) => {
      const payload: any = this.lambdaClient.validateInvocationResponse(response); // Response validation
      const activityResults: ActivitySchema[] = JSON.parse(payload.body); // Response conversion
      console.log(`Wait Activities: ${activityResults.length}`);

      // Sort results by startTime
      activityResults.sort((first: ActivitySchema, second: ActivitySchema): number => {
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
