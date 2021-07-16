export enum VEHICLE_TYPES {
  PSV = "psv",
  HGV = "hgv",
  TRL = "trl",
}

export enum TEST_RESULT_STATES {
  PASS = "pass",
}

export enum ActivityType {
  TEST = "Test",
  WAIT_TIME = "Wait Time",
  TIME_NOT_TESTING = "Time not Testing",
}

export enum TimeZone {
  LONDON = "Europe/London",
}

export enum RetroConstants {
  INITIAL_ACTIVITY_DETAILS_CAPACITY = 11,
  TEMPLATE_LAST_ROW = 39,
  TEMPLATE_FIRST_ROW_AFTER_ACTIVITY_DETAILS = 28,
  TEMPLATE_LAST_COLUMN = 17,
  TEMPLATE_FIRST_COLUMN = 1,
}

export enum ERRORS {
  EventIsEmpty = "Event is empty",
  SecretEnvVarNotSet = "SECRET_NAME environment variablenot set.",
  SecretFileNotExist = "Secret File does not exist.",
}

export enum STATUSES {
  SUBMITTED = "submitted",
}
