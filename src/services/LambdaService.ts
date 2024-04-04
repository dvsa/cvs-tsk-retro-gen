import { InvokeCommandInput, InvokeCommandOutput, LambdaClient, UpdateFunctionConfigurationCommand, InvokeCommand } from "@aws-sdk/client-lambda";
import { ServiceException } from "@smithy/smithy-client";
import { IInvokeConfig } from "../models";
import { Configuration } from "../utils/Configuration";
import { Endpoint, Provider } from "@aws-sdk/types";
import { LambdaClientResolvedConfig } from "@aws-sdk/client-lambda";
/* tslint:disable */
const AWSXRay = require("aws-xray-sdk");

/* tslint:enable */

/**
 * Service class for invoking external lambda functions
 */
class LambdaService {
  public readonly lambdaClient: LambdaClient;

  constructor(lambdaClient: LambdaClient) {
    const config: IInvokeConfig = Configuration.getInstance().getInvokeConfig();
    const lambdaconfig: LambdaClientResolvedConfig = lambdaClient.config;
    lambdaconfig.endpoint = config.params.endpoint as unknown as Provider<Endpoint>;
    const tempLambdaClient = new LambdaClient(lambdaconfig as any);
    this.lambdaClient = AWSXRay.captureAWSv3Client(tempLambdaClient);
  }

  /**
   * Invokes a lambda function based on the given parameters
   * @param params - InvocationRequest params
   */
  public async invoke(params: InvokeCommandInput): Promise<InvokeCommandOutput> {
    const command = new InvokeCommand(params);
    return this.lambdaClient.send(command);
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
