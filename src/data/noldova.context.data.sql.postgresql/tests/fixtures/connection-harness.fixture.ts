/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";

import { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
import { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
import { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
import { QueryStatement } from "@noldova/context.data.sql.postgresql/models/query-statement.js";
import { QueryWire } from "@noldova/context.data.sql.postgresql/models/query-wire.js";
import { StartedSession } from "@noldova/context.data.sql.postgresql/models/started-session.js";
import { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql/models/client/postgresql-connection.js";
import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";

import { FakeEvents } from "./fake-events.fixture.js";
import { FakeQueryHandler } from "./fake-query-handler.fixture.js";
import { FakeSessionStarter } from "./fake-session-starter.fixture.js";
import { FakeSocket } from "./fake-socket.fixture.js";
import { FakeTimers } from "./fake-timers.fixture.js";

export class ConnectionHarness {
  public readonly socket: FakeSocket;
  public readonly timers: FakeTimers = new FakeTimers();
  public readonly starter: FakeSessionStarter = new FakeSessionStarter();
  public readonly options: ClientOptions;
  public readonly events: FakeEvents;
  public readonly handler: FakeQueryHandler;
  public readonly connection: PostgreSQLConnection;

  public constructor(values: Partial<ClientOptions> = {}, rest: Buffer = Buffer.alloc(0), socket: FakeSocket = new FakeSocket()) {
    this.socket = socket;
    this.options = new ClientOptions({ ...values, timers: this.timers });
    this.events = new FakeEvents(this.options);
    this.handler = new FakeQueryHandler(this.options);
    const session = new StartedSession(this.socket, rest, new Map([["server_version", "17"]]), new BackendKey(7, 9), "I", "localhost", 5432, this.starter);
    this.connection = new PostgreSQLConnection(session, this.options, this.events);
  }

  public query(statement: QueryStatement, values: readonly unknown[], oids: readonly number[]): Query {
    const query = new Query(new BuiltQuery(statement.text, values, oids), this.handler);
    query.wire = new QueryWire(statement, query.built);
    return query;
  }

  public unnamed(text: string, values: readonly unknown[] = [], oids: readonly number[] = []): Query {
    return this.query(new QueryStatement("", text), values, oids);
  }

  public plain(text: string): Query {
    return new Query(new BuiltQuery(text, [], []), this.handler);
  }

  public written(): string {
    this.timers.tick();
    return this.socket.take();
  }

  public async writtenAsync(): Promise<string> {
    await this.socket.waitForAsync(() => {
      this.timers.tick();
      return this.socket.written.length > 0;
    });
    return this.socket.take();
  }

  public receive(...messages: Buffer[]): void {
    this.socket.receive(...messages);
  }
}
