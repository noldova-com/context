/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from "node:path";

export default class RegexConformanceLayout {
  public static readonly TESTS_DIRECTORY: string = "src/parsers/noldova.context.parsers.regex/tests";
  public static readonly DIRECTORY: string = path.posix.join(RegexConformanceLayout.TESTS_DIRECTORY, "conformance");
  public static readonly CASES: string = "cases";
  public static readonly EXPECTED: string = "expected";
  public static readonly LICENSES: string = "licenses";
  public static readonly PROVENANCE: string = "PROVENANCE.json";

  public static pathOf(localPath: string): string {
    return path.posix.join(RegexConformanceLayout.DIRECTORY, localPath);
  }
}
