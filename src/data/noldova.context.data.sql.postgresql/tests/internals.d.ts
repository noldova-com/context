/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Supplies test-local types for the installed package's internal modules.
 * These declarations must stay synchronized with their implementations;
 * they do not enforce access permissions or ship with production code.
 *
 * This file is a script, not a module: it must contain no top-level import or
 * export.
 */

declare module "@noldova/context.data.sql.postgresql/services/parameter-rewriter.js" {
  export class ParameterRewriter {
    public static rewrite(text: string, parameters: number): string;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/value-converter.js" {
  import type { DataValue } from "@noldova/context.data";

  export class ValueConverter {
    public static read(type: number, text: string | null): DataValue;
    public static write(value: DataValue): string | null;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/connection-string.parser.js" {
  export class ConnectionStringParser {
    public static parse(location: string): {
      readonly host: string;
      readonly port: number;
      readonly database: string;
      readonly user: string;
      readonly password: string;
      readonly sslMode: string;
      readonly channelBinding: string;
      readonly connectTimeout: number;
      readonly parameters: ReadonlyMap<string, string>;
      readonly rootCertificate: string | null;
      readonly sslCertificate: string | null;
      readonly sslKey: string | null;
      readonly sslPassword: string | null;
    };
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/channel-binding.js" {
  export enum ChannelBinding {
    Disable = "disable",
    Prefer = "prefer",
    Require = "require"
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/ssl-mode.js" {
  export enum SslMode {
    Disable = "disable",
    Prefer = "prefer",
    Require = "require",
    VerifyCa = "verify-ca",
    VerifyFull = "verify-full"
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/exchange-kind.js" {
  export enum ExchangeKind {
    Query = "query",
    Describe = "describe",
    Simple = "simple",
    Local = "local",
    Internal = "internal",
    Step = "step"
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/prepared-state.js" {
  export enum PreparedState {
    Parsing = "parsing",
    Ready = "ready",
    Stale = "stale"
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/cursor-action.js" {
  export enum CursorAction {
    Next = "next",
    Close = "close"
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/lease-kind.js" {
  export enum LeaseKind {
    Reserve = "reserve",
    Transaction = "transaction"
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/message-target.js" {
  export enum MessageTarget {
    Portal = 80,
    Statement = 83
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/row-mode.js" {
  export enum RowMode {
    Object = "object",
    Raw = "raw",
    Values = "values"
  }
}

declare module "@noldova/context.data.sql.postgresql/enums/write-outcome.js" {
  export enum WriteOutcome {
    Written = "written",
    Held = "held",
    Skipped = "skipped"
  }
}

declare module "@noldova/context.data.sql.postgresql/types/value-parser.js" {
  export type ValueParser = (text: string) => unknown;
}

declare module "@noldova/context.data.sql.postgresql/types/value-serializer.js" {
  export type ValueSerializer = (value: unknown) => string | Uint8Array | null;
}

declare module "@noldova/context.data.sql.postgresql/types/binary-decoder.js" {
  import type { Buffer } from "node:buffer";

  export type BinaryDecoder = (data: Buffer, start: number, end: number) => unknown;
}

declare module "@noldova/context.data.sql.postgresql/types/query-outcome.js" {
  import type { Readable, Writable } from "node:stream";

