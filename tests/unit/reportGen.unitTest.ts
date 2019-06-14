import {describe} from "mocha";
import {expect} from "chai";
import {Injector} from "../../src/models/injector/Injector";
import * as fs from "fs";
import * as path from "path";
import {RetroGenerationService} from "../../src/services/RetroGenerationService";
import {LambdaMockService} from "../models/LambdaMockService";
import {TestResultsService} from "../../src/services/TestResultsService";
import {Configuration} from "../../src/utils/Configuration";
import {IActivity, IS3Config} from "../../src/models";
import * as Excel from "exceljs";
import {Duplex} from "stream";
import {SQSEvent} from "aws-lambda";
import {Workbook} from "exceljs";

describe("report-gen", () => {
    context("TestResultsService", () => {
        const testResultsService: TestResultsService = Injector.resolve<TestResultsService>(TestResultsService, [LambdaMockService]);
        LambdaMockService.populateFunctions();

        context("when fetching the test results", () => {
            context("and the lambda function exists", () => {
                context("and the response is 200", () => {
                    it("should return a correct test result", () => {
                        return testResultsService.getTestResults({})
                        .then((result: any) => {
                            const expectedResult: any = [
                                {
                                    testerStaffId: "1",
                                    vrm: "JY58FPP",
                                    testStationPNumber: "87-1369569",
                                    numberOfSeats: 45,
                                    testStartTimestamp: "2019-01-14T10:36:33.987Z",
                                    testEndTimestamp: "2019-01-14T10:36:33.987Z",
                                    testTypes: {
                                        prohibitionIssued: false,
                                        testCode: "aas",
                                        testNumber: "1",
                                        lastUpdatedAt: "2019-02-22T08:47:59.269Z",
                                        testAnniversaryDate: "2019-12-22T08:47:59.749Z",
                                        additionalCommentsForAbandon: "none",
                                        numberOfSeatbeltsFitted: 2,
                                        testTypeEndTimestamp: "2019-01-14T10:36:33.987Z",
                                        reasonForAbandoning: "none",
                                        lastSeatbeltInstallationCheckDate: "2019-01-14",
                                        createdAt: "2019-02-22T08:47:59.269Z",
                                        testExpiryDate: "2020-02-21T08:47:59.749Z",
                                        testTypeId: "1",
                                        testTypeStartTimestamp: "2019-01-14T10:36:33.987Z",
                                        certificateNumber: "1234",
                                        testTypeName: "Annual test",
                                        seatbeltInstallationCheckDate: true,
                                        additionalNotesRecorded: "VEHICLE FRONT REGISTRATION PLATE MISSING",
                                        defects: [
                                            {
                                                prohibitionIssued: true,
                                                deficiencyCategory: "major",
                                                deficiencyText: "missing.",
                                                prs: false,
                                                additionalInformation: {
                                                    location: {
                                                        axleNumber: null,
                                                        horizontal: null,
                                                        vertical: null,
                                                        longitudinal: "front",
                                                        rowNumber: null,
                                                        lateral: null,
                                                        seatNumber: null
                                                    },
                                                    notes: "None"
                                                },
                                                itemNumber: 1,
                                                deficiencyRef: "1.1.a",
                                                stdForProhibition: false,
                                                deficiencySubId: null,
                                                imDescription: "Registration Plate",
                                                deficiencyId: "a",
                                                itemDescription: "A registration plate:",
                                                imNumber: 1
                                            }
                                        ],
                                        name: "Annual test",
                                        certificateLink: "http://dvsagov.co.uk",
                                        testResult: "pass"
                                    },
                                    vin: "XMGDE02FS0H012345"
                                }
                            ];

                            expect(result).to.eql(expectedResult);
                        })
                        .catch(() => {
                            expect.fail();
                        });
                    });
                });

                context("and the response is non-200", () => {
                    it("should throw an error", () => {
                        LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/test-results-404-response.json");

                        return testResultsService.getTestResults({})
                        .then(() => {
                            expect.fail();
                        })
                        .catch((error: Error) => {
                            expect(error.message).to.contain("Lambda invocation returned error");
                            expect(error).to.be.instanceOf(Error);
                        });
                    });
                });

                context("and the response is 200", () => {
                    it("should return an empty test result", () => {
                        LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/test-results-200-response-empty-body.json");

                        return testResultsService.getTestResults({})
                            .then((result: any) => {
                                const expectedResult: any = [];
                                expect(result).to.eql(expectedResult);
                            })
                            .catch((error: Error) => {
                                expect(error.message).to.contain("Lambda invocation returned bad data");
                                expect(error).to.be.instanceOf(Error);
                            });
                    });
                });
            });
        });

        context("and the lambda function does not exist", () => {
            it("should throw an error", () => {
                LambdaMockService.purgeFunctions();

                return testResultsService.getTestResults({})
                .then(() => {
                    expect.fail();
                })
                .catch((error: Error) => {
                    expect(error.message).to.equal("Unsupported Media Type");
                    expect(error).to.be.instanceOf(Error);

                    LambdaMockService.populateFunctions();
                });
            });
        });
    });

    context("RetroGenerationService", () => {
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
                    .then((excelFile: Excel.Workbook) => {
                        const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);

                        expect(excelFile.creator).to.equal("Commercial Vehicles Services Beta Team");
                        // @ts-ignore
                        expect(excelFile.company).to.equal("Drivers and Vehicles Standards Agency");
                        expect(reportSheet.name).to.equal("Retrokey report");
                    });
                });
            });

            context("the report contains prohibitionIssued false on testType level and true on defects level", () => {
                it("should contain on the corresponding testType line, on the failureAdvisoryItemsQAICommentsTestValue column, the info that the prohibition WAS" +
                    " issued on defects level and none on the Additional test type notes level", () => {
                    return retroGenerationService.generateRetroReport(activity)
                        .then((result: any) => {
                            const workbook = new Excel.Workbook();
                            const stream = new Duplex();
                            stream.push(result.fileBuffer);
                            stream.push(null);

                            return workbook.xlsx.read(stream)
                                .then((excelFile: Excel.Workbook) => {
                                    const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);
                                    const failureAdvisoryItemsQAICommentsTestValue = reportSheet.getCell("M17").value;
                                    expect (failureAdvisoryItemsQAICommentsTestValue).to.contain("Prohibition was issued");
                                    expect (failureAdvisoryItemsQAICommentsTestValue).to.contain("Additional test type notes: none;");
                                });
                        });
                });

            });


            context("the report contains prohibitionIssued false on testType level and false on defects level", () => {
                it("should contain on the corresponding testType line, on the failureAdvisoryItemsQAICommentsTestValue column, the info that the prohibition WAS NOT" +
                    " issued on defects level and none on the Additional test type notes level", () => {
                    LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/test-results-200-prohibitionFalseTestTypesFalseDefects.json");
                    return retroGenerationService.generateRetroReport(activity)
                        .then((result: any) => {
                            const workbook = new Excel.Workbook();
                            const stream = new Duplex();
                            stream.push(result.fileBuffer);
                            stream.push(null);

                            return workbook.xlsx.read(stream)
                                .then((excelFile: Excel.Workbook) => {
                                    const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);
                                    const failureAdvisoryItemsQAICommentsTestValue = reportSheet.getCell("M17").value;
                                    expect (failureAdvisoryItemsQAICommentsTestValue).to.contain("Prohibition was not issued");
                                    expect (failureAdvisoryItemsQAICommentsTestValue).to.contain("Additional test type notes: none;");
                                });
                        });
                });

            });

            context("the report contains prohibitionIssued true on testType level and false on defects level", () => {
                it("should contain on the corresponding testType line, on the failureAdvisoryItemsQAICommentsTestValue column, the info that the prohibition WAS NOT" +
                    " issued on defects level and that the prohibition WAS issued on the Additional test type notes level", () => {
                    LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/test-results-200-prohibitionTrueTestTypesFalseDefects.json");
                    return retroGenerationService.generateRetroReport(activity)
                        .then((result: any) => {
                            const workbook = new Excel.Workbook();
                            const stream = new Duplex();
                            stream.push(result.fileBuffer);
                            stream.push(null);

                            return workbook.xlsx.read(stream)
                                .then((excelFile: Excel.Workbook) => {
                                    const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);
                                    const failureAdvisoryItemsQAICommentsTestValue = reportSheet.getCell("M17").value;
                                    expect (failureAdvisoryItemsQAICommentsTestValue).to.contain("Prohibition was not issued");
                                    expect (failureAdvisoryItemsQAICommentsTestValue).to.contain("Additional test type notes: Prohibition was issued;");
                                });
                        });
                });

            });


            context("the report contains prohibitionIssued true on testType level and false on defects level", () => {
                it("should contain on the corresponding testType line, on the failureAdvisoryItemsQAICommentsTestValue column, the info that the prohibition WAS" +
                    " issued on defects level and that the prohibition WAS also issued on the Additional test type notes level", () => {
                    LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/test-results-200-prohibitionTrueTestTypesTrueDefects.json");
                    return retroGenerationService.generateRetroReport(activity)
                        .then((result: any) => {
                            const workbook = new Excel.Workbook();
                            const stream = new Duplex();
                            stream.push(result.fileBuffer);
                            stream.push(null);

                            return workbook.xlsx.read(stream)
                                .then((excelFile: Excel.Workbook) => {
                                    const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);
                                    const failureAdvisoryItemsQAICommentsTestValue = reportSheet.getCell("M17").value;
                                    // @ts-ignore
                                    expect((failureAdvisoryItemsQAICommentsTestValue.match(/Prohibition was issued/g) || []).length).to.eql(2);
                                    expect(failureAdvisoryItemsQAICommentsTestValue).to.contain("Additional test type notes: Prohibition was issued;");
                                });
                        });
                });

            });
        });
    });

    context("ConfigurationUtil", () => {
        const config: Configuration = Configuration.getInstance();
        const branch = process.env.BRANCH;
        context("when calling the getS3Config() and the BRANCH environment variable is local", () => {
            process.env.BRANCH = "local";
            const s3config: IS3Config = config.getS3Config();
            it("should return the local S3 config", () => {
                expect (s3config.endpoint).to.equal("http://localhost:7000");
            });
        });

        context("when calling the getS3Config() and the BRANCH environment variable is not defined", () => {
            process.env.BRANCH = "";
            const s3config: IS3Config = config.getS3Config();
            it("should return the local S3 config", () => {
                expect (s3config.endpoint).to.equal("http://localhost:7000");
            });
        });

        context("when calling the getS3Config() and the BRANCH environment variable is different than local", () => {
            process.env.BRANCH = "test";
            const s3config: IS3Config = config.getS3Config();
            it("should return the local S3 config", () => {
                // tslint:disable-next-line:no-unused-expression
                expect (s3config).to.be.empty;
            });
        });

        process.env.BRANCH = branch;
    });
});