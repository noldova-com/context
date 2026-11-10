/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import "@noldova/context.core";
import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import type { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
import { QueryHandler } from "@noldova/context.data.sql.postgresql/services/client/query-handler.js";

export class FakeQueryHandler extends QueryHandler {
  public readonly handled: Query[] = [];
  public readonly cancelled: Query[] = [];
  public onHandle: (query: Query) => void = () => undefined;
  public cancelFailure: Error | null = null;
  private readonly clientOptions: ClientOptions;

  public constructor(options: ClientOptions) {
    super();
    this.clientOptions = options;
  }

  public override get options(): ClientOptions {
    return this.clientOptions;
  }

  public override handle(query: Query): void {
    this.handled.push(query);
    this.onHandle(query);
  }

  public override cancelAsync(query: Query): Promise<void> {
    this.cancelled.push(query);
    return Object.isNull(this.cancelFailure) ? Promise.resolve() : Promise.reject(this.cancelFailure);
  }
}
