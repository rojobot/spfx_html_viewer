declare interface IHtmlViewerWebPartStrings {
  PropertyPaneDescription: string;
  ContentGroupName: string;
  BrowseGroupName: string;
  ManualEntryGroupName: string;
  FolderPickerLabel: string;
  FilePickerLabel: string;
  FilePickerButtonLabel: string;
  SharePointLocationFieldLabel: string;
  SharePointLocationFieldDescription: string;
  InitialFileFieldLabel: string;
  InitialFileFieldDescription: string;
  MissingLocationMessage: string;
  LoadErrorMessage: string;
  SharePointLocationRequired: string;
  SharePointLocationInvalidPath: string;
  SharePointLocationInvalidUrl: string;
  InitialFileRequired: string;
  InitialFileInvalid: string;
  LoadingMessage: string;
  LoadTimeoutMessage: string;
  LoadFailedMessage: string;
  RetryButtonLabel: string;
  SecurityGroupName: string;
  AllowedHostsFieldLabel: string;
  AllowedHostsFieldDescription: string;
  AllowedHostsInvalid: string;
  RestrictToCurrentSiteLabel: string;
  RestrictToCurrentSiteOnText: string;
  RestrictToCurrentSiteOffText: string;
  UrlNotAllowedMessage: string;
}

declare module 'HtmlViewerWebPartStrings' {
  const strings: IHtmlViewerWebPartStrings;
  export = strings;
}
