import {RetroGenerationService} from "../../src/services/RetroGenerationService";
import * as Excel from "exceljs";
import {TestResultsService} from "../../src/services/TestResultsService";
import {expect} from "chai";
import * as fs from "fs";
import * as path from "path";
import {IActivity} from "../../src/models";
import {Duplex} from "stream";
import {Injector} from "../../src/models/injector/Injector";
import {LambdaMockService} from "../models/LambdaMockService";


describe("RetroGenerationService", () => {
    const testResultsService: TestResultsService = Injector.resolve<TestResultsService>(TestResultsService, [LambdaMockService]);
    const retroGenerationService: RetroGenerationService = new RetroGenerationService(testResultsService);
    LambdaMockService.populateFunctions();
    context("when generating a template", () => {
        context("and providing the number of rows the template will contain", () => {
            it("should return a template containing the provided number of rows", () => {
                return retroGenerationService.fetchRetroTemplate(10)
                    .then((result: any) => {
                        const siteVisitDetails: any = result.reportTemplate.siteVisitDetails;
                        const declaration: any = result.reportTemplate.declaration;
                        const activityDetails: any = result.reportTemplate.activityDetails;

                        // Validate site visit details
                        expect(siteVisitDetails.assesor._address).to.equal("C4");
                        expect(siteVisitDetails.date._address).to.equal("F6");
                        expect(siteVisitDetails.siteName._address).to.equal("F4");
                        expect(siteVisitDetails.siteNumber._address).to.equal("F5");
                        expect(siteVisitDetails.startTime._address).to.equal("C6");
                        expect(siteVisitDetails.endTime._address).to.equal("C7");
                        expect(siteVisitDetails.endDate._address).to.equal("F7");

                        // Validate activity details
                        expect(activityDetails.length).to.equal(10);
                    });
            });

            it("should still return a template when requested length is 0", () => {
                return retroGenerationService.fetchRetroTemplate(0)
                    .then((result: any) => {
                        const siteVisitDetails: any = result.reportTemplate.siteVisitDetails;
                        const declaration: any = result.reportTemplate.declaration;
                        const activityDetails: any = result.reportTemplate.activityDetails;

                        // Validate site visit details
                        expect(siteVisitDetails.assesor._address).to.equal("C4");
                        expect(siteVisitDetails.date._address).to.equal("F6");
                        expect(siteVisitDetails.siteName._address).to.equal("F4");
                        expect(siteVisitDetails.siteNumber._address).to.equal("F5");
                        expect(siteVisitDetails.startTime._address).to.equal("C6");
                        expect(siteVisitDetails.endTime._address).to.equal("C7");
                        expect(siteVisitDetails.endDate._address).to.equal("F7");

                        // Validate activity details
                        expect(activityDetails.length).to.equal(0);
                    });
            });
        });
    });

    context("when generating a report", () => {
        const event: any = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../resources/queue-event.json"), "utf8"));
        const activity: IActivity = JSON.parse(event.Records[0].body);

        it("should return a valid xlsx file as buffer", () => {
            return retroGenerationService.generateRetroReport(activity)
                .then((result: any) => {
                    const workbook = new Excel.Workbook();
                    const stream = new Duplex();
                    stream.push(result.fileBuffer); // Convert the incoming file to a readable stream
                    stream.push(null);

                    return workbook.xlsx.read(stream)
                        .then((excelFile: any) => {
                            const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

                            expect(excelFile.creator).to.equal("Commercial Vehicles Services Beta Team");
                            expect(excelFile.company).to.equal("Drivers and Vehicles Standards Agency");
                            expect(reportSheet.name).to.equal("Retrokey report");

                            expect(reportSheet.getCell("B16").value).to.equal("Activity");
                            // tslint:disable-next-line
                            expect(reportSheet.getCell("B17").value).to.not.be.null;
                        });
                });
        });

        context("and testResults returns HGVs and TRLs", () => {
            it("should return a valid xlsx file as buffer with trailerId populated for trl vehicles and noOfAxles populated for hgv and trl vehicles", async () => {
                LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/hgv-trl-test-results.json");
                const output = await retroGenerationService.generateRetroReport(activity);
                const workbook = new Excel.Workbook();
                const stream = new Duplex();
                stream.push(output.fileBuffer); // Convert the incoming file to a readable stream
                stream.push(null);

                const excelFile = await workbook.xlsx.read(stream);
                const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

                expect(reportSheet.getCell("H17").value).to.equal(2);
                expect(reportSheet.getCell("H18").value).to.equal(5);
                expect(reportSheet.getCell("E17").value).to.equal("JY58FPP");
                expect(reportSheet.getCell("E18").value).to.equal("12345");

            });
        });
    });
    context("adjustStaticTemplateForMoreThan11Tests", () => {
        it("", async () => {
            retroGenerationService.fetchRetroTemplate(15)
                .then((template: { workbook: Excel.Workbook, reportTemplate: any}) => {
                    retroGenerationService.adjustStaticTemplateForMoreThan11Tests(template, 15);
                    retroGenerationService.correctTemplateAfterAdjustment(template, 15);
                    const worksheet = template.workbook.getWorksheet(1);
                    expect(worksheet.getCell("B28").border).to.not.eql(undefined);
                    expect(worksheet.getCell("G31").border).to.not.eql(undefined);
                    expect(worksheet.getCell("G13").border.right).to.not.eql(undefined);
                    expect(worksheet.getCell("G39").border.right).to.not.eql(undefined);
                    expect(worksheet.getCell("G35").master).to.eql(worksheet.getCell("E35"));
                    expect(worksheet.getCell("F35").master).to.eql(worksheet.getCell("E35"));
                    expect(worksheet.getCell("G39").master).to.eql(worksheet.getCell("F39"));
                });
        });
    });
});
