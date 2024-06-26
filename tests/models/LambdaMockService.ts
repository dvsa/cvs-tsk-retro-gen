import { InvokeCommandInput, InvokeCommandOutput } from "@aws-sdk/client-lambda";
import { ServiceException } from "@smithy/smithy-client";
import { Response } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import * as fs from "fs";
import * as path from "path";
import { IInvokeConfig } from "../../src/models";
import { Configuration } from "../../src/utils/Configuration";

interface IMockFunctions {
  functionName: string;
  response: string;
}

/**
 * Service for mocking the LambdaService
 */
class LambdaMockService {
  private static responses: IMockFunctions[] = [];

  /**
   * Populates the mock function responses
   */
  public static populateFunctions(): void {
    const invokeConfig: IInvokeConfig = Configuration.getInstance().getInvokeConfig();
    this.responses = Object.entries(invokeConfig.functions).map(([k, v]: [string, any]) => {
      return { functionName: v.name, response: fs.readFileSync(path.resolve(__dirname, `../../${v.mock}`)).toString() };
    });
  }

  /**
   * Purges the mock function responses
   */
  public static purgeFunctions(): void {
    this.responses = [];
  }

  /**
   * Change the response of a given function
   * @param fnName - the name of the function to change response for
   * @param fileName - the location of the json file to use as response, relative to the project root
   */
  public static changeResponse(fnName: string, fileName: string) {
    const mockFunction: IMockFunctions | undefined = LambdaMockService.responses.find((item: IMockFunctions) => item.functionName === fnName);

    if (!mockFunction) {
      throw new Error(`Function ${fnName} does not exist.`);
    }

    mockFunction.response = fs.readFileSync(path.resolve(__dirname, `../../${fileName}`)).toString();
  }

  /**
   * Invokes a lambda function based on the given parameters
   * @param params - InvocationRequest params
   */
  public async invoke(params: InvokeCommandInput): Promise<InvokeCommandOutput> {
    const mockFunction: IMockFunctions | undefined = LambdaMockService.responses.find((item: IMockFunctions) => item.functionName === params.FunctionName);

    if (!mockFunction) {
      const error: Error = new Error();
      Object.assign(error, {
        message: "Unsupported Media Type",
        code: "UnknownError",
        statusCode: 415,
        retryable: false,
      });

      throw error;
    }

    const payload: any = mockFunction.response;
    const response = new Response<InvokeCommandOutput, ServiceException>();
    Object.assign(response, {
      data: {
        StatusCode: 200,
        Payload: payload,
      },
    });

    return {
      $response: response,
      StatusCode: 200,
      Payload: payload,
    } as unknown as InvokeCommandOutput;
  }

  /**
   * Validates the invocation response
   * @param response - the invocation response
   */
  public validateInvocationResponse(response: InvokeCommandOutput): Promise<any> {
    if (!response.Payload || JSON.stringify(response.Payload) === "" || (response.StatusCode && response.StatusCode >= 400)) {
      throw new Error(`Lambda invocation returned error: ${response.StatusCode} with empty payload.`);
    }

    const payload: any = JSON.parse(JSON.stringify(response.Payload));

    if (payload.statusCode >= 400) {
      throw new Error(`Lambda invocation returned error: ${payload.statusCode} ${payload.body}`);
    }

    if (!payload.body) {
      throw new Error(`Lambda invocation returned bad data: ${JSON.stringify(payload)}.`);
    }

    return payload;
  }
}

export { LambdaMockService };
