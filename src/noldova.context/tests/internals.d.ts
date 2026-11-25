/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module "@noldova/context/api/ctx.js" { }

declare module "@noldova/context/services/host-locator.service.js" {
  export class HostLocatorService {
    public static locate(directory: string, ownEntryPath: string): string | undefined;
  }
}
