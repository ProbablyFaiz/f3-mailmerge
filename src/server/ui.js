export const onOpen = () => {
  const menu = SpreadsheetApp.getUi()
    .createMenu("F3 Mail Merge")
    .addItem("Start Merge", "openMergeWizard");
  // .addItem("About me", "openAboutSidebar");
  menu.addToUi();
};

export const openMergeWizard = () => {
  const html = HtmlService.createHtmlOutputFromFile("merge_wizard")
    .setWidth(600)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, "F3 Mail Merge");
};

export const openAboutSidebar = () => {
  const html = HtmlService.createHtmlOutputFromFile("sidebar-about-page");
  SpreadsheetApp.getUi().showSidebar(html);
};
