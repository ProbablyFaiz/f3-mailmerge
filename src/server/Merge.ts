import {
  EmailDraft,
  EmailTemplate,
  FilledTemplate,
  MergeConfig,
  MergeHints,
  Recipient,
} from "../Types";
import { fillTemplate, getKeysInTemplate, getTemplate } from "./Template";
import { memoize } from "./CacheHelper";

type Cell = string | number | boolean | Date;

function GetGmailDrafts(): EmailDraft[] {
  const drafts = GmailApp.getDrafts();
  return drafts.map((draft) => {
    const message = draft.getMessage();
    return {
      id: draft.getId(),
      subject: message.getSubject(),
      starred: message.isStarred(),
      dateCreated: message.getDate().toISOString(),
    };
  });
}

function GetDefaultMergeConfig(): MergeConfig {
  return {
    draftId: undefined,
    senderName: Session.getActiveUser().getEmail(),
    sheetId: SpreadsheetApp.getActiveSheet().getSheetId(),
  };
}

function SendTestEmail(mergeConfig: MergeConfig) {
  const testRecipient = getTestRecipient(mergeConfig);
  const template = fillTemplate(getTemplate(mergeConfig.draftId))(
    testRecipient
  );
  sendEmail(mergeConfig, template)(testRecipient);
}

function RunMailMerge(mergeConfig: MergeConfig) {
  const recipients = getRecipients(mergeConfig.sheetId);
  const fillTemplateForRecipient = fillTemplate(
    getTemplate(mergeConfig.draftId)
  );
  recipients.forEach((recipient) => {
    const template = fillTemplateForRecipient(recipient);
    sendEmail(mergeConfig, template)(recipient);
  });
}

function GetMergeHints(
  mergeConfig: MergeConfig = GetDefaultMergeConfig()
): MergeHints {
  const recipientQuota = MailApp.getRemainingDailyQuota();
  const recipients = getRecipients(mergeConfig.sheetId);
  const emailColumn = identifyEmailKey(getSheetRecords(mergeConfig.sheetId));
  const output: MergeHints = {
    remainingRecipients: recipientQuota,
    numEmailsToBeSent: recipients.length,
    emailColumn,
  };
  if (mergeConfig.draftId != undefined) {
    const template = getTemplate(mergeConfig.draftId);
    const templateKeys = getKeysInTemplate(template);
    const sheetKeys = Object.keys(recipients[0].properties);
    // Check if there are any keys in the template that aren't in the sheet
    const missingKeys = templateKeys.filter((key) => !sheetKeys.includes(key));
    if (missingKeys.length > 0) {
      output.missingKeys = missingKeys;
    }
  }
  return output;
}

const sendEmail =
  (mergeConfig: MergeConfig, template: FilledTemplate) =>
  (recipient: Recipient) => {
    const plainTextBody = template.body.replace(/<[^>]*>?/gm, "");
    GmailApp.sendEmail(
      recipient.emailAddress,
      template.subject,
      plainTextBody,
      {
        htmlBody: template.body,
        attachments: template.attachments,
        cc: template.cc,
        bcc: template.bcc,
        name: mergeConfig.senderName,
      }
    );
  };

const getRecipients = (sheetId: number): Recipient[] => {
  const records = getSheetRecords(sheetId);
  const emailKey = identifyEmailKey(records);
  return records.map((record) => {
    return {
      emailAddress: record[emailKey],
      uuid: getRecipientUuid(),
      properties: record,
    };
  });
};

const getTestRecipient = (mergeConfig: MergeConfig): Recipient => {
  const recipients = getRecipients(mergeConfig.sheetId);
  const testRecipient = JSON.parse(JSON.stringify(recipients[0]));
  testRecipient.emailAddress = Session.getActiveUser().getEmail();
  return testRecipient;
};

const getSheetRecords = (sheetId: number): Record<string, string>[] => {
  const sheet = getSheetById(SpreadsheetApp.getActiveSpreadsheet(), sheetId);
  const dataRows: Cell[][] = sheet.getDataRange().getValues();

  if (dataRows.length < 2) {
    return [];
  }

  // TODO: Add some functionality to automatically add column names if they are missing?
  const headerRow = dataRows
    .shift()
    .map((v) => (v !== "" ? v.toString() : undefined));
  // If a column has no name, we ignore it. But we don't allow duplicate names,
  // because this would cause unexpected behavior when sending mail.
  const namedColumns = headerRow.filter((v) => v !== undefined);
  if (namedColumns.length !== new Set(namedColumns).size) {
    throw new Error(
      "Duplicate headers found in mail merge sheet. Please ensure that all columns have unique names."
    );
  }

  return dataRows.map((row) => {
    return row.reduce((acc, value, index) => {
      if (headerRow[index] === undefined) {
        return acc;
      }
      // TODO: Potentially revisit the decision to cast all values to strings
      acc[headerRow[index]] = value.toString();
      return acc;
    }, {} as Record<string, string>);
  });
};

const getSheetById = (
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  sheetId: number
) => {
  return SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .find((sheet) => {
      return sheet.getSheetId() === sheetId;
    });
};

const EMAIL_ADDRESS_REGEX = /^[^@]+@[^@]+$/;

const identifyEmailKey = (rows: Record<string, string>[]): string => {
  // If there is a column named "Email" (any case), use that
  const keys = Object.keys(rows[0]);
  const emailKey = keys.find((key) => {
    return key.toLowerCase() === "email";
  });
  if (emailKey) {
    return emailKey;
  }

  // Otherwise, identify the column with the most rows matching the email address Regex pattern
  const emailsPerKey = keys.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {} as Record<string, number>);
  rows.forEach((row) => {
    keys.forEach((key) => {
      if (EMAIL_ADDRESS_REGEX.test(row[key])) {
        emailsPerKey[key] += 1;
      }
    });
  });

  return Object.entries(emailsPerKey).reduce((maxKey, [key, count]) => {
    return count > emailsPerKey[maxKey] ? key : maxKey;
  }, keys[0]);
};

const getRecipientUuid = () => {
  return `F3-R-${Utilities.getUuid().substring(0, 12)}`;
};

export {
  GetGmailDrafts,
  GetDefaultMergeConfig,
  SendTestEmail,
  RunMailMerge,
  GetMergeHints,
};
