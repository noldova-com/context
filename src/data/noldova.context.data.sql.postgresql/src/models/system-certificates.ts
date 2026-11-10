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

import { Resources } from "../resources.js";

export class SystemCertificates {
  public read(): string[] {
    return getCACertificates(Resources.systemCertificates);
  }
}
