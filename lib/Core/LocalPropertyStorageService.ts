export class LocalPropertyStorageService {
  private _appName: string;
  constructor(appName: string) {
    this._appName = appName;
  }

  set appName(appName: string) {
    this._appName = appName;
  }

  get supportsLocalStorage() {
    try {
      return typeof window.localStorage !== undefined;
    } catch (e) {
      // SecurityError can arise if 3rd party cookies are blocked in Chrome and we're served in an iFrame
      return false;
    }
  }

  get(key: string): string | boolean | null {
    if (!this.supportsLocalStorage) return null;

    const value = window.localStorage.getItem(`${this._appName}.${key}`);
    if (value === "true") {
      return true;
    } else if (value === "false") {
      return false;
    }
    return value;
  }

  set(key: string, value: string | boolean): boolean {
    if (!this.supportsLocalStorage) return false;

    window.localStorage.setItem(`${this._appName}.${key}`, value.toString());
    return true;
  }
}
