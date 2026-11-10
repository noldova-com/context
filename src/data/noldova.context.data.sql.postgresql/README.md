# noldova.context.data.sql.postgresql

The PostgreSQL provider of `noldova.context.data.sql`. So far it holds the
dialect, which spells PostgreSQL's transactions, column types, generated
keys, and advisory locks, and the internal PostgreSQL client it will reach
its server through; the connection and the provider follow.

## Install

```bash
npm install @noldova/context.data.sql.postgresql
```

## Use

```ts
import { PostgreSQLDialect } from "@noldova/context.data.sql.postgresql";

const dialect = new PostgreSQLDialect();
```

The declaration file `api/index.d.ts` documents every member with its
contract.

## SSL

The connection string's `sslmode` takes these modes:

- `disable`: no encryption.
- `prefer`: encrypts when the server supports it, without verifying the
  server.
- `require`: encrypts, and fails when the server can't; it doesn't verify the
  server's certificate.
- `verify-ca`: encrypts and verifies that the trusted roots signed the
  server's certificate, but not the host name it names.
- `verify-full`: encrypts and verifies the certificate's chain and that it
  names the host.

The certificate options name files, in PEM:

- `sslrootcert`: the root certificates to trust for the server, instead of
  the system's; `sslrootcert=system` keeps the system's roots and selects
  `verify-full`.
- `sslcert` and `sslkey`: the client certificate and its private key, given
  together.
- `sslpassword`: the passphrase of an encrypted `sslkey`.

The files are read at each connection, including the one that cancels a
query. An error names the option and the file, never the key, its contents
or the passphrase.

Not supported yet: the `PG*` environment variables, the password file, the
operating system's user name as the default user, several hosts and
`target_session_attrs`, Unix-domain sockets, and direct SSL negotiation.

## Source

The client is a port of postgres.js (https://github.com/porsager/postgres)
at its `v4.1.0` tag, commit `d84da749342240a4c1fb44e4f9a6b22d2350fb7b`,
under the Unlicense; `THIRD-PARTY-NOTICES.txt` keeps its text. What changed
from it:

- `index.js` became `PostgreSQLClient`, with `ClientOptionsParser` for its
  options; `pool.js` became `PostgreSQLPool` and its leases;
  `connection.js`, `startup.js` and `socket.js` became the connection, the
  session starter, the authenticator and the socket; `protocol.js` became
  `services/protocol/`; `query.js` became `Query` and `ClientQuery`;
  `types.js` became `services/types/` and `TypeRegistry`; `errors.js`
  became the exceptions in `exceptions/`, each a `DataException`; and
  `result.js` became `Result`.
- Queries take text and values, `query`, `runUnsafe` and `runFile`, in place
  of tagged templates, and builder methods such as `useCursor` and
  `useValueRows` in place of the query's own options.
- The TLS options are the connection string's `sslmode` and certificate
  files, as above, in place of a Node `tls` options object.
- `build.js`, `subscribe.js`, `large.js`, `cf.js` and `diagnostics.js` are
  left out, and so are the environment variables and the password file.
- The provider's own parts are new: the connection-string parser, the `?`
  rewriter and the value converter.

## License

MIT; see `LICENSE`.
