import { EmailTemplate, FilledTemplate, Recipient } from "../Types";
import structuredClone from '@ungap/structured-clone';

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
    // Replace all the placeholders in the subject and body
    const filled: FilledTemplate = {
      ...structuredClone(template),
      filled: true,
    };
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

const getCleanKey = (key: string): string => {
  return key.toLowerCase().trim();
};

export { getTemplate, fillTemplate };
