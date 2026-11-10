/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { setImmediate } from "node:timers";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
import { PostgreSQLClient } from "@noldova/context.data.sql.postgresql/models/client/postgresql-client.js";
import type { ClientSettings } from "@noldova/context.data.sql.postgresql/types/client-settings.js";
import type { QueryOutcome } from "@noldova/context.data.sql.postgresql/types/query-outcome.js";

import { PostgreSQLServerFixture } from "./postgresql-server.fixture.js";

export class RealClient {
  public static location(): string {
    const server = PostgreSQLServerFixture.current();
    return `postgres://${encodeURIComponent(server.user)}@${server.host}:${String(server.port)}/${encodeURIComponent(server.database)}`;
  }

  public static create(settings: ClientSettings = {}): PostgreSQLClient {
    return PostgreSQLClient.create(RealClient.location(), { maxLifetime: null, ...settings });
  }

  public static rows(outcome: unknown): Result {
    if (outcome instanceof Result)
      return outcome;

    throw new DataException("The query did not give one result.");
  }

  public static list(outcome: QueryOutcome): readonly unknown[] {
    if (Array.isArray(outcome))
      return outcome;

    throw new DataException("The query did not give a list.");
  }

  public static field(outcome: unknown, name: string): unknown {
    const row = RealClient.rows(outcome)[0];
    return Object.isObject(row) ? new Map(Object.entries(row)).get(name) : undefined;
  }

  public static async untilAsync(condition: () => boolean): Promise<boolean> {
    for (let attempt = 0; attempt < 100000 && !condition(); attempt += 1)
      await new Promise<void>(resolve => setImmediate(resolve));

    return condition();
  }
}
