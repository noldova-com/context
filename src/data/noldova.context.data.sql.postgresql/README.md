# noldova.context.data.sql.postgresql

The PostgreSQL provider of `noldova.context.data.sql`: its dialect, which
spells PostgreSQL's transactions, column types, generated keys, and advisory
locks, its connection, its provider, and `usePostgreSQL`.

## Install

```bash
npm install @noldova/context.data.sql.postgresql
```

## Use

```ts
import { DbContextOptionsBuilder } from "@noldova/context.data";
import "@noldova/context.data.sql.postgresql";

await using context = new NotesContext(new DbContextOptionsBuilder().usePostgreSQL("postgres://notes@localhost:5432/notes"));
await context.database.migrateAsync();
```

The location is the server's connection string, and the data source is
named after its database. Parameters the client doesn't read itself, such as
`search_path`, go to the server when the session starts.

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

## License

MIT; see `LICENSE`.