  import type { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
  import type { StatementDescription } from "@noldova/context.data.sql.postgresql/models/statement-description.js";

  export type QueryOutcome = Result | Readable | Writable | StatementDescription | readonly QueryOutcome[] | null;
}

declare module "@noldova/context.data.sql.postgresql/exceptions/batch.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class BatchException extends DataException {
    public readonly index: number;
    public constructor(index: number, cause: Error);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/batch-skipped.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class BatchSkippedException extends DataException {
    public readonly index: number;
    public constructor(index: number, cause: Error | null);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/cancel-unanswered.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class CancelUnansweredException extends DataException {
    public readonly seconds: number;
    public readonly silent: boolean;
    public constructor(seconds: number, silent: boolean);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class ConnectionClosedException extends DataException {
    public readonly destroyed: boolean;
    public readonly host: string;
    public readonly port: number;
    public constructor(destroyed: boolean, host: string, port: number, cause: Error | null);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/postgresql.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class PostgreSQLException extends DataException {
    public readonly sqlState: string;
    public readonly severity: string;
    public readonly detail: string | null;
    public readonly hint: string | null;
    public readonly schemaName: string | null;
    public readonly tableName: string | null;
    public readonly columnName: string | null;
    public readonly constraintName: string | null;
    public constructor(fields: ReadonlyMap<string, string>);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/query-canceled.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class QueryCanceledException extends DataException {
    public constructor();
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/query-timeout.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class QueryTimeoutException extends DataException {
    public readonly seconds: number;
    public constructor(seconds: number, cause: unknown);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/unsafe-transaction.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class UnsafeTransactionException extends DataException {
    public constructor(message: string);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/connection-ended.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class ConnectionEndedException extends DataException {
    public readonly host: string;
    public readonly port: number;
    public constructor(host: string, port: number);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/queue-timeout.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class QueueTimeoutException extends DataException {
    public readonly seconds: number;
    public constructor(seconds: number);
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/type-not-found.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class TypeNotFoundException extends DataException {
    public readonly names: readonly string[];
    public constructor(names: readonly string[]);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/pool-stats.js" {
  export class PoolStats {
    public readonly connections: number;
    public readonly opening: number;
    public readonly idle: number;
    public readonly leased: number;
    public readonly waiting: number;
    public constructor(connections: number, opening: number, idle: number, leased: number, waiting: number);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/backend-key.js" {
  export class BackendKey {
    public readonly pid: number;
    public readonly secret: number;
    public constructor(pid: number, secret: number);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/notification.js" {
  export class Notification {
    public readonly pid: number;
    public readonly channel: string;
    public readonly payload: string;
    public constructor(pid: number, channel: string, payload: string);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/built-query.js" {
  export class BuiltQuery {
    public readonly text: string;
    public readonly values: readonly unknown[];
    public readonly oids: readonly number[];
    public constructor(text: string, values: readonly unknown[], oids: readonly number[]);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/query-statement.js" {
  import type { QueryCost } from "@noldova/context.data.sql.postgresql/models/query-cost.js";

  export class QueryStatement {
    public name: string;
    public readonly text: string;
    public ends: boolean | null;
    public shape: string | null;
    public version: number;
    public live: boolean;
    public used: number;
    public cost: QueryCost | null;
    public alone: boolean | null;
    public constructor(name: string, text: string);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/query-wire.js" {
  import type { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
  import type { QueryStatement } from "@noldova/context.data.sql.postgresql/models/query-statement.js";

  export class QueryWire {
    public readonly statement: QueryStatement;
    public readonly built: BuiltQuery;
    public constructor(statement: QueryStatement, built: BuiltQuery);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/query-options.js" {
  export class QueryOptions {
    public simple: boolean;
    public prepare: boolean | null;
    public constructor(simple?: boolean, prepare?: boolean | null);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/query-cost.js" {
  export class QueryCost {
    public estimate: number | null;
    public alone: boolean | null;
    public constructor(estimate?: number | null);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/column.js" {
  import type { BinaryDecoder } from "@noldova/context.data.sql.postgresql/types/binary-decoder.js";
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";

  export class Column {
    public readonly name: string;
    public readonly parser: ValueParser | null;
    public readonly decode: BinaryDecoder | null;
    public readonly table: number;
    public readonly number: number;
    public readonly type: number;
    public constructor(name: string, parser: ValueParser | null, decode: BinaryDecoder | null, table: number, number: number, type: number);
    public withDecoder(decode: BinaryDecoder): Column;
    public withParser(parser: ValueParser | null): Column;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/statement-description.js" {
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";

  export class StatementDescription {
    public readonly name: string;
    public readonly text: string;
    public readonly types: readonly number[];
    public readonly columns: readonly Column[];
    public constructor(name: string, text: string, types: readonly number[], columns: readonly Column[]);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/statement-shape.js" {
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";

  export class StatementShape {
    public readonly params: readonly number[];
    public readonly columns: readonly Column[] | null;
    public constructor(params: readonly number[], columns: readonly Column[] | null);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/prepared-statement.js" {
  import type { PreparedState } from "@noldova/context.data.sql.postgresql/enums/prepared-state.js";
  import type { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";

  export class PreparedStatement {
    public readonly name: string;
    public oids: readonly number[] | null;
    public state: PreparedState;
    public constructor(name: string, owner: Exchange, oids: readonly number[] | null);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/result.js" {
  import type { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";
  import type { StatementDescription } from "@noldova/context.data.sql.postgresql/models/statement-description.js";
  import type { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";

  export class Result extends Array<unknown> {
    public count: number | null;
    public state: BackendKey | null;
    public command: string | null;
    public columns: readonly Column[] | null;
    public constructor();
    public static override get [Symbol.species](): ArrayConstructor;
    public get statement(): StatementDescription | null;
    public set statement(source: Exchange | StatementDescription | null);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/typed-parameter.js" {
  export class TypedParameter {
    public readonly value: unknown;
    public readonly type: number | string;
    public constructor(value: unknown, type: number | string);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/type-definition.js" {
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";
  import type { ValueSerializer } from "@noldova/context.data.sql.postgresql/types/value-serializer.js";

  export class TypeDefinition {
    public readonly to: number | string;
    public readonly from: readonly (number | string)[];
    public readonly serialize: ValueSerializer | null;
    public readonly parse: ValueParser | null;
    public constructor(to: number | string, from: readonly (number | string)[], serialize: ValueSerializer | null, parse: ValueParser | null);
    public get oids(): readonly (number | string)[];
  }
}

declare module "@noldova/context.data.sql.postgresql/models/transform-options.js" {
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";

  export class TransformOptions {
    public readonly undefinedValue: unknown;
    public readonly json: boolean | null;
    public readonly columnFrom: ((name: string) => string) | null;
    public readonly columnTo: ((name: string) => string) | null;
    public readonly valueFrom: ((value: unknown, column: Column) => unknown) | null;
    public readonly valueTo: ((value: unknown) => unknown) | null;
    public readonly rowFrom: ((row: unknown) => unknown) | null;
    public readonly rowTo: ((row: unknown) => unknown) | null;
    public constructor(values?: Partial<TransformOptions>);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client-options.js" {
  import type { TransformOptions } from "@noldova/context.data.sql.postgresql/models/transform-options.js";
  import type { TypeDefinition } from "@noldova/context.data.sql.postgresql/models/type-definition.js";
  import type { ClientTimers } from "@noldova/context.data.sql.postgresql/models/client/client-timers.js";

  export class ClientOptions {
    public readonly max: number;
    public readonly min: number;
    public readonly idleTimeout: number | null;
    public readonly queueTimeout: number;
    public readonly queryTimeout: number;
    public readonly cancelTimeout: number;
    public readonly maxLifetime: number | (() => number) | null;
    public readonly maxPipeline: number;
    public readonly scheduler: boolean;
    public readonly backoff: number | ((retries: number) => number);
    public readonly keepAlive: number;
    public readonly prepare: boolean;
    public readonly debug: boolean | ((connection: number, text: string, values: readonly unknown[], oids: readonly number[]) => void);
    public readonly fetchTypes: boolean;
    public readonly eagerTypes: boolean;
    public readonly infer: boolean;
    public readonly unrefSockets: boolean;
    public readonly types: readonly TypeDefinition[];
    public readonly transform: TransformOptions;
    public readonly onnotice: ((notice: ReadonlyMap<string, string>) => void) | false | null;
    public readonly onnotify: ((channel: string, payload: string, pid: number) => void) | null;
    public readonly onclose: ((connection: number) => void) | null;
    public readonly onparameter: ((name: string, value: string) => void) | null;
    public readonly timers: ClientTimers;
    public constructor(values?: Partial<ClientOptions>);
    public static computeLifetime(): number;
    public static computeBackoff(retries: number): number;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/connection-options.js" {
  import type { ChannelBinding } from "@noldova/context.data.sql.postgresql/enums/channel-binding.js";
  import type { SslMode } from "@noldova/context.data.sql.postgresql/enums/ssl-mode.js";
  import type { SystemCertificates } from "@noldova/context.data.sql.postgresql/models/system-certificates.js";

  export class ConnectionOptions {
    public readonly host: string;
    public readonly port: number;
    public readonly database: string;
    public readonly user: string;
    public readonly password: string;
    public readonly sslMode: SslMode;
    public readonly channelBinding: ChannelBinding;
    public readonly connectTimeout: number;
    public readonly parameters: ReadonlyMap<string, string>;
    public readonly systemCertificates: SystemCertificates;
    public readonly rootCertificate: string | null;
    public readonly sslCertificate: string | null;
    public readonly sslKey: string | null;
    public readonly sslPassword: string | null;
    public constructor(
      host: string, port: number, database: string, user: string, password: string, sslMode: SslMode, channelBinding: ChannelBinding,
      connectTimeout: number, parameters: ReadonlyMap<string, string>, systemCertificates: SystemCertificates, rootCertificate?: string | null, sslCertificate?: string | null, sslKey?: string | null,
      sslPassword?: string | null);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/system-certificates.js" {
  export class SystemCertificates {
    public read(): string[];
  }
}

declare module "@noldova/context.data.sql.postgresql/models/started-session.js" {
  import type { Buffer } from "node:buffer";

  import type { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
  import type { ConnectionSocket } from "@noldova/context.data.sql.postgresql/models/client/connection-socket.js";
  import type { SessionStarter } from "@noldova/context.data.sql.postgresql/services/session-starter.js";

  export class StartedSession {
    public readonly socket: ConnectionSocket;
    public readonly rest: Buffer;
    public readonly parameters: ReadonlyMap<string, string>;
    public readonly backend: BackendKey;
    public readonly status: string;
    public readonly host: string;
    public readonly port: number;
    public constructor(
      socket: ConnectionSocket, rest: Buffer, parameters: ReadonlyMap<string, string>, backend: BackendKey, status: string, host: string, port: number,
      starter: SessionStarter);
    public cancelAsync(signal: AbortSignal): Promise<void>;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/tls-options.reader.js" {
  import type { ConnectionOptions as TlsOptions } from "node:tls";

  import type { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";

  export class TlsOptionsReader {
    public static readAsync(options: ConnectionOptions): Promise<TlsOptions>;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/session-starter.js" {
  import type { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
  import type { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
  import type { StartedSession } from "@noldova/context.data.sql.postgresql/models/started-session.js";

  export class SessionStarter {
    public constructor(options: ConnectionOptions, cancelTimeout?: number);
    public startAsync(): Promise<StartedSession>;
    public cancelAsync(backend: BackendKey, signal: AbortSignal): Promise<void>;
    public stop(): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/client-timers.js" {
  export class ClientTimers {
    public setTimeout(callback: () => void, milliseconds: number): number;
    public clearTimeout(id: number | null): void;
    public unref(id: number): void;
    public readTime(): number;
    public nextTick(callback: () => void): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/client/connection-lease.js" {
  import type { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";

  export abstract class ConnectionLease {
    public abstract get kind(): LeaseKind;
    public abstract onClose(error: Error): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/connection-socket.js" {
  import type { Buffer } from "node:buffer";

  export abstract class ConnectionSocket {
    public onData: (data: Buffer) => void;
    public onDrain: () => void;
    public onClose: (error: Error | null) => void;
    public abstract get isClosed(): boolean;
    public abstract get isShared(): boolean;
    public abstract write(data: Buffer): boolean;
    public abstract end(data: Buffer): void;
    public abstract destroy(error?: Error | null): void;
    public abstract pause(): void;
    public abstract resume(): void;
    public abstract ref(): void;
    public abstract unref(): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/client/connection-events.js" {
  import type { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
  import type { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql/models/client/postgresql-connection.js";
  import type { BinaryDecoder } from "@noldova/context.data.sql.postgresql/types/binary-decoder.js";
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";
  import type { ValueSerializer } from "@noldova/context.data.sql.postgresql/types/value-serializer.js";

  export abstract class ConnectionEvents {
    public abstract get typed(): boolean;
    public abstract get plain(): boolean;
    public abstract get cancels(): AbortSignal;
    public abstract findParser(oid: number): ValueParser | null;
    public abstract findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null;
    public abstract findBinaryDecoder(oid: number): BinaryDecoder | null;
    public abstract findSerializer(oid: number): ValueSerializer;
    public abstract hasUnknownTypes(oids: readonly number[]): boolean;
    public abstract requestTypes(connection: PostgreSQLConnection): void;
    public abstract onReady(connection: PostgreSQLConnection): void;
    public abstract onClose(connection: PostgreSQLConnection, error: ConnectionClosedException): void;
    public abstract onNotify(channel: string, payload: string, pid: number): void;
    public abstract onParameter(name: string, value: string): void;
    public abstract onTimed(sample: number, time: number): void;
    public abstract onCancelling(cancel: Promise<void>): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/client/query-handler.js" {
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import type { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";

  export abstract class QueryHandler {
    public abstract get options(): ClientOptions;
    public abstract handle(query: Query): void;
    public abstract cancelAsync(query: Query): Promise<void>;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/exchange.js" {
  import type { ExchangeKind } from "@noldova/context.data.sql.postgresql/enums/exchange-kind.js";
  import type { WriteOutcome } from "@noldova/context.data.sql.postgresql/enums/write-outcome.js";
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";
  import type { PreparedStatement } from "@noldova/context.data.sql.postgresql/models/prepared-statement.js";
  import type { QueryStatement } from "@noldova/context.data.sql.postgresql/models/query-statement.js";
  import type { StatementDescription } from "@noldova/context.data.sql.postgresql/models/statement-description.js";
  import type { ConnectionLease } from "@noldova/context.data.sql.postgresql/services/client/connection-lease.js";
  import type { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";

  export class Exchange {
    public kind: ExchangeKind;
    public readonly query: Query | null;
    public readonly lease: ConnectionLease | null;
    public statement: QueryStatement | null;
    public text: string;
    public entry: PreparedStatement | null;
    public params: readonly number[] | null;
    public columns: readonly Column[] | null;
    public error: Error | null;
    public describing: boolean;
    public gate: boolean;
    public learn: boolean;
    public flushing: boolean;
    public synced: boolean;
    public streaming: boolean;
    public open: boolean;
    public done: boolean;
    public readonly alone: boolean;
    public cost: number | null;
    public constructor(kind: ExchangeKind, query: Query | null, lease: ConnectionLease | null, write: (exchange: Exchange) => WriteOutcome);
    public get exclusive(): boolean;
    public isHolding(): boolean;
    public isNotable(threshold: number): boolean;
    public describe(): StatementDescription;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/query.js" {
  import type { RowMode } from "@noldova/context.data.sql.postgresql/enums/row-mode.js";
  import type { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
  import type { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";
  import type { QueryCost } from "@noldova/context.data.sql.postgresql/models/query-cost.js";
  import type { QueryOptions } from "@noldova/context.data.sql.postgresql/models/query-options.js";
  import type { QueryWire } from "@noldova/context.data.sql.postgresql/models/query-wire.js";
  import type { Result } from "@noldova/context.data.sql.postgresql/models/result.js";
  import type { StatementDescription } from "@noldova/context.data.sql.postgresql/models/statement-description.js";
  import type { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";
  import type { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql/models/client/postgresql-connection.js";
  import type { QueryHandler } from "@noldova/context.data.sql.postgresql/services/client/query-handler.js";
  import type { QueryOutcome } from "@noldova/context.data.sql.postgresql/types/query-outcome.js";
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";

  export class Query implements PromiseLike<QueryOutcome> {
    public readonly built: BuiltQuery;
    public readonly handler: QueryHandler;
    public readonly options: QueryOptions;
    public wire: QueryWire | null;
    public state: BackendKey | null;
    public source: Exchange | null;
    public active: boolean;
    public executed: boolean;
    public settled: boolean;
    public timer: number | null;
    public timedOut: boolean;
    public cursorRows: number;
    public cursorFn: ((rows: Result) => unknown) | null;
    public forEachFn: ((row: unknown, result: Result) => void) | null;
    public streaming: boolean;
    public onlyDescribe: boolean;
    public rowMode: RowMode;
    public ownParsers: ((column: Column) => ValueParser | null) | ReadonlyMap<number, ValueParser | null> | null;
    public parts: readonly Query[] | null;
    public owner: Query | null;
    public alone: boolean;
    public cost: QueryCost | null;
    public cancelled: boolean;
    public aborted: Error | null;
    public onwrite: (() => void) | null;
    public connection: PostgreSQLConnection | null;
    public constructor(built: BuiltQuery, handler: QueryHandler, options?: QueryOptions);
    public get promise(): Promise<QueryOutcome>;
    public get statement(): StatementDescription | null;
    public get text(): string;
    public get parameters(): readonly unknown[];
    public build(): BuiltQuery;
    public redirect(resolve: (value: QueryOutcome) => void, reject: (error: Error) => void): void;
    public resolve(value: QueryOutcome): void;
    public reject(error: Error): void;
    public complete(value: QueryOutcome): void;
    public fail(error: Error): void;
    public finish(): void;
    public cancelAsync(): Promise<void>;
    public useSignal(signal: AbortSignal | null): this;
    public useSimpleProtocol(): this;
    public openReadableAsync(): Promise<QueryOutcome>;
    public openWritableAsync(): Promise<QueryOutcome>;
    public useCursor(rows: number, callback: (rows: Result) => unknown): this;
    public callCursor(rows: Result): unknown;
    public iterateCursor(rows?: number): AsyncIterable<Result>;
    public describe(): this;
    public forEach(callback: (row: unknown, result: Result) => void): this;
    public useRawRows(): this;
    public useValueRows(): this;
    public useParsers(parsers: ((column: Column) => ValueParser | null) | ReadonlyMap<number, ValueParser | null> | null): this;
    public handle(): void;
    public execute(): this;
    public then<TResult1 = QueryOutcome, TResult2 = never>(
      onfulfilled?: ((value: QueryOutcome) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
    public catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null): Promise<QueryOutcome | TResult>;
    public finally(onfinally?: (() => void) | null): Promise<QueryOutcome>;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/postgresql-connection.js" {
  import type { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
  import type { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import type { PreparedStatement } from "@noldova/context.data.sql.postgresql/models/prepared-statement.js";
  import type { StartedSession } from "@noldova/context.data.sql.postgresql/models/started-session.js";
  import type { StatementShape } from "@noldova/context.data.sql.postgresql/models/statement-shape.js";
  import type { ConnectionEvents } from "@noldova/context.data.sql.postgresql/services/client/connection-events.js";
  import type { ConnectionLease } from "@noldova/context.data.sql.postgresql/services/client/connection-lease.js";
  import type { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";

  export class PostgreSQLConnection {
    public static readonly slow: number;
    public static readonly notable: number;
    public readonly id: number;
    public readonly host: string;
    public readonly port: number;
    public readonly backend: BackendKey;
    public readonly parameters: Map<string, string>;
    public readonly prepared: Map<string, PreparedStatement>;
    public lease: ConnectionLease | null;
    public fatal: Error | null;
    public uncertain: boolean;
    public releasing: boolean;
    public retiring: boolean;
    public loading: boolean;
    public typing: Query | null;
    public idleTimer: number | null;
    public lifeTimer: number | null;
    public idleSince: number;
    public readonly retired: (() => void)[];
    public constructor(session: StartedSession, options: ClientOptions, events: ConnectionEvents);
    public get status(): string;
    public get inflight(): number;
    public get exclusive(): boolean;
    public get copying(): boolean;
    public get closed(): ConnectionClosedException | null;
    public get closing(): boolean;
    public get notable(): boolean;
    public send(query: Query): void;
    public batch(query: Query, parts: readonly Query[]): void;
    public sendSimple(query: Query, text: string): void;
    public describeAsync(text: string, oids: readonly number[], query: Query | null): Promise<StatementShape>;
    public failLocally(query: Query, error: Error): void;
    public cancelAsync(query: Query): Promise<void>;
    public closeAsync(): Promise<void>;
    public destroy(error?: Error | null): void;
    public go(): void;
    public ref(): void;
    public unref(): void;
    public computeBacklog(time: number): number;
    public isHeavy(): boolean;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/pool-queue.js" {
  export class PoolQueue<T> {
    public get length(): number;
    public push(item: T): void;
    public peek(): T | undefined;
    public shift(): T | undefined;
    public take(): T[];
    public remove(predicate: (item: T) => boolean): boolean;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/statement-cache.js" {
  import type { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
  import type { QueryCost } from "@noldova/context.data.sql.postgresql/models/query-cost.js";
  import type { QueryStatement } from "@noldova/context.data.sql.postgresql/models/query-statement.js";

  export class StatementCache {
    public constructor(scheduler: boolean);
    public readCost(text: string): QueryCost;
    public get(built: BuiltQuery, prepare: boolean): QueryStatement;
    public clear(): void;
    public static isAlone(holder: QueryStatement | QueryCost, text: string): boolean;
    public static isOpening(text: string): boolean;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/client/type-loader-events.js" {
  import { ConnectionEvents } from "@noldova/context.data.sql.postgresql/services/client/connection-events.js";
  import type { BinaryDecoder } from "@noldova/context.data.sql.postgresql/types/binary-decoder.js";
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";
  import type { ValueSerializer } from "@noldova/context.data.sql.postgresql/types/value-serializer.js";

  export class TypeLoaderEvents extends ConnectionEvents {
    public constructor(events: ConnectionEvents);
    public override get typed(): boolean;
    public override get plain(): boolean;
    public override get cancels(): AbortSignal;
    public override findParser(oid: number): ValueParser | null;
    public override findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null;
    public override findBinaryDecoder(oid: number): BinaryDecoder | null;
    public override findSerializer(oid: number): ValueSerializer;
    public override hasUnknownTypes(oids: readonly number[]): boolean;
    public override requestTypes(): void;
    public override onReady(): void;
    public override onClose(): void;
    public override onNotify(channel: string, payload: string, pid: number): void;
    public override onParameter(): void;
    public override onTimed(): void;
    public override onCancelling(cancel: Promise<void>): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/pool-lease.js" {
  import type { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
  import type { UnsafeTransactionException } from "@noldova/context.data.sql.postgresql/exceptions/unsafe-transaction.exception.js";
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import { ConnectionLease } from "@noldova/context.data.sql.postgresql/services/client/connection-lease.js";
  import type { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql/models/client/postgresql-connection.js";
  import type { PostgreSQLPool } from "@noldova/context.data.sql.postgresql/models/client/postgresql-pool.js";
  import type { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";

  export class PoolLease extends ConnectionLease {
    public readonly connection: PostgreSQLConnection;
    public error: Error | null;
    public constructor(pool: PostgreSQLPool, connection: PostgreSQLConnection, kind: LeaseKind);
    public override get kind(): LeaseKind;
    public get options(): ClientOptions;
    public get closed(): Promise<void>;
    public get released(): boolean;
    public handle(query: Query): void;
    public cancelAsync(query: Query): Promise<void>;
    public send(query: Query): void;
    public release(): void;
    public createEndedError(): UnsafeTransactionException;
    public override onClose(error: Error): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/postgresql-pool.js" {
  import type { LeaseKind } from "@noldova/context.data.sql.postgresql/enums/lease-kind.js";
  import type { ConnectionClosedException } from "@noldova/context.data.sql.postgresql/exceptions/connection-closed.exception.js";
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import type { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
  import type { PoolStats } from "@noldova/context.data.sql.postgresql/models/pool-stats.js";
  import { ConnectionEvents } from "@noldova/context.data.sql.postgresql/services/client/connection-events.js";
  import type { PoolLease } from "@noldova/context.data.sql.postgresql/models/client/pool-lease.js";
  import type { PostgreSQLConnection } from "@noldova/context.data.sql.postgresql/models/client/postgresql-connection.js";
  import type { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
  import type { SessionStarter } from "@noldova/context.data.sql.postgresql/services/session-starter.js";
  import type { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";
  import type { BinaryDecoder } from "@noldova/context.data.sql.postgresql/types/binary-decoder.js";
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";
  import type { ValueSerializer } from "@noldova/context.data.sql.postgresql/types/value-serializer.js";

  export class PostgreSQLPool extends ConnectionEvents {
    public readonly parameters: Map<string, string>;
    public constructor(options: ClientOptions, connection: ConnectionOptions, types: TypeRegistry, starter: (options: ConnectionOptions) => SessionStarter);
    public get options(): ClientOptions;
    public get stats(): PoolStats;
    public override get typed(): boolean;
    public override get plain(): boolean;
    public override get cancels(): AbortSignal;
    public override findParser(oid: number): ValueParser | null;
    public override findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null;
    public override findBinaryDecoder(oid: number): BinaryDecoder | null;
    public override findSerializer(oid: number): ValueSerializer;
    public override hasUnknownTypes(oids: readonly number[]): boolean;
    public handle(query: Query): void;
    public query(query: Query, lease: PoolLease | null): void;
    public acquireLeaseAsync(kind: LeaseKind): Promise<PoolLease>;
    public cancelAsync(query: Query): Promise<void>;
    public endAsync(timeout?: number | null): Promise<void>;
    public closeAsync(): Promise<void>;
    public override requestTypes(connection: PostgreSQLConnection | null): void;
    public override onReady(connection: PostgreSQLConnection): void;
    public override onClose(connection: PostgreSQLConnection, error: ConnectionClosedException): void;
    public override onNotify(channel: string, payload: string, pid: number): void;
    public override onParameter(name: string, value: string): void;
    public override onTimed(sample: number, time: number): void;
    public override onCancelling(cancel: Promise<void>): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/types/array.parser.js" {
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";

  export class ArrayParser {
    public static parse(text: string, parse: ValueParser | null, delimiter?: string): unknown[];
  }
}

declare module "@noldova/context.data.sql.postgresql/services/types/array-serializer.js" {
  import type { ValueSerializer } from "@noldova/context.data.sql.postgresql/types/value-serializer.js";

  export class ArraySerializer {
    public static serialize(values: readonly unknown[], serialize: ValueSerializer, delimiter?: string, undefinedValue?: unknown): string;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/types/date.parser.js" {
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";

  export class DateParser {
    public static readonly timestamptz: ValueParser;
    public static readonly date: ValueParser;
    public static readonly timestamp: ValueParser;
    public static parseTimestamptz(text: string): Date | number;
    public static parseDate(text: string): Date | number;
    public static parseTimestamp(text: string): Date | number;
    public static serialize(value: unknown): string;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/types/binary-readers.js" {
  import type { Buffer } from "node:buffer";

  import type { BinaryDecoder } from "@noldova/context.data.sql.postgresql/types/binary-decoder.js";

  export class BinaryReaders {
    public static readonly bytes: BinaryDecoder;
    public static readonly integer: BinaryDecoder;
    public static readonly boolean: BinaryDecoder;
    public static readonly timestamptz: BinaryDecoder;
    public static readonly utcStamp: BinaryDecoder;
    public static readonly arrays: ReadonlyMap<number, BinaryDecoder>;
    public static readClock(data: Buffer, start: number, end: number, zoned: boolean): number;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/type-registry.js" {
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import type { BinaryDecoder } from "@noldova/context.data.sql.postgresql/types/binary-decoder.js";
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";
  import type { ValueSerializer } from "@noldova/context.data.sql.postgresql/types/value-serializer.js";

  export class TypeRegistry {
    public static readonly number: ValueParser;
    public static readonly boolean: ValueParser;
    public static readonly json: ValueParser;
    public static readonly bytea: ValueParser;
    public static readonly string: ValueSerializer;
    public static readonly jsonSerializer: ValueSerializer;
    public static readonly booleanSerializer: ValueSerializer;
    public static readonly dateSerializer: ValueSerializer;
    public static readonly byteaSerializer: ValueSerializer;
    public constructor(options: ClientOptions);
    public get named(): boolean;
    public get plain(): boolean;
    public static infer(value: unknown): number | string;
    public findBinaryDecoder(oid: number): BinaryDecoder | null;
    public hasUnknownTypes(oids: readonly number[]): boolean;
    public isKnown(oid: number): boolean;
    public resolve(type: number | string): number;
    public findDecoder(oid: number, parser: ValueParser | null): BinaryDecoder | null;
    public findParser(oid: number): ValueParser | null;
    public findSerializer(oid: number): ValueSerializer;
    public loadAsync(run: (text: string) => Promise<readonly unknown[]>): Promise<void>;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/protocol/protocol-writer.js" {
  import type { Buffer } from "node:buffer";

  export class ProtocolWriter {
    public constructor(size?: number);
    public get length(): number;
    public take(): Buffer;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/protocol/backend.js" {
  import type { Buffer } from "node:buffer";

  import type { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";
  import type { Notification } from "@noldova/context.data.sql.postgresql/models/notification.js";

  export class Backend {
    public static readError(data: Buffer, start: number, end: number): ReadonlyMap<string, string>;
    public static readRowDescription(data: Buffer, start: number): readonly { readonly name: string; readonly type: number }[];
    public static readColumns<T>(data: Buffer, start: number, make: (name: string, table: number, number: number, type: number) => T): T[];
    public static readColumnTypes(data: Buffer, start: number): number[];
    public static readParameterDescription(data: Buffer, start: number): number[];
    public static readDataRow(data: Buffer, start: number): readonly (string | null)[];
    public static readCommandComplete(data: Buffer, start: number, end: number): { readonly command: string; readonly count: number | null };
    public static readReadyForQuery(data: Buffer, start: number): string;
    public static readParameterStatus(data: Buffer, start: number): readonly [string, string];
    public static readNotification(data: Buffer, start: number): Notification;
    public static readBackendKeyData(data: Buffer, start: number): BackendKey;
    public static readAuthenticationType(data: Buffer, start: number): number;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/protocol/frame.reader.js" {
  import type { Buffer } from "node:buffer";

  export class FrameReader {
    public constructor(onFrame: (type: number, data: Buffer, start: number, end: number) => void, onError: (error: Error) => void, shared?: boolean);
    public get isPaused(): boolean;
    public push(chunk: Buffer): void;
    public isOwning(data: Buffer): boolean;
    public setOwning(owning: boolean): void;
    public pause(): void;
    public resume(): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/protocol/frontend.js" {
  import type { Buffer } from "node:buffer";

  import type { MessageTarget } from "@noldova/context.data.sql.postgresql/enums/message-target.js";
  import type { ProtocolWriter } from "@noldova/context.data.sql.postgresql/services/protocol/protocol-writer.js";

  export class Frontend {
    public static writeSync(writer: ProtocolWriter): ProtocolWriter;
    public static writeFlush(writer: ProtocolWriter): ProtocolWriter;
    public static writeTerminate(writer: ProtocolWriter): ProtocolWriter;
    public static writeCopyDone(writer: ProtocolWriter): ProtocolWriter;
    public createStartup(parameters: ReadonlyMap<string, string>): Buffer;
    public createSslRequest(): Buffer;
    public createPassword(text: string): Buffer;
    public createSasl(mechanism: string, initial: string): Buffer;
    public createSaslResponse(text: string): Buffer;
    public createExtendedQuery(text: string, values: readonly (string | null)[]): Buffer;
    public terminate(): Buffer;
    public sync(): Buffer;
    public flush(): Buffer;
    public copyDone(): Buffer;
    public query(text: string): Buffer;
    public copyData(data: string | Uint8Array): Buffer;
    public copyFail(text: string): Buffer;
    public describe(target: MessageTarget, name: string): Buffer;
    public close(target: MessageTarget, name: string): Buffer;
    public execute(portal: string, rows?: number): Buffer;
    public cancel(pid: number, secret: number): Buffer;
    public parse(name: string, text: string, oids?: readonly number[]): Buffer;
    public bind(
      portal: string, name: string, values?: readonly (string | Uint8Array | null)[], formats?: readonly number[],
      resultFormats?: readonly number[]): Buffer;
    public run(
      portal: string, name: string, values: readonly (string | Uint8Array | null)[], rows: number, flushing: boolean,
      formats: readonly number[] | null): Buffer;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/authenticator.js" {
  import type { Buffer } from "node:buffer";

  import type { Frontend } from "@noldova/context.data.sql.postgresql/services/protocol/frontend.js";

  export class Authenticator {
    public constructor(user: string, password: string, binding: string, certificate: Buffer | null, frontend: Frontend);
    public get isAuthenticated(): boolean;
    public respond(type: number, body: Buffer): Buffer | null;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/binary-columns.js" {
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";

  export class BinaryColumns {
    public readonly columns: readonly Column[];
    public readonly formats: readonly number[];
    public constructor(columns: readonly Column[], formats: readonly number[]);
  }
}

declare module "@noldova/context.data.sql.postgresql/services/certificate-hash.js" {
  import type { Buffer } from "node:buffer";

  export class CertificateHash {
    public static hashEndpoint(certificate: Buffer): Buffer | null;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/postgresql-socket.js" {
  import type { Buffer } from "node:buffer";
  import type { ConnectionOptions as TlsOptions } from "node:tls";

  import { ConnectionSocket } from "@noldova/context.data.sql.postgresql/models/client/connection-socket.js";

  export class PostgreSQLSocket extends ConnectionSocket {
    public static connectAsync(host: string, port: number, signal: AbortSignal): Promise<PostgreSQLSocket>;
    public override get isClosed(): boolean;
    public override get isShared(): boolean;
    public get isSecure(): boolean;
    public override write(data: Buffer): boolean;
    public override end(data: Buffer): void;
    public override destroy(error?: Error | null): void;
    public override pause(): void;
    public override resume(): void;
    public override ref(): void;
    public override unref(): void;
    public keepAlive(seconds: number): void;
    public readPeerCertificate(): Buffer | null;
    public upgradeAsync(options: TlsOptions): Promise<void>;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/client/copy-host.js" {
  import type { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";

  export abstract class CopyHost {
    public abstract writeCopyData(chunk: string | Uint8Array, callback: (error?: Error | null) => void): void;
    public abstract finishCopy(exchange: Exchange, callback: (error?: Error | null) => void): void;
    public abstract failCopy(exchange: Exchange, error: Error | null): void;
    public abstract readCopy(exchange: Exchange): void;
    public abstract abandonCopy(exchange: Exchange): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/copy-both-stream.js" {
  import { Duplex } from "node:stream";

  import type { CopyHost } from "@noldova/context.data.sql.postgresql/services/client/copy-host.js";
  import type { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";

  export class CopyBothStream extends Duplex {
    public count: number | null;
    public command: string | null;
    public constructor(host: CopyHost, exchange: Exchange);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/copy-out-stream.js" {
  import { Readable } from "node:stream";

  import type { CopyHost } from "@noldova/context.data.sql.postgresql/services/client/copy-host.js";
  import type { Exchange } from "@noldova/context.data.sql.postgresql/models/client/exchange.js";

  export class CopyOutStream extends Readable {
    public count: number | null;
    public command: string | null;
    public constructor(host: CopyHost, exchange: Exchange);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/deferred.js" {
  export class Deferred<T> {
    public readonly promise: Promise<T>;
    public constructor();
    public resolve(value: T): void;
    public reject(error: unknown): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/client/row.reader.js" {
  import type { Buffer } from "node:buffer";

  import type { RowMode } from "@noldova/context.data.sql.postgresql/enums/row-mode.js";
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";
  import type { ValueParser } from "@noldova/context.data.sql.postgresql/types/value-parser.js";

  export class RowReader {
    public static readColumns(columns: readonly Column[], parsers: ((column: Column) => ValueParser | null) | ReadonlyMap<number, ValueParser | null>): readonly Column[];
    public static read(data: Buffer, start: number, columns: readonly Column[], mode: RowMode, from: ((value: unknown, column: Column) => unknown) | null): unknown;
  }
}

declare module "@noldova/context.data.sql.postgresql/exceptions/transaction-rolled-back.exception.js" {
  import { DataException } from "@noldova/context.data";

  export class TransactionRolledBackException extends DataException {
    public constructor(message: string);
  }
}

declare module "@noldova/context.data.sql.postgresql/types/host-target.js" {
  export type HostTarget = readonly [string, number | null];
}

declare module "@noldova/context.data.sql.postgresql/types/query-settings.js" {
  export type QuerySettings = {
    readonly simple?: boolean;
    readonly prepare?: boolean;
  };
}

declare module "@noldova/context.data.sql.postgresql/types/transaction-result.js" {
  export type TransactionResult<T> = T extends readonly unknown[] ? { -readonly [K in keyof T]: Awaited<T[K]> } : Awaited<T>;
}

declare module "@noldova/context.data.sql.postgresql/types/transform-settings.js" {
  import type { Column } from "@noldova/context.data.sql.postgresql/models/column.js";

  export type TransformSettings = {
    readonly undefined?: unknown;
    readonly json?: boolean;
    readonly column?: ((name: string) => string) | { readonly from?: (name: string) => string; readonly to?: (name: string) => string };
    readonly value?: ((value: unknown, column: Column) => unknown) | { readonly from?: (value: unknown, column: Column) => unknown; readonly to?: (value: unknown) => unknown };
    readonly row?: ((row: unknown) => unknown) | { readonly from?: (row: unknown) => unknown; readonly to?: (row: unknown) => unknown };
  };
}

declare module "@noldova/context.data.sql.postgresql/types/client-settings.js" {
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import type { TransformSettings } from "@noldova/context.data.sql.postgresql/types/transform-settings.js";

  export type ClientSettings = Partial<Omit<ClientOptions, "transform">> & {
    readonly host?: string | readonly string[];
    readonly port?: number;
    readonly database?: string;
    readonly user?: string;
    readonly password?: string;
    readonly ssl?: boolean | string;
    readonly sslnegotiation?: string;
    readonly channelBinding?: string;
    readonly targetSessionAttrs?: string;
    readonly connectTimeout?: number;
    readonly connection?: ReadonlyMap<string, string>;
    readonly transform?: TransformSettings;
  };
}

declare module "@noldova/context.data.sql.postgresql/models/parsed-url.js" {
  import type { HostTarget } from "@noldova/context.data.sql.postgresql/types/host-target.js";

  export class ParsedUrl {
    public readonly username: string;
    public readonly password: string;
    public readonly pathname: string;
    public readonly searchParams: ReadonlyMap<string, string>;
    public readonly targets: readonly HostTarget[];
    public constructor(username: string, password: string, pathname: string, searchParams: ReadonlyMap<string, string>, targets: readonly HostTarget[]);
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client-configuration.js" {
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import type { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";

  export class ClientConfiguration {
    public readonly options: ClientOptions;
    public readonly connection: ConnectionOptions;
    public constructor(options: ClientOptions, connection: ConnectionOptions);
  }
}

declare module "@noldova/context.data.sql.postgresql/services/client-options.parser.js" {
  import type { ChannelBinding } from "@noldova/context.data.sql.postgresql/enums/channel-binding.js";
  import type { SslMode } from "@noldova/context.data.sql.postgresql/enums/ssl-mode.js";
  import type { ClientConfiguration } from "@noldova/context.data.sql.postgresql/models/client-configuration.js";
  import type { ParsedUrl } from "@noldova/context.data.sql.postgresql/models/parsed-url.js";
  import type { TransformOptions } from "@noldova/context.data.sql.postgresql/models/transform-options.js";
  import type { ClientSettings } from "@noldova/context.data.sql.postgresql/types/client-settings.js";
  import type { HostTarget } from "@noldova/context.data.sql.postgresql/types/host-target.js";
  import type { TransformSettings } from "@noldova/context.data.sql.postgresql/types/transform-settings.js";

  export class ClientOptionsParser {
    public static parse(location: string | null, settings?: ClientSettings): ClientConfiguration;
    public static parseUrl(location: string | null): ParsedUrl;
    public static parseHosts(given: string | readonly string[] | undefined, query: string | undefined, url: ParsedUrl): readonly HostTarget[];
    public static split(text: string, decode?: (text: string) => string): readonly HostTarget[];
    public static validateTargetSession(value: string | null): void;
    public static parseBinding(value: string | null): ChannelBinding;
    public static parseSslMode(ssl: boolean | string): SslMode;
    public static parseTransform(settings: TransformSettings): TransformOptions;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/client-query.js" {
  import type { BuiltQuery } from "@noldova/context.data.sql.postgresql/models/built-query.js";
  import type { QueryOptions } from "@noldova/context.data.sql.postgresql/models/query-options.js";
  import { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
  import type { QueryHandler } from "@noldova/context.data.sql.postgresql/services/client/query-handler.js";
  import type { TypeRegistry } from "@noldova/context.data.sql.postgresql/models/type-registry.js";

  export class ClientQuery extends Query {
    public constructor(source: string, args: readonly unknown[], handler: QueryHandler, options: QueryOptions, types: TypeRegistry);
    public load(source: string): void;
    public override build(): BuiltQuery;
  }
}

declare module "@noldova/context.data.sql.postgresql/services/client/sql-runner.js" {
  import type { TypedParameter } from "@noldova/context.data.sql.postgresql/models/typed-parameter.js";
  import type { ClientQuery } from "@noldova/context.data.sql.postgresql/models/client/client-query.js";
  import type { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
  import type { QueryOutcome } from "@noldova/context.data.sql.postgresql/types/query-outcome.js";
  import type { QuerySettings } from "@noldova/context.data.sql.postgresql/types/query-settings.js";

  export abstract class SqlRunner {
    public static quote(name: string): string;
    public formatIdentifier(...parts: string[]): string;
    public createTypedParameter(value: unknown, type: number | string): TypedParameter;
    public createJsonParameter(value: unknown): TypedParameter;
    public query(text: string, values?: readonly unknown[], settings?: QuerySettings): ClientQuery;
    public runUnsafe(text: string, values?: readonly unknown[], settings?: QuerySettings): ClientQuery;
    public runFile(path: string, values?: readonly unknown[], settings?: QuerySettings): ClientQuery;
    public batch(queries: readonly Query[]): ClientQuery;
    public notifyAsync(channel: string, payload: unknown): Promise<QueryOutcome>;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/reserved-client.js" {
  import { SqlRunner } from "@noldova/context.data.sql.postgresql/services/client/sql-runner.js";

  export class ReservedClient extends SqlRunner implements AsyncDisposable, Disposable {
    public release(): void;
    public [Symbol.dispose](): void;
    public [Symbol.asyncDispose](): Promise<void>;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/transaction-scope.js" {
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import type { Query } from "@noldova/context.data.sql.postgresql/models/client/query.js";
  import { SqlRunner } from "@noldova/context.data.sql.postgresql/services/client/sql-runner.js";
  import type { TransactionResult } from "@noldova/context.data.sql.postgresql/types/transaction-result.js";

  export class TransactionScope extends SqlRunner {
    public get options(): ClientOptions;
    public handle(query: Query): void;
    public cancelAsync(query: Query): Promise<void>;
    public runInSavepointAsync<T>(callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
    public runInSavepointAsync<T>(name: string, callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
    public beginAsync<T>(callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
    public beginAsync<T>(mode: string, callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
    public rollbackAsync(): Promise<void>;
    public prepare(name: string): void;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/listen-subscription.js" {
  import type { BackendKey } from "@noldova/context.data.sql.postgresql/models/backend-key.js";

  export class ListenSubscription {
    public get state(): BackendKey | null;
    public unlistenAsync(): Promise<void>;
  }
}

declare module "@noldova/context.data.sql.postgresql/models/client/postgresql-client.js" {
  import type { ClientOptions } from "@noldova/context.data.sql.postgresql/models/client-options.js";
  import type { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
  import type { PoolStats } from "@noldova/context.data.sql.postgresql/models/pool-stats.js";
  import type { ListenSubscription } from "@noldova/context.data.sql.postgresql/models/client/listen-subscription.js";
  import type { ReservedClient } from "@noldova/context.data.sql.postgresql/models/client/reserved-client.js";
  import { SqlRunner } from "@noldova/context.data.sql.postgresql/services/client/sql-runner.js";
  import type { TransactionScope } from "@noldova/context.data.sql.postgresql/models/client/transaction-scope.js";
  import type { ClientSettings } from "@noldova/context.data.sql.postgresql/types/client-settings.js";
  import type { TransactionResult } from "@noldova/context.data.sql.postgresql/types/transaction-result.js";

  export class PostgreSQLClient extends SqlRunner implements AsyncDisposable {
    public readonly options: ClientOptions;
    public readonly connection: ConnectionOptions;
    public get parameters(): ReadonlyMap<string, string>;
    public get stats(): PoolStats;
    public static create(location?: string | null, settings?: ClientSettings): PostgreSQLClient;
    public reserveAsync(): Promise<ReservedClient>;
    public beginAsync<T>(callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
    public beginAsync<T>(mode: string, callback: (scope: TransactionScope) => T): Promise<TransactionResult<T>>;
    public listenAsync(channel: string, callback: (payload: string) => void, onlisten?: (() => void) | null): Promise<ListenSubscription>;
    public endAsync(timeout?: number | null): Promise<void>;
    public closeAsync(): Promise<void>;
    public [Symbol.asyncDispose](): Promise<void>;
  }
}
