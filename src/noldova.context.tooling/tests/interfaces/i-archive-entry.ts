/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface IArchiveEntry {
  readonly name: string;
  readonly content: string;
  readonly type?: string;
  readonly prefix?: string;
  readonly size?: string;
}
