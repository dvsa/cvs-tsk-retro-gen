import { LEC_TEST } from "@dvsa/cvs-microservice-common/classes/testTypes/Constants";
import { TestTypeHelper } from "@dvsa/cvs-microservice-common/classes/testTypes/testTypeHelper";
import { ActivitySchema } from "@dvsa/cvs-type-definitions/types/v1/activity";
import { TestResultSchema, TestTypeSchema } from "@dvsa/cvs-type-definitions/types/v1/test-result";
import { ModTypeSchema } from "@dvsa/cvs-type-definitions/types/v1/test-type";
import * as Excel from "exceljs";
import * as path from "path";
import { ActivityType, RetroConstants, STATUSES, TEST_RESULT_STATES, TimeZone, VEHICLE_TYPES } from "../assets/Enum";
import { IActivitiesList } from "../models";
import { ActivitiesService } from "./ActivitiesService";
import { TestResultsService } from "./TestResultsService";
import moment = require("moment-timezone");

class RetroGenerationService {
  private readonly testResultsService: TestResultsService;
  private readonly activitiesService: ActivitiesService;

  constructor(testResultsService: TestResultsService, activitiesService: ActivitiesService) {
    this.testResultsService = testResultsService;
    this.activitiesService = activitiesService;
  }

  /**
   * Generates the Retrokey report for a given activity
   * @param activity - activity for which to generate the report
   */
  public generateRetroReport(activity: ActivitySchema): Promise<any> {
    return this.testResultsService
      .getTestResults({
        testerStaffId: activity.testerStaffId,
        fromDateTime: activity.startTime,
        toDateTime: activity.endTime,
        testStationPNumber: activity.testStationPNumber,
        testStatus: STATUSES.SUBMITTED,
      })
      .then((testResults: TestResultSchema[]) => {
        // Fetch 'wait' activities for this visit activity
        return this.activitiesService
          .getActivities({
            testerStaffId: activity.testerStaffId,
            fromStartTime: activity.startTime,
            toStartTime: activity.endTime,
            testStationPNumber: activity.testStationPNumber,
            activityType: "wait",
          })
          .then((waitActivities: ActivitySchema[]) => {
            const totalActivitiesLen = testResults.length + waitActivities.length;
            // Fetch and populate the Retrokey template
            return this.fetchRetroTemplate(totalActivitiesLen).then((template: { workbook: Excel.Workbook; reportTemplate: any }) => {
              if (totalActivitiesLen > 11) {
                this.adjustStaticTemplateForMoreThan11Tests(template, totalActivitiesLen);
                this.correctTemplateAfterAdjustment(template, totalActivitiesLen);
              }

              const siteVisitDetails: any = template.reportTemplate.siteVisitDetails;
              // Populate site visit details
              siteVisitDetails.assesor.value = activity.testerName;
              siteVisitDetails.siteName.value = activity.testStationName;
              siteVisitDetails.siteNumber.value = activity.testStationPNumber;
              siteVisitDetails.date.value = moment(activity.startTime).tz(TimeZone.LONDON).format("DD/MM/YYYY");
              siteVisitDetails.startTime.value = moment(activity.startTime).tz(TimeZone.LONDON).format("HH:mm:ss");
              siteVisitDetails.endTime.value = moment(activity.endTime).tz(TimeZone.LONDON).format("HH:mm:ss");
              siteVisitDetails.endDate.value = moment(activity.endTime).tz(TimeZone.LONDON).format("DD/MM/YYYY");

              // Add testResults and waitActivities in common list and sort them on startTime
              const activitiesList = this.computeActivitiesList(testResults, waitActivities);
              for (let i = 0, j = 0; i < template.reportTemplate.activityDetails.length && j < activitiesList.length; i++, j++) {
                const event: IActivitiesList = activitiesList[j];
                if (event.activityType === ActivityType.TEST) {
                  // Populate activity report
                  const detailsTemplate: any = template.reportTemplate.activityDetails[i];
                  const testResult: TestResultSchema = event.activity;
                  const testTypes: TestTypeSchema[] = testResult.testTypes;
                  const additionalTestTypeNotes: string = testTypes[0].prohibitionIssued ? "Prohibition was issued" : "none";
                  let defects: string = "";
                  let reasonForAbandoning: string = "";
                  let additionalCommentsAbandon: string = "";
                  let LECNotes: string = "";
                  let defectsDetails: string = "";
                  let prsString: string = "";

                  for (const [, defectValue] of Object.entries(testTypes[0]?.defects || {})) {
                    if (defectValue.prs) {
                      prsString = ", PRS";
                    } else {
                      prsString = "";
                    }

                    defectsDetails =
                      defectsDetails +
                      " " +
                      defectValue.deficiencyRef +
                      " (" +
                      defectValue.deficiencyCategory +
                      prsString +
                      (defectValue.additionalInformation.notes ? ", " + defectValue.additionalInformation.notes : "") +
                      (defectValue.prohibitionIssued ? ", Prohibition was issued" : ", Prohibition was not issued") +
                      ")";
                  }
                  if (defectsDetails) {
                    defects = `Defects: ${defectsDetails};\r\n`;
                  }
                  if (testTypes[0].reasonForAbandoning) {
                    reasonForAbandoning = `Reason for abandoning: ${testTypes[0].reasonForAbandoning};\r\n`;
                  }
                  if (testTypes[0].additionalCommentsForAbandon) {
                    additionalCommentsAbandon = `Additional comments for abandon: ${testTypes[0].additionalCommentsForAbandon};\r\n`;
                  }
                  if (this.isPassingLECTestType(testTypes[0])) {
                    LECNotes = "Modification type: " + (testTypes[0].modType! as ModTypeSchema).code.toUpperCase() + "\r\n" + "Fuel type: " + testTypes[0].fuelType + "\r\n" + "Emission standards: " + testTypes[0].emissionStandard + "\r\n";
                  }
                  detailsTemplate.activity.value = activity.activityType === "visit" ? ActivityType.TEST : ActivityType.WAIT_TIME;
                  detailsTemplate.startTime.value = moment(testTypes[0].testTypeStartTimestamp).tz(TimeZone.LONDON).format("HH:mm:ss");
                  detailsTemplate.finishTime.value = moment(testTypes[0].testTypeEndTimestamp).tz(TimeZone.LONDON).format("HH:mm:ss");
                  detailsTemplate.vrm.value = testResult.vehicleType === VEHICLE_TYPES.TRL ? testResult.trailerId : testResult.vrm;
                  detailsTemplate.chassisNumber.value = testResult.vin;
                  detailsTemplate.testType.value = (testTypes[0] as TestTypeSchema).testCode?.toUpperCase();
                  detailsTemplate.seatsAndAxles.value = testResult.vehicleType === VEHICLE_TYPES.PSV ? testResult.numberOfSeats : testResult.noOfAxles;
                  detailsTemplate.result.value = testTypes[0].testResult;
                  detailsTemplate.certificateNumber.value = testTypes[0].certificateNumber;
                  detailsTemplate.expiryDate.value = testTypes[0].testExpiryDate ? moment(testTypes[0].testExpiryDate).tz(TimeZone.LONDON).format("DD/MM/YYYY") : "";
                  detailsTemplate.preparerId.value = testResult.preparerId;
                  detailsTemplate.failureAdvisoryItemsQAIComments.value =
                    defects +
                    reasonForAbandoning +
                    additionalCommentsAbandon +
                    LECNotes +
                    "Additional test type notes: " +
                    additionalTestTypeNotes +
                    ";\r\n" +
                    (testTypes[0].additionalNotesRecorded ? testTypes[0].additionalNotesRecorded + ";" : "");
                }
                if (event.activityType === ActivityType.TIME_NOT_TESTING) {
                  // Populate wait activities in the report
                  const detailsTemplate: any = template.reportTemplate.activityDetails[i];
                  const waitActivityResult: ActivitySchema = event.activity;
                  let waitReasons: string = "";
                  let additionalNotes: string = "";

                  if (waitActivityResult.waitReason) {
                    waitReasons = `Reason for waiting: ${waitActivityResult.waitReason};\r\n`;
                  }
                  if (waitActivityResult.notes) {
                    additionalNotes = `Additional notes: ${waitActivityResult.notes};\r\n`;
                  }

                  detailsTemplate.activity.value = waitActivityResult.activityType === "visit" ? ActivityType.TEST : ActivityType.TIME_NOT_TESTING;
                  detailsTemplate.startTime.value = moment(waitActivityResult.startTime).tz(TimeZone.LONDON).format("HH:mm:ss");
                  detailsTemplate.finishTime.value = moment(waitActivityResult.endTime).tz(TimeZone.LONDON).format("HH:mm:ss");
                  detailsTemplate.failureAdvisoryItemsQAIComments.value = waitReasons + additionalNotes;
                }
              }

              return template.workbook.xlsx.writeBuffer().then((buffer: Excel.Buffer) => {
                return {
                  fileName:
                    "RetrokeyReport_" +
                    moment(activity.startTime).tz(TimeZone.LONDON).format("DD-MM-YYYY") +
                    "_" +
                    moment(activity.startTime).tz(TimeZone.LONDON).format("HHmm") +
                    "_" +
                    activity.testStationPNumber +
                    "_" +
                    activity.testerName +
                    ".xlsx",
                  fileBuffer: buffer,
                };
              });
            });
          });
      });
  }

