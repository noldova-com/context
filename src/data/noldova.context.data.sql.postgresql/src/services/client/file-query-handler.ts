/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { readFile } from "node:fs/promises";

import type { ClientOptions } from "../../models/client-options.js";
import type { ClientQuery } from "../../models/client/client-query.js";
import type { Query } from "../../models/client/query.js";
import { QueryHandler } from "./query-handler.js";

export class FileQueryHandler extends QueryHandler {
  private readonly path: string;
  private readonly inner: QueryHandler;

  public constructor(path: string, inner: QueryHandler) {
    super();
    this.path = path;
    this.inner = inner;
  }

  public override get options(): ClientOptions {
    return this.inner.options;
  }

  public override handle(query: ClientQuery): void {
    readFile(this.path, "utf8").then(text => {
      query.load(text);
      this.inner.handle(query);
    }, (error: Error) => query.reject(error));
  }

  public override cancelAsync(query: Query): Promise<void> {
    return this.inner.cancelAsync(query);
  }
}
