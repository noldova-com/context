/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface OptionValues {
  max?: number;
  min?: number;
  idleTimeout?: number;
  queueTimeout?: number;
  queryTimeout?: number;
  cancelTimeout?: number;
  maxLifetime?: number;
  maxPipeline?: number;
  backoff?: number;
  keepAlive?: number;
  scheduler?: boolean;
  prepare?: boolean;
  debug?: boolean;
  fetchTypes?: boolean;
  infer?: boolean;
}
