import { TestResultsService } from "../../src/services/TestResultsService";

import mockConfig from "../util/mockConfig";

import testResults200 from "../resources/test-results-200-response.json";
import testResults200empty from "../resources/test-results-200-response-empty-body.json";
import testResults404 from "../resources/test-results-404-response.json";

describe("TestResultsService", () => {
  mockConfig();

  context("when fetching the test results", () => {
    context("and the lambda function exists", () => {
      context("and the response is 200", () => {
        it("should return a correct test result", () => {
          const lambdaMock = jest.fn().mockImplementation(() => {
            return {
              invoke: jest.fn().mockResolvedValue(""),
              validateInvocationResponse: () => testResults200,
            };
          });
          const testResultsService: TestResultsService = new TestResultsService(new lambdaMock());
          return testResultsService.getTestResults({}).then((result: any) => {
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
                          seatNumber: null,
                        },
                        notes: "None",
                      },
                      itemNumber: 1,
                      deficiencyRef: "1.1.a",
                      stdForProhibition: false,
                      deficiencySubId: null,
                      imDescription: "Registration Plate",
                      deficiencyId: "a",
                      itemDescription: "A registration plate:",
                      imNumber: 1,
                    },
                  ],
                  name: "Annual test",
                  certificateLink: "http://dvsagov.co.uk",
                  testResult: "pass",
                },
                vin: "XMGDE02FS0H012345",
              },
            ];

            expect(result).toEqual(expectedResult);
          });
        });
      });

      context("and the response is non-200", () => {
        it("should throw an error", () => {
          const lambdaMock = jest.fn().mockImplementation(() => {
            return {
              invoke: jest.fn().mockResolvedValue(""),
              validateInvocationResponse: () => {
                throw new Error(`Lambda invocation returned error: 404 ${testResults404}`);
              },
            };
          });
          const testResultsService: TestResultsService = new TestResultsService(new lambdaMock());

          expect.assertions(2);
          return testResultsService.getTestResults({}).catch((error: Error) => {
            expect(error.message).toContain("Lambda invocation returned error");
            expect(error).toBeInstanceOf(Error);
          });
        });
      });

      context("and the response is 200", () => {
        it("should return an empty test result", () => {
          const lambdaMock = jest.fn().mockImplementation(() => {
            return {
              invoke: jest.fn().mockResolvedValue(""),
              validateInvocationResponse: () => {
                throw new Error(`Lambda invocation returned bad data: ${JSON.stringify(testResults200empty)}.`);
              },
            };
          });
          const testResultsService: TestResultsService = new TestResultsService(new lambdaMock());

          return testResultsService
            .getTestResults({})
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
      const lambdaMock = jest.fn().mockImplementation(() => {
        return {
          invoke: () => Promise.reject(new Error("Unsupported Media Type")),
        };
      });
      const testResultsService: TestResultsService = new TestResultsService(new lambdaMock());
      expect.assertions(2);
      return testResultsService.getTestResults({}).catch((error: Error) => {
        expect(error.message).toEqual("Unsupported Media Type");
        expect(error).toBeInstanceOf(Error);
      });
    });
  });
});
