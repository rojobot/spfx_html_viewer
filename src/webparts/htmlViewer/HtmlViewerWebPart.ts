import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import { escape } from '@microsoft/sp-lodash-subset';
import {
  PropertyFieldFilePicker,
  type IFilePickerResult
} from '@pnp/spfx-property-controls/lib/PropertyFieldFilePicker';
import { FilePickerTabType } from '@pnp/spfx-property-controls/lib/propertyFields/filePicker/filePickerControls/FilePicker.types';
import {
  PropertyFieldFolderPicker,
  type IFolder
} from '@pnp/spfx-property-controls/lib/PropertyFieldFolderPicker';

import { webPartDataVersion } from '../../version';
import styles from './HtmlViewerWebPart.module.scss';
import * as strings from 'HtmlViewerWebPartStrings';
import {
  arePropertiesValid,
  type IPropertyValidationStrings,
  validateInitialFile,
  validateSharePointLocation
} from './propertyValidation';
import {
  getDefaultSharePointLocation,
  DEFAULT_INITIAL_FILE
} from './defaultContent';
import { buildFileUrl } from './fileUrlBuilder';
import { sanitizeUrlForLog } from './logMessage';
import {
  initializeViewerLogger,
  logViewerError,
  logViewerInfo,
  logViewerVerbose,
  logViewerWarning
} from './viewerLogger';
import {
  getFolderFromFileAbsoluteUrl,
  getFolderNameFromServerRelativeUrl,
  serverRelativeToSiteRelative,
  siteRelativeToServerRelative
} from './sharePointPath';
import {
  type IUrlAllowlistOptions,
  isSharePointLocationHostAllowed,
  isUrlAllowed,
  validateAllowedHostsValue
} from './urlAllowlist';
import {
  computeViewerHeight,
  formatViewerHeightCss,
  VIEWER_HEIGHT_CSS_VAR
} from './viewerLayout';

export interface IHtmlViewerWebPartProps {
  sharePointLocation: string;
  initialFile: string;
  selectedFolder?: IFolder;
  selectedFile?: IFilePickerResult;
  allowedHosts: string;
  restrictToCurrentSite: boolean;
}

const LOAD_TIMEOUT_MS = 30000;

const EMPTY_FILE_PICKER_RESULT: IFilePickerResult = {
  fileName: '',
  fileNameWithoutExtension: '',
  fileAbsoluteUrl: '',
  downloadFileContent: (): Promise<File> => Promise.reject(new Error('No file selected'))
};

export default class HtmlViewerWebPart extends BaseClientSideWebPart<IHtmlViewerWebPartProps> {

  private _isViewerDisposed: boolean = false;
  private _currentUrl: string | undefined;
  private _iframeElement: HTMLIFrameElement | undefined;
  private _retryButton: HTMLButtonElement | undefined;
  private _loadingTimeoutId: number | undefined;
  private _iframeLoadHandler: (() => void) | undefined;
  private _iframeErrorHandler: (() => void) | undefined;
  private _retryClickHandler: (() => void) | undefined;
  private _boundPropertyPaneFieldChanged: ((propertyPath: string, oldValue: unknown, newValue: unknown) => void) | undefined;
  private _resizeObserver: ResizeObserver | undefined;
  private _windowResizeHandler: (() => void) | undefined;

  protected onInit(): Promise<void> {
    initializeViewerLogger(this.context.serviceScope);
    this._boundPropertyPaneFieldChanged = this.onPropertyPaneFieldChanged.bind(this);
    this._applyDefaultLocationIfNeeded();
    this._initializeLayoutTracking();
    logViewerVerbose('Web part initialized', {
      webUrl: this.context.pageContext.web.absoluteUrl
    });
    return Promise.resolve();
  }

  private _applyDefaultLocationIfNeeded(): void {
    let updated = false;

    if (!(this.properties.sharePointLocation || '').trim()) {
      this.properties.sharePointLocation = getDefaultSharePointLocation();
      updated = true;
    }

    if (!(this.properties.initialFile || '').trim()) {
      this.properties.initialFile = DEFAULT_INITIAL_FILE;
      updated = true;
    }

    if (this.properties.allowedHosts === undefined) {
      this.properties.allowedHosts = '';
    }

    if (this.properties.restrictToCurrentSite === undefined) {
      this.properties.restrictToCurrentSite = false;
    }

    if (updated || !this.properties.selectedFolder?.ServerRelativeUrl) {
      const serverRelativeUrl = siteRelativeToServerRelative(
        this.properties.sharePointLocation,
        this.context.pageContext.web.serverRelativeUrl
      );

      this.properties.selectedFolder = {
        Name: getFolderNameFromServerRelativeUrl(serverRelativeUrl),
        ServerRelativeUrl: serverRelativeUrl
      };
    }
  }

