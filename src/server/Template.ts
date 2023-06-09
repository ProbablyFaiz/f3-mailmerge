import { EmailTemplate, FilledTemplate, Recipient } from "../Types";
import structuredClone from "@ungap/structured-clone";

const getTemplate = (draftId: string): EmailTemplate => {
  const draft = GmailApp.getDraft(draftId);
  const message = draft.getMessage();
  return {
    id: draftId,
    subject: message.getSubject(),
    starred: message.isStarred(),
    dateCreated: message.getDate().toISOString(),
    body: message.getBody(),
    cc: message.getCc(),
    bcc: message.getBcc(),
    attachments: message
      .getAttachments()
      .map((attachment) => attachment.copyBlob()),
    filled: false,
  };
};

const fillTemplate =
  (template: EmailTemplate) =>
  (recipient: Recipient): FilledTemplate => {
    let filled: FilledTemplate = {
      ...template,
      filled: true,
    };
    // This is an ugly hack to get around not being able
    // to structuredClone attachments.
    delete filled.attachments;
    filled = structuredClone(filled);
    filled.attachments = template.attachments;

    filled.subject = fillPlaceholders(template.subject, recipient.properties);
    filled.body = fillPlaceholders(template.body, recipient.properties);
    return filled;
  };

const PLACEHOLDER_REGEX = /{{(.*?)}}/g;

const fillPlaceholders = (
  text: string,
  properties: Record<string, string>
): string => {
  return text.replace(PLACEHOLDER_REGEX, (match, placeholder) => {
    placeholder = getCleanKey(placeholder);
    // We use a loop instead of a lookup so that we don't need
    // to worry about the keys being formatted correctly when
    // they are passed in. n is quite small so this is fine.
    for (const [key, value] of Object.entries(properties)) {
      if (getCleanKey(key) === placeholder) {
        return value;
      }
    }
    return "";
  });
};

const getKeysInTemplate = (draft: EmailTemplate): string[] => {
  const keys = new Set<string>();
  const findKeys = (text: string) => {
    return [...text.matchAll(PLACEHOLDER_REGEX)].map((match) =>
      getCleanKey(match[1])
    );
  };
  findKeys(draft.subject).forEach((key) => keys.add(key));
  findKeys(draft.body).forEach((key) => keys.add(key));
  return Array.from(keys);
};

const getCleanKey = (key: string): string => {
  return key.toLowerCase().trim();
};

export { getTemplate, fillTemplate, getKeysInTemplate };
