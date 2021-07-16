import { RetroGenerationService } from "../../src/services/RetroGenerationService";
import * as Excel from "exceljs";
import { TestResultsService } from "../../src/services/TestResultsService";
import { IActivity, ITestResults } from "../../src/models";
import { Duplex } from "stream";
import { ActivitiesService } from "../../src/services/ActivitiesService";
import testResultResponse from "../resources/test-results-200-response.json";
import hgvTrlResults from "../resources/hgv-trl-test-results.json";
import activities from "../resources/wait-time-response.json";
import queueEvent from "../resources/queue-event.json";
import mockConfig from "../util/mockConfig";

describe("RetroGenerationService", () => {
  beforeAll(() => jest.setTimeout(10000));
  afterAll(() => {
    jest.setTimeout(5000);
    return new Promise((r) => setTimeout(r, 0));
  });
  mockConfig();

  context("when generating a template", () => {
    const lambdaServiceMock = jest.fn();
    const testResultsService: TestResultsService = new TestResultsService(new lambdaServiceMock());
    const activitiesService: ActivitiesService = new ActivitiesService(new lambdaServiceMock());
    const retroGenerationService: RetroGenerationService = new RetroGenerationService(testResultsService, activitiesService);
    context("and providing the number of rows the template will contain", () => {
      it("should return a template containing the provided number of rows", () => {
        return retroGenerationService.fetchRetroTemplate(10).then((result: any) => {
          const siteVisitDetails: any = result.reportTemplate.siteVisitDetails;
          const declaration: any = result.reportTemplate.declaration;
          const activityDetails: any = result.reportTemplate.activityDetails;

          // Validate site visit details
          expect(siteVisitDetails.assesor._address).toEqual("C4");
          expect(siteVisitDetails.date._address).toEqual("F6");
          expect(siteVisitDetails.siteName._address).toEqual("F4");
          expect(siteVisitDetails.siteNumber._address).toEqual("F5");
          expect(siteVisitDetails.startTime._address).toEqual("C6");
          expect(siteVisitDetails.endTime._address).toEqual("C7");
          expect(siteVisitDetails.endDate._address).toEqual("F7");

          // Validate activity details
          expect(activityDetails.length).toEqual(10);
        });
      });

      it("should still return a template when requested length is 0", () => {
        return retroGenerationService.fetchRetroTemplate(0).then((result: any) => {
          const siteVisitDetails: any = result.reportTemplate.siteVisitDetails;
          const declaration: any = result.reportTemplate.declaration;
          const activityDetails: any = result.reportTemplate.activityDetails;

          // Validate site visit details
          expect(siteVisitDetails.assesor._address).toEqual("C4");
          expect(siteVisitDetails.date._address).toEqual("F6");
          expect(siteVisitDetails.siteName._address).toEqual("F4");
          expect(siteVisitDetails.siteNumber._address).toEqual("F5");
          expect(siteVisitDetails.startTime._address).toEqual("C6");
          expect(siteVisitDetails.endTime._address).toEqual("C7");
          expect(siteVisitDetails.endDate._address).toEqual("F7");

          // Validate activity details
          expect(activityDetails.length).toEqual(0);
        });
      });
    });
  });

  context("when generating a report", () => {
    const activity: IActivity = JSON.parse(queueEvent.Records[0].body);

    it("should return a valid xlsx file as buffer", () => {
      // TO tests in CI
      console.log("testResultResponse.body");
      console.log(testResultResponse.body);
      console.log("activities.body");
      console.log(activities.body);
      const testResultsServiceMock = jest.fn().mockImplementation(() => {
        return {
          getTestResults: () => Promise.resolve(TestResultsService.prototype.expandTestResults(JSON.parse(testResultResponse.body))),
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
        });
      });
    });

    context("with more than 11 tests", () => {
      it("should extend the template to fit", () => {
        const testResult = JSON.parse(testResultResponse.body)[0];
        const myTests: ITestResults[] = [];
        for (let i = 0; i < 20; i++) {
          myTests.push(testResult);
        }
        const mockTestResultsService = jest.fn().mockImplementation(() => {
          return {
            getTestResults: () => Promise.resolve(TestResultsService.prototype.expandTestResults(myTests)),
          };
        });
        const mockActivitiesService = jest.fn().mockImplementation(() => {
          return {
            getActivities: () => Promise.resolve([]),
          };
        });
        const retroGenSvc = new RetroGenerationService(new mockTestResultsService(), new mockActivitiesService());
        return retroGenSvc.generateRetroReport(activity).then((result: any) => {
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
            expect(reportSheet.getCell("B17").value).toEqual("Test");
            expect(reportSheet.getCell("B36").value).toEqual("Test");
            expect(reportSheet.getCell("B38").value).toEqual("Document Requests");
          });
        });
      });
    });
    it("should return a valid xlsx file as buffer with Time not Testing activity added in the report", () => {
      const testResultsServiceMock = jest.fn().mockImplementation(() => {
        return {
          getTestResults: () => Promise.resolve(TestResultsService.prototype.expandTestResults(JSON.parse(testResultResponse.body))),
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
          // Validate Time not Testing fields.
          expect(reportSheet.getCell("B18").value).toEqual("Time not Testing");
          expect(reportSheet.getCell("C18").value).toEqual("10:37:33");
          expect(reportSheet.getCell("D18").value).toEqual("10:43:33");
          expect(reportSheet.getCell("M18").value).toContain("Reason for waiting: Break;");
        });
      });
    });

    context("and testResults returns HGVs and TRLs", () => {
      it("should return a valid xlsx file as buffer with trailerId populated for trl vehicles and noOfAxles populated for hgv and trl vehicles", async () => {
        const testResultsServiceMock = jest.fn().mockImplementation(() => {
          return {
            getTestResults: () => Promise.resolve(TestResultsService.prototype.expandTestResults(JSON.parse(hgvTrlResults.body))),
          };
        });
        const activitiesServiceMock = jest.fn().mockImplementation(() => {
          return {
            getActivities: () => Promise.resolve(JSON.parse(activities.body)),
          };
        });
        const retroGenerationService: RetroGenerationService = new RetroGenerationService(new testResultsServiceMock(), new activitiesServiceMock());
        const output = await retroGenerationService.generateRetroReport(activity);
        const workbook = new Excel.Workbook();
        const stream = new Duplex();
        stream.push(output.fileBuffer); // Convert the incoming file to a readable stream
        stream.push(null);

        const excelFile = await workbook.xlsx.read(stream);
        const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

        expect(reportSheet.getCell("H17").value).toEqual(2);
        expect(reportSheet.getCell("H18").value).toEqual(5);
        expect(reportSheet.getCell("E17").value).toEqual("JY58FPP");
        expect(reportSheet.getCell("E18").value).toEqual("12345");
      });
    });
  });
  context("adjustStaticTemplateForMoreThan11Tests", () => {
    it("", async () => {
      const lambdaServiceMock = jest.fn();
      const testResultsService: TestResultsService = new TestResultsService(new lambdaServiceMock());
      const activitiesService: ActivitiesService = new ActivitiesService(new lambdaServiceMock());
      const retroGenerationService: RetroGenerationService = new RetroGenerationService(testResultsService, activitiesService);
      retroGenerationService.fetchRetroTemplate(15).then((template: { workbook: Excel.Workbook; reportTemplate: any }) => {
        retroGenerationService.adjustStaticTemplateForMoreThan11Tests(template, 15);
        retroGenerationService.correctTemplateAfterAdjustment(template, 15);
        const worksheet = template.workbook.getWorksheet(1);
        expect(worksheet.getCell("B28").border).not.toEqual(undefined);
        expect(worksheet.getCell("G31").border).not.toEqual(undefined);
        expect(worksheet.getCell("G13").border.right).not.toEqual(undefined);
        expect(worksheet.getCell("G39").border.right).not.toEqual(undefined);
        expect(worksheet.getCell("G35").master).toEqual(worksheet.getCell("E35"));
        expect(worksheet.getCell("F35").master).toEqual(worksheet.getCell("E35"));
        expect(worksheet.getCell("G39").master).toEqual(worksheet.getCell("F39"));
      });
    });
  });
});
