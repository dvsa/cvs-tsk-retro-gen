import { InvokeCommandInput, InvokeCommandOutput, Lambda } from "@aws-sdk/client-lambda";
import { ServiceException } from "@smithy/smithy-client";
import { IInvokeConfig } from "../models";
import { Configuration } from "../utils/Configuration";
/* tslint:disable */
const AWSXRay = require("aws-xray-sdk");

/* tslint:enable */

/**
 * Service class for invoking external lambda functions
 */
class LambdaService {
  public readonly lambdaClient: Lambda;

  constructor(lambdaClient: Lambda) {
    const config: IInvokeConfig = Configuration.getInstance().getInvokeConfig();
    this.lambdaClient = AWSXRay.captureAWSClient(lambdaClient);

    AWSConfig.lambda = config.params;
  }

  /**
   * Invokes a lambda function based on the given parameters
   * @param params - InvocationRequest params
   */
  public async invoke(params: InvokeCommandInput): Promise<PromiseResult<InvokeCommandOutput, ServiceException>> {
    return this.lambdaClient.invoke(params);
  }

  /**
   * Used to change a 404 response to a 200 one with empty body.
   * @param payload - 404 payload that needs to be converted.
   */
  public convertEmptyResponse(payload: any) {
    payload.body = "[]";
    payload.statusCode = 200;

    return payload;
  }

  /**
   * Validates the invocation response
   * @param response - the invocation response
   */

  public validateInvocationResponse(response: InvokeCommandOutput): Promise<any> {
    // @ts-ignore
    if (!response.Payload || response.Payload === "" || (response.StatusCode && response.StatusCode >= 400)) {
      throw new Error(`Lambda invocation returned error: ${response.StatusCode} with empty payload.`);
    }

    let payload: any = JSON.parse(JSON.stringify(response.Payload));

    if (payload.statusCode >= 400 && payload.statusCode !== 404) {
      throw new Error(`Lambda invocation returned error: ${payload.statusCode} ${payload.body}`);
    }

    if (!payload.body) {
      throw new Error(`Lambda invocation returned bad data: ${JSON.stringify(payload)}.`);
    }

    if (payload.statusCode === 404) {
      payload = this.convertEmptyResponse(payload);
    }

    return payload;
  }
}

export { LambdaService };
