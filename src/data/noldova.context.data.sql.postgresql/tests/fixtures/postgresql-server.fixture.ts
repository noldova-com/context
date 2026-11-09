/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { env } from "node:process";

import "@noldova/context.core";

export class PostgreSQLServerFixture {
  public static readonly variable: string = "NOLDOVA_CONTEXT_POSTGRESQL_URL";
  public readonly host: string;
  public readonly port: number;
  public readonly user: string;
  public readonly database: string;

  private constructor(url: URL) {
    this.host = url.hostname;
    this.port = Number(url.port);
    this.user = decodeURIComponent(url.username);
    this.database = decodeURIComponent(url.pathname.slice(1));
  }

  public static current(): PostgreSQLServerFixture {
    const text = env[PostgreSQLServerFixture.variable];
    if (Object.isUndefined(text) || text.length === 0)
      throw new Error(`${PostgreSQLServerFixture.variable} names no PostgreSQL server; run the tests with npm run test.`);

    return new PostgreSQLServerFixture(new URL(text));
  }
}
