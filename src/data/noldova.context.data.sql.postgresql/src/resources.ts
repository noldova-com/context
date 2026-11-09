/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

export class Resources {
  public static readonly abortEvent: string = "abort";
  public static readonly allowMode: string = "allow";
  public static readonly applicationName: string = "noldova.context";
  public static readonly applicationNameParameter: string = "application_name";
  public static readonly arrayColumn: string = "array";
  public static readonly arrayDelimiter: string = ",";
  public static readonly arrayEnd: string = "}";
  public static readonly arrayStart: string = "{";
  public static readonly authenticationIncomplete: string = "The server was ready before it accepted the authentication.";
  public static readonly baseColumn: string = "base";
  public static readonly beginKeyword: RegExp = /\bbegin\b/i;
  public static readonly beginPrefix: string = "begin ";
  public static readonly beginTransaction: string = "BEGIN";
  public static readonly boxDelimiter: string = ";";
  public static readonly byteaPrefix: string = "\\x";
  public static readonly channelBindingHeader: string = "p=tls-server-end-point,,";
  public static readonly channelBindingOption: string = "channel_binding";
  public static readonly channelBindingParameterName: string = "channelBinding";
  public static readonly channelBindingPasswordRequested: string = "Channel binding is required, but the server asked for a password in clear text or MD5.";
  public static readonly channelBindingUnavailable: string = "Channel binding is required, but the server did not offer it or its certificate could not be hashed.";
  public static readonly channelBindingUnused: string = "Channel binding is required, but the server authenticated without it.";
  public static readonly channelBindingUnusedHeader: string = "y,,";
  public static readonly clientKey: string = "Client Key";
  public static readonly closingBracket: string = "]";
  public static readonly closingParenthesis: string = ")";
  public static readonly codeField: string = "code";
  public static readonly columnNameField: string = "column_name";
  public static readonly commentEnd: string = "*/";
  public static readonly commentStart: string = "/*";
  public static readonly commitCommand: string = "COMMIT";
  public static readonly commitStatement: string = "commit";
  public static readonly connectTimeout: string = "The connection to the PostgreSQL server timed out.";
  public static readonly connectTimeoutOption: string = "connect_timeout";
  public static readonly connectionStringOptions: ReadonlySet<string> = new Set([
    "channel_binding", "connect_timeout", "sslcert", "sslkey", "sslmode", "sslpassword", "sslrootcert"
  ]);
  public static readonly constraintNameField: string = "constraint_name";
  public static readonly copyInProgress: string = "Queries cannot run while a COPY is in progress on the connection.";
  public static readonly copyStreamDestroyed: string = "The COPY stream was destroyed.";
  public static readonly cursorOutlived: string = "The cursor outlived its transaction.";
  public static readonly delimiterColumn: string = "delimiter";
  public static readonly detailField: string = "detail";
  public static readonly directNegotiation: string = "direct";
  public static readonly directSslUnsupported: string = "Direct SSL negotiation is not supported; leave sslnegotiation unset or set it to postgres.";
  public static readonly dollarQuote: string = "$";
  public static readonly domainKind: string = "d";
  public static readonly duplicatePreparedStatementState: string = "42P05";
  public static readonly elementColumn: string = "element";
  public static readonly endingStatement: RegExp = /^\s*(commit|end|abort|rollback(?!\s+to\b)|prepare\s+transaction)\b/i;
  public static readonly escapeStringPrefix: string = "e";
  public static readonly escapedBackslash: string = "\\\\";
  public static readonly escapedQuote: string = "\\\"";
  public static readonly escapedStringQuote: string = "''";
  public static readonly falseLiteral: string = "f";
  public static readonly fatalSeverity: string = "FATAL";
  public static readonly hintField: string = "hint";
  public static readonly hostOption: string = "host";
  public static readonly hostParameterName: string = "host";
  public static readonly identifierPartsMissing: string = "An identifier needs at least one part.";
  public static readonly identifierQuote: string = "\"";
  public static readonly identifierSeparator: string = ".";
  public static readonly identityColumnType: string = "BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY";
  public static readonly inferOption: string = "infer";
  public static readonly infinity: string = "infinity";
  public static readonly integerType: string = "BIGINT";
  public static readonly invalidConnectionString: string = "The data source's location is not a PostgreSQL connection string of the form postgres://user:password@host:port/database.";
  public static readonly invalidStatementNameState: string = "26000";
  public static readonly kindColumn: string = "kind";
  public static readonly lineCommentStart: string = "--";
  public static readonly lineEnd: string = "\n";
  public static readonly listSeparator: string = ", ";
  public static readonly listenPrefix: string = "listen ";
  public static readonly localSeverityField: string = "severity_local";
  public static readonly localhost: string = "localhost";
  public static readonly md5Prefix: string = "md5";
  public static readonly messageField: string = "message";
  public static readonly minusSign: string = "-";
  public static readonly nameColumn: string = "name";
  public static readonly namedTypesNeedFetch: string = "Custom types given by name need fetchTypes to look them up.";
  public static readonly negativeInfinity: string = "-infinity";
  public static readonly nestedTransactionMode: string = "A nested transaction runs in a savepoint, which cannot change the transaction mode.";
  public static readonly nestedTransactionPrepare: string = "A nested transaction cannot be prepared, only the outermost one.";
  public static readonly noChannelBindingHeader: string = "n,,";
  public static readonly nonErrorThrown: string = "A value that is not an error was thrown.";
  public static readonly notifyQuery: string = "select pg_notify($1, $2)";
  public static readonly nullLiteral: string = "NULL";
  public static readonly oidColumn: string = "oid";
  public static readonly operatorCharacters: string = "+-*/<>=~!@#%^&|`?";
  public static readonly parameterKeywords: ReadonlySet<string> = new Set([
    "all", "and", "any", "between", "by", "case", "distinct", "else", "escape", "exists", "having", "ilike", "in", "is", "like", "limit", "not",
    "offset", "on", "or", "returning", "select", "set", "similar", "some", "then", "to", "values", "when", "where"
  ]);
  public static readonly parameterMarker: string = "?";
  public static readonly parameterPrefix: string = "$";
  public static readonly partsParameterName: string = "parts";
  public static readonly passwordSeparator: string = ":";
  public static readonly pathSeparator: string = "/";
  public static readonly placeholderUrl: string = "postgres://x";
  public static readonly portOption: string = "port";
  public static readonly portalPrefix: string = "c";
  public static readonly prepareTransactionPrefix: string = "prepare transaction ";
  public static readonly prototypeKey: string = "__proto__";
  public static readonly queriesParameterName: string = "queries";
  public static readonly queryCanceled: string = "The statement was canceled at the user's request.";
  public static readonly queryCanceledState: string = "57014";
  public static readonly queryWithoutStatement: string = "The query reached the connection before its statement was built.";
  public static readonly questionMarkPrefixes: string = "@?";
  public static readonly refusedQuery: string = "noldova.context: query could not be built";
  public static readonly rollback: string = "rollback";
  public static readonly rollbackToPrefix: string = "rollback to ";
  public static readonly saslMechanismUnsupported: string = "The server offered no supported SASL mechanism.";
  public static readonly saslNonceMismatch: string = "The server nonce does not start with the client nonce.";
  public static readonly saslSignatureMismatch: string = "The server did not return the correct signature.";
  public static readonly saslUnverified: string = "The server ended SCRAM authentication without proving it knows the password.";
  public static readonly savepointNamePrefix: string = "s";
  public static readonly savepointNameSeparator: string = "_";
  public static readonly savepointPrefix: string = "savepoint ";
  public static readonly schemaColumn: string = "schema";
  public static readonly schemaNameField: string = "schema_name";
  public static readonly schemaSeparator: string = ".";
  public static readonly schemeSeparator: string = "://";
  public static readonly scramUser: string = "n=*,r=";
  public static readonly serverError: string = "The server reported an error without a message.";
  public static readonly serverKey: string = "Server Key";
  public static readonly severalHostsUnsupported: string = "Connecting to one of several hosts is not supported; give one host.";
  public static readonly severityField: string = "severity";
  public static readonly shapeSeparator: string = ":";
  public static readonly socketPathUnsupported: string = "Unix-domain socket paths are not supported; give a host name or address.";
  public static readonly space: string = " ";
  public static readonly sslCertOption: string = "sslcert";
  public static readonly sslCertWithoutKey: string = "A client certificate needs its key; give sslkey with sslcert.";
  public static readonly sslFilesUnusable: string = "The certificate files could not be used; check that sslrootcert and sslcert hold PEM certificates and that sslcert matches sslkey.";
  public static readonly sslKeyOption: string = "sslkey";
  public static readonly sslKeyWithoutCertificate: string = "A client key needs its certificate; give sslcert with sslkey.";
  public static readonly sslModeOption: string = "sslmode";
  public static readonly sslNegotiationOption: string = "sslnegotiation";
  public static readonly sslNegotiationParameterName: string = "sslnegotiation";
  public static readonly sslNotSupported: string = "The server does not support SSL connections.";
  public static readonly sslOption: string = "ssl";
  public static readonly sslPasswordOption: string = "sslpassword";
  public static readonly sslRootCertOption: string = "sslrootcert";
  public static readonly startKeyword: RegExp = /\bstart\b/gi;
  public static readonly statementKeySeparator: string = ":";
  public static readonly statementNameSuffix: string = "_";
  public static readonly stringEscape: string = "\\";
  public static readonly stringQuote: string = "'";
  public static readonly systemCertificates: string = "system";
  public static readonly tableNameField: string = "table_name";
  public static readonly targetSessionAttrsOption: string = "target_session_attrs";
  public static readonly targetSessionAttrsParameterName: string = "targetSessionAttrs";
  public static readonly targetSessionAttrsUnsupported: string = "Choosing a server by target_session_attrs is not supported; leave it unset.";
  public static readonly targetSessionAttrsValues: ReadonlySet<string> = new Set(["prefer-standby", "primary", "read-only", "read-write", "standby"]);
  public static readonly textType: string = "TEXT";
  public static readonly tooManyConnectionsState: string = "53300";
  public static readonly tooManyParameters: string = "A query can have at most 65533 parameters.";
  public static readonly transactionAbortedState: string = "25P02";
  public static readonly transactionKeyword: RegExp = /^transaction\b/i;
  public static readonly transactionRolledBack: string = "The query was not sent, because the transaction was rolled back with rollbackAsync.";
  public static readonly transactionRolledBackByServer: string = "The server rolled back the transaction instead of committing it.";
  public static readonly trueLiteral: string = "t";
  public static readonly truncatedCertificate: string = "The server's certificate is truncated.";
  public static readonly typesParameterName: string = "types";
  public static readonly typesQuery: string = "select oid::int, typelem::int as element, typdelim as delimiter, typbasetype::int as base, typtype as kind "
    + "from pg_catalog.pg_type where typtype = 'd' or (typcategory = 'A' and oid >= 16384)";
  public static readonly undefinedValue: string = "Undefined values are not allowed.";
  public static readonly unexpectedMessage: string = "The server sent a message that no waiting query expected.";
  public static readonly unlistenPrefix: string = "unlisten ";
  public static readonly unsafeInteger: string = "The row holds a BIGINT outside the range of safe integers.";
  public static readonly unsafeTransaction: string = "Run transaction statements only in a transaction or on a reserved connection, or set max to 1.";
  public static readonly userInfoSeparator: string = "@";
  public static readonly userMissing: string = "No user was given; give one in the connection string or in the user setting.";
  public static readonly userParameterName: string = "user";
  public static readonly visibleColumn: string = "visible";
  public static readonly whitespace: RegExp = /\s/;

