import { unmarshall } from "@aws-sdk/util-dynamodb";
import { LambdaClient } from "@aws-sdk/client-lambda";
import * as rp from "request-promise";
import { ERRORS } from "../assets/Enum";
import { RetroGenerationService } from "../services/RetroGenerationService";
import { SharePointAuthenticationService } from "../services/SharePointAuthenticationService";
import { SharePointService } from "../services/SharePointService";
import { TestResultsService } from "../services/TestResultsService";
import { ActivitiesService } from "../services/ActivitiesService";
import { LambdaService } from "../services/LambdaService";
import { PutObjectCommandOutput } from "@aws-sdk/client-s3";
import { credentials } from "../handler";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 */
const retroGen = async (event: any): Promise<void | PutObjectCommandOutput[]> => {
  if (!event || !event.Records || !Array.isArray(event.Records) || !event.Records.length) {
    console.error("ERROR: event is not defined.");
    throw new Error(ERRORS.EventIsEmpty);
  }

  const retroService: RetroGenerationService = new RetroGenerationService(new TestResultsService(new LambdaService(new LambdaClient({ ...credentials }))), new ActivitiesService(new LambdaService(new LambdaClient({ ...credentials }))));
  const retroUploadPromises: Array<Promise<PutObjectCommandOutput>> = [];
  const sharepointAuthenticationService = new SharePointAuthenticationService(rp);
  const sharePointService = new SharePointService(rp);

  event.Records.forEach((record: any) => {
    const recordBody = JSON.parse(record.body);
    const visit: any = unmarshall(recordBody?.dynamodb.NewImage);
    if (visit) {
      const retroUploadPromise = retroService.generateRetroReport(visit).then(async (generationServiceResponse: { fileName: string; fileBuffer: Buffer }) => {
        const tokenResponse = await sharepointAuthenticationService.getToken();
        const accessToken = JSON.parse(tokenResponse).access_token;
        return await sharePointService.upload(generationServiceResponse.fileName, generationServiceResponse.fileBuffer, accessToken);
      });

      retroUploadPromises.push(retroUploadPromise);
    }
  });

  return Promise.all(retroUploadPromises).catch((error: any) => {
    console.error(error);
    throw error;
  });
};

export { retroGen };