  private _validationStrings(): IPropertyValidationStrings {
    return {
      SharePointLocationRequired: strings.SharePointLocationRequired,
      SharePointLocationInvalidPath: strings.SharePointLocationInvalidPath,
      SharePointLocationInvalidUrl: strings.SharePointLocationInvalidUrl,
      InitialFileRequired: strings.InitialFileRequired,
      InitialFileInvalid: strings.InitialFileInvalid
    };
  }

  private _getPropertyPaneChangeHandler(): (propertyPath: string, oldValue: unknown, newValue: unknown) => void {
    if (!this._boundPropertyPaneFieldChanged) {
      this._boundPropertyPaneFieldChanged = this.onPropertyPaneFieldChanged.bind(this);
    }

    return this._boundPropertyPaneFieldChanged as (propertyPath: string, oldValue: unknown, newValue: unknown) => void;
  }

  private _getAllowlistOptions(): IUrlAllowlistOptions {
    return {
      siteAbsoluteUrl: this.context.pageContext.site.absoluteUrl,
      webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
      allowedHosts: this.properties.allowedHosts || '',
      restrictToCurrentSite: !!this.properties.restrictToCurrentSite
    };
  }

  public render(): void {
    const validationStrings = this._validationStrings();
    const allowlistOptions = this._getAllowlistOptions();
    const locationError = validateSharePointLocation(this.properties.sharePointLocation, validationStrings);
    const fileError = validateInitialFile(this.properties.initialFile, validationStrings);
    let validationError = locationError || fileError;

    if (!validationError && !isSharePointLocationHostAllowed(this.properties.sharePointLocation, allowlistOptions)) {
      validationError = strings.UrlNotAllowedMessage;
    }

    if (validationError) {
      this._clearViewerState();
      logViewerWarning('Render blocked by validation', { reason: validationError });
      this.domElement.innerHTML = `<div class="${styles.error}">${escape(validationError)}</div>`;
      this._updateViewerLayout();
      return;
    }

    const fileUrl = this._buildFileUrl();

    if (!fileUrl) {
      this._clearViewerState();
      logViewerError('Could not build file URL');
      this.domElement.innerHTML = `<div class="${styles.error}">${escape(strings.LoadErrorMessage)}</div>`;
      this._updateViewerLayout();
      return;
    }

    if (!isUrlAllowed(fileUrl, allowlistOptions)) {
      this._clearViewerState();
      logViewerWarning('Render blocked by allowlist', sanitizeUrlForLog(fileUrl));
      this.domElement.innerHTML = `<div class="${styles.error}">${escape(strings.UrlNotAllowedMessage)}</div>`;
      this._updateViewerLayout();
      return;
    }

    if (fileUrl === this._currentUrl && this._iframeElement) {
      this._updateViewerLayout();
      return;
    }

    this._renderViewer(fileUrl);
    this._updateViewerLayout();
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: unknown, newValue: unknown): void {
    if (
      propertyPath === 'sharePointLocation'
      || propertyPath === 'initialFile'
      || propertyPath === 'selectedFolder'
      || propertyPath === 'selectedFile'
      || propertyPath === 'allowedHosts'
      || propertyPath === 'restrictToCurrentSite'
    ) {
      if (oldValue !== newValue) {
        this._currentUrl = undefined;
        this.render();
      }
    }
  }