  public static formatAdvisoryLock(resource: string): string {
    return `SELECT pg_advisory_xact_lock(hashtext('${resource}'))`;
  }

  public static formatBatchFailed(index: number): string {
    return `The batch failed at query ${index}.`;
  }

  public static formatBatchItemExecuted(index: number): string {
    return `Item ${index} of the batch has already run.`;
  }

  public static formatBatchItemUnsupported(index: number): string {
    return `Item ${index} of the batch is a cursor, a stream, a forEach or a describe.`;
  }

  public static formatBatchSkipped(index: number): string {
    return `The query was skipped because the batch failed at query ${index}.`;
  }

  public static formatCancelSilent(seconds: number): string {
    return `The server sent nothing within the cancel timeout (${seconds} seconds) while a canceled query waited, so whether it ran is unknown.`;
  }

  public static formatCancelUnanswered(seconds: number): string {
    return `The server did not answer within the cancel timeout (${seconds} seconds) after a query was canceled, so whether it ran is unknown.`;
  }

  public static formatChannelBindingUnsupported(value: string): string {
    return `channel_binding ${value} is not supported.`;
  }

  public static formatConnectionClosed(host: string, port: number): string {
    return `The connection to ${host}:${port} closed.`;
  }

  public static formatConnectionDestroyed(host: string, port: number): string {
    return `The connection to ${host}:${port} was destroyed.`;
  }

