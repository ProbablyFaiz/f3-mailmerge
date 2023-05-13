import { onOpen, openMergeWizard, openAboutSidebar } from "./ui";
import {
  GetDefaultMergeConfig,
  GetGmailDrafts,
  RunMailMerge,
  SendTestEmail,
  GetMergeHints,
} from "./Merge";

// Public functions must be exported as named exports
export {
  onOpen,
  openMergeWizard,
  openAboutSidebar,
  GetDefaultMergeConfig,
  GetGmailDrafts,
  RunMailMerge,
  SendTestEmail,
  GetMergeHints,
};

// The webpack functionality for adding these to the global scope is not working
// so we have to add them manually
global.onOpen = onOpen;
global.openMergeWizard = openMergeWizard;
global.openAboutSidebar = openAboutSidebar;
global.GetDefaultMergeConfig = GetDefaultMergeConfig;
global.GetGmailDrafts = GetGmailDrafts;
global.RunMailMerge = RunMailMerge;
global.SendTestEmail = SendTestEmail;
global.GetMergeHints = GetMergeHints;
