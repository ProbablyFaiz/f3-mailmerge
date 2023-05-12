import { onOpen, openBallotEntry, openAboutSidebar } from "./ui";
import {
  GetDefaultMergeConfig,
  GetGmailDrafts,
  RunMailMerge,
  SendTestEmail,
} from "./Merge";

// Public functions must be exported as named exports
export {
  onOpen,
  openBallotEntry,
  openAboutSidebar,
  GetDefaultMergeConfig,
  GetGmailDrafts,
  RunMailMerge,
  SendTestEmail,
};

// The webpack functionality for adding these to the global scope is not working
// so we have to add them manually
global.onOpen = onOpen;
global.openBallotEntry = openBallotEntry;
global.openAboutSidebar = openAboutSidebar;
global.GetDefaultMergeConfig = GetDefaultMergeConfig;
global.GetGmailDrafts = GetGmailDrafts;
global.RunMailMerge = RunMailMerge;
global.SendTestEmail = SendTestEmail;
