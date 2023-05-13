interface EmailTemplate {
  id: string;
  subject: string;
  dateCreated: string;
  starred: boolean;
  body: string;
  cc: string;
  bcc: string;
  attachments: GoogleAppsScript.Base.Blob[];
  filled: false;
}

type FilledTemplate = Omit<EmailTemplate, "filled"> & { filled: true };
type EmailDraft = Omit<
  EmailTemplate,
  "body" | "cc" | "bcc" | "attachments" | "filled"
>;

interface MergeConfig {
  draftId: string;
  senderName: string;
  sheetId: number;
}

interface Recipient {
  emailAddress: string;
  uuid: string;
  properties: Record<string, string>;
}

interface MergeHints {
  remainingRecipients: number;
  numEmailsToBeSent: number;
  emailColumn: string;
  missingKeys?: string[];
}

export { EmailTemplate, EmailDraft, FilledTemplate, MergeConfig, Recipient, MergeHints };
