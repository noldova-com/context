/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import { SystemCertificates } from "@noldova/context.data.sql.postgresql/models/system-certificates.js";

export class FixedCertificates extends SystemCertificates {
  private readonly certificates: string[];

  public constructor(certificates: string[]) {
    super();
    this.certificates = certificates;
  }

  public override read(): string[] {
    return this.certificates;
  }
}