  /**
   * Method to collate testResults and waitActivities into a common list
   * and then sort them on startTime to display the activities in a sequence.
   * @param testResultsList
   * @param waitActivitiesList
   */
  public computeActivitiesList(testResultsList: TestResultSchema[], waitActivitiesList: ActivitySchema[]) {
    const list: IActivitiesList[] = [];
    // Adding Test results to the list
    for (const testResult of testResultsList) {
      const testResultTestType = testResult.testTypes as TestTypeSchema[];
      const act: IActivitiesList = {
        startTime: testResultTestType[0].testTypeStartTimestamp!,
        activityType: ActivityType.TEST,
        activity: testResult,
      };
      list.push(act);
    }
    // Adding Wait activities to the list
    for (const waitTime of waitActivitiesList) {
      const act: IActivitiesList = {
        startTime: waitTime.startTime,
        activityType: ActivityType.TIME_NOT_TESTING,
        activity: waitTime,
      };
      list.push(act);
    }
    // Sorting the list by StartTime
    const sortDateAsc = (date1: IActivitiesList, date2: IActivitiesList) => {
      const date = new Date(date1.startTime).toISOString();
      const dateToCompare = new Date(date2.startTime).toISOString();
      if (date > dateToCompare) {
        return 1;
      }
      if (date < dateToCompare) {
        return -1;
      }
      return 0;
    };
    // Sort the list on activity startTime
    list.sort(sortDateAsc);
    return list;
  }

