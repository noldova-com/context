/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class TypeScriptVendoredSelection {
  private static readonly WILDCARD: string = "*";

  private readonly prefix: string;
  private readonly suffix: string;

  public constructor(prefix: string, suffix: string) {
    this.prefix = prefix;
    this.suffix = suffix;
  }

  public get text(): string {
    return `${this.prefix}${TypeScriptVendoredSelection.WILDCARD}${this.suffix}`;
  }

  public selects(name: string): boolean {
    return name.length >= this.prefix.length + this.suffix.length && name.startsWith(this.prefix) && name.endsWith(this.suffix);
  }
}
