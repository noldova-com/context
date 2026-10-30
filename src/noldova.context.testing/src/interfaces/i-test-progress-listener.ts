/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { DiscoveredTestClass } from "../models/discovery/discovered-test-class.js";
import type { DiscoveredTestMethod } from "../models/discovery/discovered-test-method.js";
import type { TestClassResult } from "../models/results/test-class-result.js";
import type { TestMethodResult } from "../models/results/test-method-result.js";

export interface ITestProgressListener {
  onMethodStarted?(testClass: DiscoveredTestClass, method: DiscoveredTestMethod): void;
  onMethodCompleted?(methodResult: TestMethodResult): void;
  onClassCompleted(classResult: TestClassResult): void;
}
