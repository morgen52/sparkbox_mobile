const fs = require('fs');
let code = fs.readFileSync('src/components/LibraryPane.tsx', 'utf8');

const renames = {
  'library.overviewTitle': 'library.overview',
  'library.overviewCopyActive': 'library.wikiModeCopy',
  'library.overviewCopyEmpty': 'library.selectSpaceFirst',
  'library.rawBrowser': 'library.rawBrowseTitle',
  'library.rawBrowserCopy': 'library.rawBrowseCopy',
  'library.rawFileReading': 'library.rawFileRead',
  'library.cannotReadFile': 'library.cannotRead',
  'library.clickToEnter': 'library.enterSubdir',
  'library.clickToView': 'library.viewContent',
  'library.wikiTitle': 'library.wikiBySpace',
  'library.wikiCopyActive': 'library.wikiCurrentSpace',
  'library.wikiCopyEmpty': 'library.wikiSelectSpace',
  'library.uploadAndIngest': 'library.uploadIngest',
  'library.note': 'library.notes',
  'library.document': 'library.documents',
  'library.image': 'library.images',
  'library.uploadAndImportToRaw': 'library.uploadAndImport',
  'library.rawTitlePlaceholder': 'library.titlePlaceholder',
  'library.rawContentPlaceholder': 'library.contentPlaceholder',
  'library.refreshPageList': 'library.refreshPages',
  'library.recentIngest': 'library.recentImport',
  'library.ingestTitle': 'library.importTitle',
  'library.ingestType': 'library.importType',
  'library.ingestPageId': 'library.importPageId',
  'library.ingestOpId': 'library.importOpId',
  'library.ingestSummary': 'library.importSummary',
  'library.rawFileCount': 'library.rawCount',
  'library.fileUploadSectionCopy': 'library.fileUploadPageCopy',
  'library.fileUploadOnlyCopy': 'library.fileUploadOnly',
  'library.selectAndUploadFile': 'library.selectFileUpload',
  'library.imageUploadSectionCopy': 'library.imageUploadPageCopy',
  'library.imageUploadOnlyCopy': 'library.imageUploadOnly',
  'library.selectAndUploadImage': 'library.selectImageUpload',
  'library.textUploadSectionCopy': 'library.textUploadPageCopy',
  'library.selectExternalDevice': 'library.selectStorage',
  'library.importFromExternal': 'library.externalStorageImport',
  'library.deviceOfflineExternal': 'library.needOnline',
  'library.noExternalDevices': 'library.noDevices',
  'library.externalImportExplain': 'library.importFlowCopy',
  'library.uncheckItem': 'library.uncheck',
  'library.wechatLabel': 'library.wechat',
  'library.wechatDesc': 'library.wechatCopy',
  'library.zhihuLabel': 'library.zhihu',
  'library.zhihuDesc': 'library.zhihuCopy',
  'library.linkImportSectionCopy': 'library.linkImportTitleCopy',
  'library.deviceOfflineLink': 'library.needOnlineLink',
  'library.sharedMemoryCopy': 'library.memoriesAdminNote',
  'library.pinned': 'library.pinnedTag',
  'library.noChatsAvailable': 'library.noChatsYet',
  'library.selected': 'library.selectedTag',
  'library.canGenSummary': 'library.canGenerate',
  'library.adminOnlySummary': 'library.adminOnlyGenerate',
  'library.sharedPhotoCopy': 'library.photosAdminNote',
  'library.uploadPhotos': 'library.uploadPhoto',
  'library.tasksCopyOffline': 'library.tasksOfflineNote',
  'library.memberTaskCopy': 'library.memberTaskNote',
};

let count = 0;
for (const [from, to] of Object.entries(renames)) {
  const escaped = from.replace(/\./g, '\\.');
  const re = new RegExp("t\\('" + escaped + "'", 'g');
  const matches = code.match(re);
  if (matches) {
    count += matches.length;
    code = code.replace(re, "t('" + to + "'");
  }
}

// Fix param mismatches
code = code.replace(/t\('library\.memoriesCopy', \{ name:/g, "t('library.memoriesCopy', { spaceName:");
code = code.replace(/t\('library\.tasksCopyOnline', \{ name:/g, "t('library.tasksCopy', { spaceName:");

// Fix enteredPath -> enteredDir
code = code.replace(/t\('library\.enteredPath'/g, "t('library.enteredDir'");

console.log('Renamed ' + count + ' occurrences');
fs.writeFileSync('src/components/LibraryPane.tsx', code, 'utf8');
console.log('Done writing file');
