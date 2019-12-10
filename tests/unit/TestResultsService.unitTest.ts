import * as fs from "fs";
import * as path from "path";
import {RetroGenerationService} from "../../src/services/RetroGenerationService";
import {LambdaMockService} from "../models/LambdaMockService";
import {TestResultsService} from "../../src/services/TestResultsService";
import {IActivity} from "../../src/models";
import * as Excel from "exceljs";
import {Duplex} from "stream";
import {ActivitiesService} from "../../src/services/ActivitiesService";
import mockConfig from "../util/mockConfig";

describe("TestResultsService", () => {
    mockConfig();
    // @ts-ignore
    const testResultsService: TestResultsService = new TestResultsService(new LambdaMockService());
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

                        expect(result).toEqual(expectedResult);
                    });
                });
            });

            context("and the response is non-200", () => {
                it("should throw an error", () => {
                    LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/test-results-404-response.json");

                    expect.assertions(2);
                    return testResultsService.getTestResults({})
                    .catch((error: Error) => {
                        expect(error.message).toContain("Lambda invocation returned error");
                        expect(error).toBeInstanceOf(Error);
                    });
                });
            });

            context("and the response is 200", () => {
                it("should return an empty test result", () => {
                    LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/test-results-200-response-empty-body.json");

                    return testResultsService.getTestResults({})
                        .then((result: any) => {
                            const expectedResult: any = [];
                            expect(result).toEqual(expectedResult);
                        })
                        .catch((error: Error) => {
                            expect(error.message).toContain("Lambda invocation returned bad data");
                            expect(error).toBeInstanceOf(Error);
                        });
                });
            });
        });
    });

    context("and the lambda function does not exist", () => {
        it("should throw an error", () => {
            LambdaMockService.purgeFunctions();

            expect.assertions(2);
            return testResultsService.getTestResults({})
            .catch((error: Error) => {
                expect(error.message).toEqual("Unsupported Media Type");
                expect(error).toBeInstanceOf(Error);

                LambdaMockService.populateFunctions();
            });
        });
    });
});

context("RetroGenerationService", () => {
  mockConfig();
  // @ts-ignore
  const testResultsService: TestResultsService = new TestResultsService(new LambdaMockService());
  // @ts-ignore
  const activitiesService: ActivitiesService = new ActivitiesService(new LambdaMockService());
  const retroGenerationService: RetroGenerationService = new RetroGenerationService(testResultsService, activitiesService);

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

                          expect(excelFile.creator).toEqual("Commercial Vehicles Services Beta Team");
                          // @ts-ignore
                          expect(excelFile.company).toEqual("Drivers and Vehicles Standards Agency");
                          expect(reportSheet.name).toEqual("Retrokey report");
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
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Prohibition was issued");
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Additional test type notes: none;");
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
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Prohibition was not issued");
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Additional test type notes: none;");
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
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Prohibition was not issued");
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Additional test type notes: Prohibition was issued;");
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
                              expect((failureAdvisoryItemsQAICommentsTestValue.match(/Prohibition was issued/g) || []).length).toEqual(2);
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Additional test type notes: Prohibition was issued;");
                          });
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
                              // Validating first Wait activity
                              let failureAdvisoryItemsQAICommentsTestValue = reportSheet.getCell("M18").value;
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Reason for waiting: Break;");
                              expect(failureAdvisoryItemsQAICommentsTestValue).not.toContain("Additional notes:");
                              // Validating second Wait activity
                              failureAdvisoryItemsQAICommentsTestValue = reportSheet.getCell("M19").value;
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Reason for waiting: Others;");
                              expect(failureAdvisoryItemsQAICommentsTestValue).toContain("Additional notes: Documentation Delay;");
                          });
                  });
          });

      });

      context("with an LEC test type", () => {
        it("populates failureAdvisoryItemsQAIComments with LEC specific fields", () => {
          LambdaMockService.changeResponse("cvs-svc-test-results", "tests/resources/test-results-200-response-LEC.json");
          return retroGenerationService.generateRetroReport(activity)
            .then((result: any) => {
              const workbook = new Excel.Workbook();
              const stream = new Duplex();
              stream.push(result.fileBuffer);
              stream.push(null);

              return workbook.xlsx.read(stream)
                .then((excelFile: Excel.Workbook) => {
                  const reportSheet: Excel.Worksheet = excelFile.getWorksheet(1);
                  // @ts-ignore
                  const failureAdvisoryItemsQAICommentsTestValue: string = reportSheet.getCell("M17").value;
                  const splitAdvisoriesOrNotes = failureAdvisoryItemsQAICommentsTestValue.split("\r\n");
                  // @ts-ignore
                  expect(splitAdvisoriesOrNotes[3]).toEqual("Modification type: P");
                  expect(splitAdvisoriesOrNotes[4]).toEqual("Fuel type: Diesel");
                  expect(splitAdvisoriesOrNotes[5]).toEqual("Emission standards: test emissions standard value");
                });
            });
        });
      });

      context("with a non-LEC test type", () => {
      it("does not show LEC fields", () => {
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
                // @ts-ignore
                const splitAdvisoriesOrNotes = failureAdvisoryItemsQAICommentsTestValue.split("\r\n");
                expect(splitAdvisoriesOrNotes[3]).not.toEqual("Modification type: P");
                expect(splitAdvisoriesOrNotes[4]).not.toEqual("Fuel type: Diesel");
                expect(splitAdvisoriesOrNotes[5]).not.toEqual("Emission standards: test emissions standard value");
              });
          });
      });
    });
  });
});
