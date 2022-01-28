import {IActivity} from "../../src/models";
import json from "../resources/local-stream-event.json";

import testResultResponse from "../resources/test-results-200-response.json";
import activities from "../resources/wait-time-response.json";
import {TestResultsService} from "../../src/services/TestResultsService";
import {RetroGenerationService} from "../../src/services/RetroGenerationService";
import * as Excel from "exceljs";
import {Duplex} from "stream";
import {TimeZone} from "../../src/assets/Enum";
import moment from "moment";

const activity: IActivity = JSON.parse(json.Records[0].body);

it("should return a valid xlsx file as buffer", () => {
  // TO tests in CI
  console.log("testResultResponse.body");
  console.log(testResultResponse.body);
  console.log("activities.body");
  console.log(activities.body);
  const testResultsServiceMock = jest.fn().mockImplementation(() => {
    return {
      getTestResults: () => {
        return Promise.resolve(TestResultsService.prototype.expandTestResults(JSON.parse(testResultResponse.body)));
      },
      // getTestResults: () => Promise.resolve(JSON.parse(testResultResponse.body))
    };
  });
  const activitiesServiceMock = jest.fn().mockImplementation(() => {
    return {
      getActivities: () => Promise.resolve(JSON.parse(activities.body)),
    };
  });
  const retroGenerationService: RetroGenerationService = new RetroGenerationService(new testResultsServiceMock(), new activitiesServiceMock());
  return retroGenerationService.generateRetroReport(activity).then((result: any) => {
    const workbook = new Excel.Workbook();
    const stream = new Duplex();
    stream.push(result.fileBuffer); // Convert the incoming file to a readable stream
    stream.push(null);

    return workbook.xlsx.read(stream).then((excelFile: any) => {
      const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

      expect(excelFile.creator).toEqual("Commercial Vehicles Services Beta Team");
      expect(excelFile.company).toEqual("Drivers and Vehicles Standards Agency");
      expect(reportSheet.name).toEqual("Retrokey report");

      expect(reportSheet.getCell("B16").value).toEqual("Activity");
      // tslint:disable-next-line
      expect(reportSheet.getCell("B17").value).not.toBeNull();
      expect(reportSheet.getCell("B29").value).toEqual("Document Requests");

      workbook.xlsx.writeFile("RetrokeyReport_" +
        moment(activity.startTime).tz(TimeZone.LONDON).format("DD-MM-YYYY") +
        "_" +
        moment(activity.startTime).tz(TimeZone.LONDON).format("HHmm") +
        "_" +
        activity.testStationPNumber +
        "_" +
        activity.testerName +
        ".xlsx");
    });
  });
});