  protected onDispose(): void {
    this._isViewerDisposed = true;
    logViewerVerbose('Web part disposed');
    this._teardownLayoutTracking();
    this._clearViewerState();
    this.domElement.innerHTML = '';
    this._boundPropertyPaneFieldChanged = undefined;
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected get dataVersion(): Version {
    return Version.parse(webPartDataVersion);
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const validationStrings = this._validationStrings();
    const webServerRelativeUrl = this.context.pageContext.web.serverRelativeUrl;

    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BrowseGroupName,
              groupFields: [
                PropertyFieldFolderPicker('selectedFolder', {
                  context: this.context,
                  label: strings.FolderPickerLabel,
                  selectedFolder: this._getSelectedFolder(),
                  rootFolder: {
                    Name: this.context.pageContext.web.title,
                    ServerRelativeUrl: webServerRelativeUrl
                  },
                  onPropertyChange: this._getPropertyPaneChangeHandler(),
                  properties: this.properties,
                  key: 'htmlViewerFolderPicker',
                  canCreateFolders: false,
                  onSelect: (folder: IFolder): void => {
                    this._onFolderSelected(folder);
                  }
                }),
                PropertyFieldFilePicker('selectedFile', {
                  context: this.context,
                  label: strings.FilePickerLabel,
                  buttonLabel: strings.FilePickerButtonLabel,
                  filePickerResult: this.properties.selectedFile || EMPTY_FILE_PICKER_RESULT,
                  onPropertyChange: this._getPropertyPaneChangeHandler(),
                  properties: this.properties,
                  key: 'htmlViewerFilePicker',
                  accepts: ['.html', '.htm'],
                  hideWebSearchTab: true,
                  hideStockImages: true,
                  hideLocalUploadTab: true,
                  hideOneDriveTab: true,
                  hideOrganisationalAssetTab: true,
                  hideRecentTab: false,
                  hideLinkUploadTab: false,
                  defaultSelectedTab: FilePickerTabType.SiteFilesTab,
                  onSave: (file: IFilePickerResult): void => {
                    this._onFileSelected(file);
                  },
                  onChanged: (file: IFilePickerResult): void => {
                    this._onFileSelected(file);
                  }
                })
              ]
            },
            {
              groupName: strings.ManualEntryGroupName,
              groupFields: [
                PropertyPaneTextField('sharePointLocation', {
                  label: strings.SharePointLocationFieldLabel,
                  description: strings.SharePointLocationFieldDescription,
                  deferredValidationTime: 300,
                  onGetErrorMessage: (value: string) => validateSharePointLocation(value, validationStrings)
                }),
                PropertyPaneTextField('initialFile', {
                  label: strings.InitialFileFieldLabel,
                  description: strings.InitialFileFieldDescription,
                  deferredValidationTime: 300,
                  onGetErrorMessage: (value: string) => validateInitialFile(value, validationStrings)
                })
              ]
            },
            {
              groupName: strings.SecurityGroupName,
              groupFields: [
                PropertyPaneTextField('allowedHosts', {
                  label: strings.AllowedHostsFieldLabel,
                  description: strings.AllowedHostsFieldDescription,
                  deferredValidationTime: 300,
                  onGetErrorMessage: (value: string) => validateAllowedHostsValue(value, strings.AllowedHostsInvalid)
                }),
                PropertyPaneToggle('restrictToCurrentSite', {
                  label: strings.RestrictToCurrentSiteLabel,
                  onText: strings.RestrictToCurrentSiteOnText,
                  offText: strings.RestrictToCurrentSiteOffText
                })
              ]
            }
          ]
        }
      ]
    };
  }

  private _getSelectedFolder(): IFolder {
    if (this.properties.selectedFolder?.ServerRelativeUrl) {
      return this.properties.selectedFolder;
    }

    const location = (this.properties.sharePointLocation || '').trim();

    if (!location || /^https?:\/\//i.test(location)) {
      return {
        Name: this.context.pageContext.web.title,
        ServerRelativeUrl: this.context.pageContext.web.serverRelativeUrl
      };
    }

    const serverRelativeUrl = siteRelativeToServerRelative(location, this.context.pageContext.web.serverRelativeUrl);

    return {
      Name: getFolderNameFromServerRelativeUrl(serverRelativeUrl),
      ServerRelativeUrl: serverRelativeUrl
    };
  }

  private _onFolderSelected(folder: IFolder): void {
    this.properties.selectedFolder = folder;
    this.properties.sharePointLocation = serverRelativeToSiteRelative(
      folder.ServerRelativeUrl,
      this.context.pageContext.web.serverRelativeUrl
    );
    this._currentUrl = undefined;
    this.render();
    this.context.propertyPane.refresh();
  }

  private _onFileSelected(file: IFilePickerResult): void {
    this.properties.selectedFile = file;

    if (file.fileName) {
      this.properties.initialFile = file.fileName;
    }

    if (file.fileAbsoluteUrl && file.fileName) {
      const folderPath = getFolderFromFileAbsoluteUrl(
        file.fileAbsoluteUrl,
        file.fileName,
        this.context.pageContext.web.serverRelativeUrl
      );

      if (folderPath) {
        this.properties.sharePointLocation = folderPath;
        const serverRelativeUrl = siteRelativeToServerRelative(
          folderPath,
          this.context.pageContext.web.serverRelativeUrl
        );
        this.properties.selectedFolder = {
          Name: getFolderNameFromServerRelativeUrl(serverRelativeUrl),
          ServerRelativeUrl: serverRelativeUrl
        };
      }
    }

    this._currentUrl = undefined;
    this.render();
    this.context.propertyPane.refresh();
  }

  private _renderViewer(fileUrl: string): void {
    this._clearViewerState();
    this._currentUrl = fileUrl;

    const fileTitle = escape(this.properties.initialFile || 'index.html');

    this.domElement.innerHTML = `
      <section class="${styles.htmlViewer}">
        <div class="${styles.viewerBody}">
          <div class="${styles.loadingOverlay}" data-role="loading-overlay" role="status" aria-live="polite">
            <div class="${styles.spinner}" aria-hidden="true"></div>
            <span class="${styles.loadingText}">${escape(strings.LoadingMessage)}</span>
          </div>
          <div class="${styles.loadError} ${styles.loadErrorHidden}" data-role="load-error" role="alert" aria-live="assertive">
            <p class="${styles.loadErrorText}" data-role="load-error-text"></p>
            <button type="button" class="${styles.retryButton}" data-role="retry-button">${escape(strings.RetryButtonLabel)}</button>
          </div>
          <iframe
            class="${styles.frame} ${styles.frameLoading}"
            data-role="content-frame"
            title="${fileTitle}"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
          ></iframe>
        </div>
      </section>`;

    this._iframeElement = this.domElement.querySelector('[data-role="content-frame"]') as HTMLIFrameElement;
    this._retryButton = this.domElement.querySelector('[data-role="retry-button"]') as HTMLButtonElement;

    if (!this._iframeElement) {
      return;
    }

    this._iframeLoadHandler = (): void => {
      this._onIframeLoaded();
    };
    this._iframeErrorHandler = (): void => {
      this._showLoadError(strings.LoadFailedMessage);
    };
    this._retryClickHandler = (): void => {
      this._retryLoad(fileUrl);
    };

    this._iframeElement.addEventListener('load', this._iframeLoadHandler);
    this._iframeElement.addEventListener('error', this._iframeErrorHandler);

    if (this._retryButton && this._retryClickHandler) {
      this._retryButton.addEventListener('click', this._retryClickHandler);
    }

    this._loadingTimeoutId = window.setTimeout((): void => {
      if (!this._isViewerDisposed) {
        this._showLoadError(strings.LoadTimeoutMessage);
      }
    }, LOAD_TIMEOUT_MS);

    logViewerInfo('Loading HTML content', sanitizeUrlForLog(fileUrl));
    this._iframeElement.src = fileUrl;
  }

  private _onIframeLoaded(): void {
    if (this._isViewerDisposed) {
      return;
    }

    this._clearLoadingTimeout();

    const overlay = this.domElement.querySelector('[data-role="loading-overlay"]');
    const errorPanel = this.domElement.querySelector('[data-role="load-error"]');

    if (overlay) {
      overlay.classList.add(styles.loadingOverlayHidden);
    }

    if (errorPanel) {
      errorPanel.classList.add(styles.loadErrorHidden);
    }

    if (this._iframeElement) {
      this._iframeElement.classList.remove(styles.frameLoading);
    }

    if (this._currentUrl) {
      logViewerInfo('Iframe loaded', sanitizeUrlForLog(this._currentUrl));
    }
  }

  private _showLoadError(message: string): void {
    if (this._isViewerDisposed) {
      return;
    }

    logViewerWarning('Iframe load failed', { message, url: this._currentUrl ? sanitizeUrlForLog(this._currentUrl) : undefined });
    this._clearLoadingTimeout();

    const overlay = this.domElement.querySelector('[data-role="loading-overlay"]');
    const errorPanel = this.domElement.querySelector('[data-role="load-error"]');
    const errorText = this.domElement.querySelector('[data-role="load-error-text"]');

    if (overlay) {
      overlay.classList.add(styles.loadingOverlayHidden);
    }

    if (errorText) {
      errorText.textContent = message;
    }

    if (errorPanel) {
      errorPanel.classList.remove(styles.loadErrorHidden);
    }

    if (this._iframeElement) {
      this._iframeElement.classList.add(styles.frameLoading);
    }
  }

  private _retryLoad(fileUrl: string): void {
    if (this._isViewerDisposed) {
      return;
    }

    logViewerInfo('Retrying iframe load', sanitizeUrlForLog(fileUrl));

    const overlay = this.domElement.querySelector('[data-role="loading-overlay"]');
    const errorPanel = this.domElement.querySelector('[data-role="load-error"]');

    if (overlay) {
      overlay.classList.remove(styles.loadingOverlayHidden);
    }

    if (errorPanel) {
      errorPanel.classList.add(styles.loadErrorHidden);
    }

    if (!this._iframeElement) {
      this._currentUrl = undefined;
      this.render();
      return;
    }

    this._clearLoadingTimeout();
    this._iframeElement.classList.add(styles.frameLoading);
    this._loadingTimeoutId = window.setTimeout((): void => {
      if (!this._isViewerDisposed) {
        this._showLoadError(strings.LoadTimeoutMessage);
      }
    }, LOAD_TIMEOUT_MS);
    this._iframeElement.src = fileUrl;
  }

  private _clearLoadingTimeout(): void {
    if (this._loadingTimeoutId !== undefined) {
      window.clearTimeout(this._loadingTimeoutId);
      this._loadingTimeoutId = undefined;
    }
  }

  private _clearViewerState(): void {
    this._clearLoadingTimeout();
    this._detachEventListeners();
    this._stopIframeLoading();

    this._iframeElement = undefined;
    this._retryButton = undefined;
    this._iframeLoadHandler = undefined;
    this._iframeErrorHandler = undefined;
    this._retryClickHandler = undefined;
    this._currentUrl = undefined;
  }

  private _detachEventListeners(): void {
    if (this._iframeElement) {
      if (this._iframeLoadHandler) {
        this._iframeElement.removeEventListener('load', this._iframeLoadHandler);
      }
      if (this._iframeErrorHandler) {
        this._iframeElement.removeEventListener('error', this._iframeErrorHandler);
      }
    }

    if (this._retryButton && this._retryClickHandler) {
      this._retryButton.removeEventListener('click', this._retryClickHandler);
    }
  }

  private _stopIframeLoading(): void {
    if (!this._iframeElement) {
      return;
    }

    try {
      this._iframeElement.src = 'about:blank';
    } catch {
      // Ignore errors while tearing down the iframe during dispose.
    }
  }

  private _initializeLayoutTracking(): void {
    this._windowResizeHandler = (): void => {
      this._updateViewerLayout();
    };

    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]): void => {
        const entry = entries[0];

        if (entry) {
          this._updateViewerLayoutFromRect(entry.contentRect.width, entry.contentRect.height);
        }
      });
      this._resizeObserver.observe(this.domElement);
    }

    window.addEventListener('resize', this._windowResizeHandler);
    this._updateViewerLayout();
  }

  private _teardownLayoutTracking(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = undefined;
    }

    if (this._windowResizeHandler) {
      window.removeEventListener('resize', this._windowResizeHandler);
      this._windowResizeHandler = undefined;
    }
  }

  private _updateViewerLayout(): void {
    this._updateViewerLayoutFromRect(
      this.domElement.clientWidth,
      this.domElement.clientHeight
    );
  }

  private _updateViewerLayoutFromRect(width: number, height: number): void {
    if (this._isViewerDisposed || width <= 0) {
      return;
    }

    const viewerHeight = computeViewerHeight(width, height, window.innerHeight);
    this.domElement.style.setProperty(
      VIEWER_HEIGHT_CSS_VAR,
      formatViewerHeightCss(viewerHeight)
    );
  }

  private _buildFileUrl(): string | undefined {
    const validationStrings = this._validationStrings();

    if (!arePropertiesValid(
      this.properties.sharePointLocation,
      this.properties.initialFile,
      validationStrings
    )) {
      return undefined;
    }

    return buildFileUrl({
      sharePointLocation: this.properties.sharePointLocation,
      initialFile: this.properties.initialFile,
      webAbsoluteUrl: this.context.pageContext.web.absoluteUrl
    });
  }
}