  /**
   * Expands the activity details table with the number of rows needed to accommodate more than 11 tests(the initial capacity of the static template).
   * This is achieved by iterating through the worksheet from bottom up to the first row after the activity details section and copying each row from position k - <number_of_rows_needed_to_be_inserted> to position k
   * @param template - excel worksheet template which is manipulated
   * @param testResultsLength - number of total tests needed to be accommodated in the activity details section
   */
  public adjustStaticTemplateForMoreThan11Tests(template: { workbook: Excel.Workbook; reportTemplate: any }, testResultsLength: any) {
    const worksheet = template.workbook.getWorksheet(1)!;
    const numberOfRowsToBeAdded = testResultsLength - RetroConstants.INITIAL_ACTIVITY_DETAILS_CAPACITY;
    for (let i = RetroConstants.TEMPLATE_LAST_ROW + numberOfRowsToBeAdded; i >= RetroConstants.TEMPLATE_FIRST_ROW_AFTER_ACTIVITY_DETAILS; i--) {
      const currentRow = worksheet.getRow(i);
      let rowToBeShifted = worksheet.getRow(i - numberOfRowsToBeAdded);
      if (rowToBeShifted.number < 17) {
        rowToBeShifted = worksheet.getRow(17);
      }
      currentRow.height = rowToBeShifted.height;
      for (let j = RetroConstants.TEMPLATE_FIRST_COLUMN; j < RetroConstants.TEMPLATE_LAST_COLUMN; j++) {
        const currentCell = currentRow.getCell(j);
        const cellToBeShifted = rowToBeShifted.getCell(j);
        currentCell.style = cellToBeShifted.style;
        currentCell.value = cellToBeShifted.value;
      }
      currentRow.commit();
    }
  }

  /**
   * Used to manually correct the template after calling adjustStaticTemplateForMoreThan11Tests()
   * Adds the missing borders(a good part of them are disappearing after adjustment). For this, the whole list of cells had to be computed in order for the library to correctly add the borders.
   * Because no way of copying the merging model from cell to cell had been found, the static template needed to be adjusted by removing all the merges below activity details section, and adding them back programatically.
   * @param template - excel worksheet template which is manipulated
   * @param testResultsLength - number of total tests needed to be accommodated in the activity details section
   */
  public correctTemplateAfterAdjustment(template: { workbook: Excel.Workbook; reportTemplate: any }, testResultsLength: any) {
    const worksheet = template.workbook.getWorksheet(1)!;

    worksheet.mergeCells(`B${testResultsLength + 19}:C${testResultsLength + 19}`);
    worksheet.mergeCells(`B${testResultsLength + 20}:C${testResultsLength + 20}`);
    worksheet.mergeCells(`E${testResultsLength + 19}:G${testResultsLength + 19}`);
    worksheet.mergeCells(`E${testResultsLength + 20}:G${testResultsLength + 20}`);
    worksheet.mergeCells(`F${testResultsLength + 23}:G${testResultsLength + 23}`);
    worksheet.mergeCells(`F${testResultsLength + 24}:G${testResultsLength + 24}`);

    const cellsWithBorders = ["G13", `G${testResultsLength + 19}`, `G${testResultsLength + 20}`, `G${testResultsLength + 23}`, `G${testResultsLength + 24}`];
    this.addBorders(cellsWithBorders, worksheet);
  }

