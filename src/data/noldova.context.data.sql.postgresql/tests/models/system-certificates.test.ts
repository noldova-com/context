/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { getCACertificates } from "node:tls";

import "@noldova/context.core";
import { SystemCertificates } from "@noldova/context.data.sql.postgresql/models/system-certificates.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

@TestClass
export class SystemCertificatesTests {
  @TestMethod
  public readsTheOperatingSystemsRoots(): void {
    Assert.areEqual(getCACertificates("system").join(), new SystemCertificates().read().join());
  }
}
