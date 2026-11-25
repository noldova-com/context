/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class ProviderSource {
  public readonly identity: string;
  public readonly source: string;

  public constructor(identity: string, source: string) {
    this.identity = identity;
    this.source = source;
  }
}
