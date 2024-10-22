import { LambdaClient } from "@aws-sdk/client-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { SQSBatchItemFailure, SQSBatchResponse } from "aws-lambda";
import * as rp from "request-promise";
import { ERRORS } from "../assets/Enum";
import { credentials } from "../handler";
import { ActivitiesService } from "../services/ActivitiesService";
import { LambdaService } from "../services/LambdaService";
import { RetroGenerationService } from "../services/RetroGenerationService";
import { SharePointAuthenticationService } from "../services/SharePointAuthenticationService";
import { SharePointService } from "../services/SharePointService";
import { TestResultsService } from "../services/TestResultsService";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - SQS event that contains a DynamoDB stream event to parse out
 */
const retroGen = async (event: any): Promise<SQSBatchResponse> => {
  if (!event || !event.Records || !Array.isArray(event.Records) || !event.Records.length) {
    console.error("ERROR: event is not defined.");
    throw new Error(ERRORS.EventIsEmpty);
  }

  const retroService: RetroGenerationService = new RetroGenerationService(new TestResultsService(new LambdaService(new LambdaClient({ ...credentials }))), new ActivitiesService(new LambdaService(new LambdaClient({ ...credentials }))));
  const sharepointAuthenticationService = new SharePointAuthenticationService(rp);
  const sharePointService = new SharePointService(rp);
  const batchItemFailures: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    try {
      const recordBody = JSON.parse(record.body);
      const visit: any = unmarshall(recordBody?.dynamodb.NewImage);
      if (visit) {
        const generationServiceResponse = await retroService.generateRetroReport(visit);
        const tokenResponse = await sharepointAuthenticationService.getToken();
        const accessToken = JSON.parse(tokenResponse).access_token;
        await sharePointService.upload(generationServiceResponse.fileName, generationServiceResponse.fileBuffer, accessToken);
      }
    } catch (error) {
      console.error(`record id ${record.messageId}, error: ${error}`);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};

export { retroGen };
