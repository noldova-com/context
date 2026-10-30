/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type RegexVendoredFile from "./regex-vendored-file.ts";
import type RegexVendoredRoot from "./regex-vendored-root.ts";

export default class RegexConformanceProvenance {
  private static readonly JSON_INDENTATION: number = 2;
  private static readonly LINE_FEED: string = "\n";
  private static readonly SCHEMA_VERSION: number = 1;

  public readonly schemaVersion: number;
  public readonly repository: string;
  public readonly commit: string;
  public readonly roots: readonly RegexVendoredRoot[];
  public readonly license: { readonly upstreamPath: string; readonly localPath: string };
  public readonly caseFiles: number;

  public constructor(repository: string, commit: string, roots: readonly RegexVendoredRoot[], license: RegexVendoredFile) {
    this.schemaVersion = RegexConformanceProvenance.SCHEMA_VERSION;
    this.repository = repository;
    this.commit = commit;
    this.roots = roots;
    this.license = { upstreamPath: license.upstreamPath, localPath: license.localPath };
    this.caseFiles = roots.reduce((total, root) => total + root.files, 0);
  }

  public serialize(): string {
    return `${JSON.stringify(this, null, RegexConformanceProvenance.JSON_INDENTATION)}${RegexConformanceProvenance.LINE_FEED}`;
  }
}