  /**
   * Create a template of excel cell locations for inserting expected values in the correct place
   * @param totalActivities - the total number of activities that will be displayed.
   * this is used for determining how many rows the table will have
   */
  public fetchRetroTemplate(totalActivities: number) {
    const workbook = new Excel.Workbook();
    return workbook.xlsx.readFile(path.resolve(__dirname, "../resources/retro_report_template.xlsx")).then((template: Excel.Workbook) => {
      // Index starts at 1
      const reportSheet: Excel.Worksheet = template.getWorksheet(1)!;

      // Change file metadata
      template.creator = "Commercial Vehicles Services Beta Team";
      // @ts-ignore
      template.company = "Drivers and Vehicles Standards Agency";
      reportSheet.name = "Retrokey report";
      delete (template as Partial<Excel.Workbook>).lastModifiedBy;

      // Map values
      const RetrokeyReportTemplate: any = {
        siteVisitDetails: {
          assesor: reportSheet.getCell("C4"),
          siteName: reportSheet.getCell("F4"),
          siteNumber: reportSheet.getCell("F5"),
          date: reportSheet.getCell("F6"),
          startTime: reportSheet.getCell("C6"),
          endTime: reportSheet.getCell("C7"),
          endDate: reportSheet.getCell("F7"),
        },
        activityDetails: Array.from({ length: totalActivities }, (v, k) => {
          return {
            activity: reportSheet.getCell(`B${17 + k}`),
            startTime: reportSheet.getCell(`C${17 + k}`),
            finishTime: reportSheet.getCell(`D${17 + k}`),
            vrm: reportSheet.getCell(`E${17 + k}`),
            chassisNumber: reportSheet.getCell(`F${17 + k}`),
            testType: reportSheet.getCell(`G${17 + k}`),
            seatsAndAxles: reportSheet.getCell(`H${17 + k}`),
            result: reportSheet.getCell(`I${17 + k}`),
            certificateNumber: reportSheet.getCell(`J${17 + k}`),
            expiryDate: reportSheet.getCell(`K${17 + k}`),
            preparerId: reportSheet.getCell(`L${17 + k}`),
            failureAdvisoryItemsQAIComments: reportSheet.getCell(`M${17 + k}`),
          };
        }),
      };

      reportSheet.getCell("G4").alignment = { wrapText: true };
      reportSheet.getCell("M16").alignment = { wrapText: true };
      Object.values(RetrokeyReportTemplate.siteVisitDetails).forEach((cell: any) => {
        this.addCellStyle(cell);
      });

      Object.values(RetrokeyReportTemplate.activityDetails).forEach((cell: any) => {
        this.addCellStyle(cell);
      });

      // CVSB-4842 fix
      this.formatActivitiesRows(RetrokeyReportTemplate.activityDetails.length, reportSheet);

      return {
        workbook,
        reportTemplate: RetrokeyReportTemplate,
      };
    });
  }

  /**
   * Adds styling to a given cell
   * @param cell - the cell to add style to
   */
  private addBorders(cells: string[], reportSheet: Excel.Worksheet) {
    cells.forEach((cell) => {
      reportSheet.getCell(cell).border = {
        right: { style: "medium" },
        left: { style: "medium" },
        top: { style: "medium" },
        bottom: { style: "medium" },
      };
    });
    return reportSheet;
  }

  /**
   * Add Cell style
   * @param cell
   */
  private addCellStyle(cell: any) {
    cell.border = {
      right: { style: "medium" },
      left: { style: "medium" },
      top: { style: "medium" },
      bottom: { style: "medium" },
    };

    cell.alignment = { horizontal: "left" };
  }

  /**
   * Format activities rows
   * @param activitiesLen- number of Test activities to be formatted
   * @param reportSheet- worksheet to be modified
   */
  private formatActivitiesRows(activitiesLen: number, reportSheet: Excel.Worksheet) {
    // Format activities rows
    for (let k = 0; k < activitiesLen; k++) {
      // Activities Row starts from 17
      const cell: any = reportSheet.getCell(`M${17 + k}`);
      cell.alignment = { wrapText: true };
      const row = reportSheet.getRow(17 + k);
      // Setting the height to 0 which works as AutoFit here.
      row.height = 0;
    }
  }

  /**
   * Checks if testType is for an LEC type with a passing result
   * @param testType
   */
  private isPassingLECTestType(testType: any): boolean {
    return TestTypeHelper.validateTestTypeIdInList(LEC_TEST, testType.testTypeId) && testType.testResult === TEST_RESULT_STATES.PASS;
  }
}

export { RetroGenerationService };