  public static formatConnectionEnded(host: string, port: number): string {
    return `The client for ${host}:${port} has ended, so it runs no more queries.`;
  }

  public static formatInvalidMessageLength(length: number): string {
    return `The server sent a message with an invalid length (${length}).`;
  }

  public static formatLeaseEnded(kind: string): string {
    return `The ${kind} has ended.`;
  }

  public static formatMessageNotSupported(name: string): string {
    return `The server sent ${name}, which is not supported.`;
  }

  public static formatNulInParameter(name: string): string {
    return `The connection parameter ${name} contains a NUL character.`;
  }

  public static formatParameterCount(placeholders: number, parameters: number): string {
    return `The statement has ${placeholders} parameter placeholders but ${parameters} parameters.`;
  }

  public static formatQueryTimeout(seconds: number): string {
    return `The query did not finish within the query timeout (${seconds} seconds).`;
  }

  public static formatQuestionMarkOperator(offset: number): string {
    return `The question mark at offset ${offset} is a PostgreSQL operator, not a parameter; call the operator's function instead, such as jsonb_exists.`;
  }

  public static formatQueueTimeout(seconds: number): string {
    return `No connection became free within the queue timeout (${seconds} seconds).`;
  }

  public static formatSslFileUnreadable(option: string, path: string): string {
    return `The ${option} file '${path}' could not be read.`;
  }

  public static formatSslKeyUnreadable(path: string): string {
    return `The private key in the sslkey file '${path}' could not be opened; check that the file holds a PEM private key and that sslpassword opens it.`;
  }

  public static formatTargetSessionAttrsUnsupported(value: string): string {
    return `target_session_attrs ${value} is not supported.`;
  }

  public static formatTypeNameLiteral(name: string): string {
    return `'${name.replaceAll("'", "''")}'`;
  }

  public static formatTypeNamesQuery(list: string): string {
    return "select t.oid::int, t.typarray::int as array, t.typdelim as delimiter, t.typname as name, n.nspname as schema, "
      + "pg_catalog.pg_type_is_visible(t.oid) as visible from pg_catalog.pg_type t "
      + `join pg_catalog.pg_namespace n on n.oid = t.typnamespace where t.typname in (${list})`;
  }

  public static formatTypeNotFound(name: string): string {
    return `The type ${name} does not exist.`;
  }

  public static formatTypesNotFound(names: string): string {
    return `The types ${names} do not exist.`;
  }

  public static formatUnsupportedAuthentication(type: number): string {
    return `The server asked for authentication type ${type}, which is not supported.`;
  }
}
