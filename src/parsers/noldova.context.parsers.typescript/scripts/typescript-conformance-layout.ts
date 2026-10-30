/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from "node:path";

export default class TypeScriptConformanceLayout {
  public static readonly TESTS_DIRECTORY: string = "src/parsers/noldova.context.parsers.typescript/tests";
  public static readonly DIRECTORY: string = path.posix.join(TypeScriptConformanceLayout.TESTS_DIRECTORY, "conformance");
  public static readonly BASELINES: string = "baselines";
  public static readonly CASES: string = "cases";
  public static readonly DIAGNOSTIC_DEFINITIONS: string = "diagnostic-definitions";
  public static readonly EXPECTED: string = "expected";
  public static readonly LIBRARIES: string = "libraries";
  public static readonly LICENSES: string = "licenses";
  public static readonly PROVENANCE: string = "PROVENANCE.json";

  public static pathOf(localPath: string): string {
    return path.posix.join(TypeScriptConformanceLayout.DIRECTORY, localPath);
  }
}
