/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type TypeScriptVendoredFile from "./typescript-vendored-file.ts";
import type TypeScriptVendoredSection from "./typescript-vendored-section.ts";

export default class TypeScriptVendoredArchive {
  public readonly fileName: string;
  public readonly sections: readonly TypeScriptVendoredSection[];
  public readonly files: readonly TypeScriptVendoredFile[];

  public constructor(fileName: string, sections: readonly TypeScriptVendoredSection[], files: readonly TypeScriptVendoredFile[]) {
    this.fileName = fileName;
    this.sections = sections;
    this.files = files;
  }
}
