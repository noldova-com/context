/**
 * @license
 * Copyright (c) Noldova.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This file uses Node APIs and will change when we replace Node.

import { Buffer } from "node:buffer";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getCACertificates } from "node:tls";
import { inspect } from "node:util";

import "@noldova/context.core";
import { DataException } from "@noldova/context.data";
import { ArgumentException } from "@noldova/context.exceptions";
import { ChannelBinding } from "@noldova/context.data.sql.postgresql/enums/channel-binding.js";
import { SslMode } from "@noldova/context.data.sql.postgresql/enums/ssl-mode.js";
import { ConnectionOptions } from "@noldova/context.data.sql.postgresql/models/connection-options.js";
import { PostgreSQLSocket } from "@noldova/context.data.sql.postgresql/models/postgresql-socket.js";
import { SessionStarter } from "@noldova/context.data.sql.postgresql/services/session-starter.js";
import { TlsOptionsReader } from "@noldova/context.data.sql.postgresql/services/tls-options.reader.js";
import { Assert, TestClass, TestMethod } from "@noldova/context.testing";

import { FakeServer } from "../fixtures/fake-server.fixture.js";
import { Released } from "../fixtures/released.fixture.js";
import { TestCertificate } from "../fixtures/test-certificate.fixture.js";

@TestClass
export class TlsOptionsReaderTests {
  private static readonly passphrase: string = "violet-lantern-73";

  @TestMethod
  public trustsTheOperatingSystemsRootsWithoutARootFile(): void {
    const file = Buffer.from(TestCertificate.authority("Test Root").certificate);

    Assert.areEqual(getCACertificates("system").join(), TlsOptionsReader.readRoots(undefined).toString());
    Assert.areEqual(file, TlsOptionsReader.readRoots(file));
  }

  @TestMethod
  public async verifyCaTrustsAServerTheRootSignedWhateverItsNameAsync(): Promise<void> {
    const root = TestCertificate.authority("Test Root");
    const server = await TlsOptionsReaderTests.startAsync(root.issue("other.test", TestCertificate.dnsName("other.test")));
    try {
      await TlsOptionsReaderTests.inFolderAsync(new Map([["root.pem", root.certificate]]), async path => {
        await TlsOptionsReaderTests.connectAsync(TlsOptionsReaderTests.options(server, SslMode.VerifyCa, path("root.pem")));
      });

      Assert.isTrue(server.peers[0]?.secure ?? false);
    }
    finally {
      await TlsOptionsReaderTests.closeAsync(server);
    }
  }

  @TestMethod
  public async verifyFullRefusesAnotherNameAndAcceptsTheHostsAsync(): Promise<void> {
    const root = TestCertificate.authority("Test Root");
    const other = await TlsOptionsReaderTests.startAsync(root.issue("other.test", TestCertificate.dnsName("other.test")));
    const named = await TlsOptionsReaderTests.startAsync(root.issue("server", TestCertificate.ipAddress("127.0.0.1")));
    try {
      await TlsOptionsReaderTests.inFolderAsync(new Map([["root.pem", root.certificate]]), async path => {
        const error = await Assert.throwsAsync(
          () => new SessionStarter(TlsOptionsReaderTests.options(other, SslMode.VerifyFull, path("root.pem"))).startAsync(), Error);
        await TlsOptionsReaderTests.connectAsync(TlsOptionsReaderTests.options(named, SslMode.VerifyFull, path("root.pem")));

        Assert.areEqual("ERR_TLS_CERT_ALTNAME_INVALID", "code" in error ? error.code : undefined);
      });

      Assert.isTrue(named.peers[0]?.secure ?? false);
    }
    finally {
      await other.closeAsync();
      await TlsOptionsReaderTests.closeAsync(named);
    }
  }

  @TestMethod
  public async verifyingModesRefuseAServerTheRootDidNotSignAsync(): Promise<void> {
    const root = TestCertificate.authority("Test Root");
    const stranger = TestCertificate.authority("Other Root");
    const server = await TlsOptionsReaderTests.startAsync(stranger.issue("server", TestCertificate.ipAddress("127.0.0.1")));
    try {
      await TlsOptionsReaderTests.inFolderAsync(new Map([["root.pem", root.certificate]]), async path => {
        const ca = await Assert.throwsAsync(
          () => new SessionStarter(TlsOptionsReaderTests.options(server, SslMode.VerifyCa, path("root.pem"))).startAsync(), Error);
        const full = await Assert.throwsAsync(
          () => new SessionStarter(TlsOptionsReaderTests.options(server, SslMode.VerifyFull, path("root.pem"))).startAsync(), Error);

        Assert.areEqual("UNABLE_TO_VERIFY_LEAF_SIGNATURE", "code" in ca ? ca.code : undefined);
        Assert.areEqual("UNABLE_TO_VERIFY_LEAF_SIGNATURE", "code" in full ? full.code : undefined);
      });
    }
    finally {
      await TlsOptionsReaderTests.closeAsync(server);
    }
  }

  @TestMethod
  public async requireEncryptsWithoutARootAsync(): Promise<void> {
    const root = TestCertificate.authority("Test Root");
    const server = await TlsOptionsReaderTests.startAsync(root.issue("other.test", TestCertificate.dnsName("other.test")));
    try {
      await TlsOptionsReaderTests.connectAsync(TlsOptionsReaderTests.options(server, SslMode.Require, null));

      Assert.isTrue(server.peers[0]?.secure ?? false);
    }
    finally {
      await TlsOptionsReaderTests.closeAsync(server);
    }
  }

  @TestMethod
  public async sendsTheClientCertificateOnTheSessionAndTheCancelAsync(): Promise<void> {
    const root = TestCertificate.authority("Test Root");
    const client = root.issue("client");
    const server = await TlsOptionsReaderTests.startAsync(root.issue("server", TestCertificate.ipAddress("127.0.0.1")), root);
    try {
      const files = new Map([["root.pem", root.certificate], ["client.pem", client.certificate], ["client.key", client.key]]);
      await TlsOptionsReaderTests.inFolderAsync(files, async path => {
        const options = TlsOptionsReaderTests.options(server, SslMode.VerifyFull, path("root.pem"), path("client.pem"), path("client.key"));
        const starter = new SessionStarter(options);
        const session = await starter.startAsync();
        await starter.cancelAsync(session.backend, new AbortController().signal);
        session.socket.destroy();
      });

      Assert.areEqual("CN=client", server.peers[0]?.client?.subject);
      Assert.areEqual("CN=client", server.peers[1]?.client?.subject);
      Assert.isTrue(server.peers[1]?.secure ?? false);
      Assert.areEqual("42:43", server.cancels.join(","));
    }
    finally {
      await TlsOptionsReaderTests.closeAsync(server);
    }
  }

  @TestMethod
  public async opensAnEncryptedKeyOnlyWithItsPassphraseAsync(): Promise<void> {
    const root = TestCertificate.authority("Test Root");
    const client = root.issue("client");
    const server = await TlsOptionsReaderTests.startAsync(root.issue("server", TestCertificate.ipAddress("127.0.0.1")), root);
    try {
      const files = new Map([["client.pem", client.certificate], ["client.key", client.encryptedKey(TlsOptionsReaderTests.passphrase)]]);
      await TlsOptionsReaderTests.inFolderAsync(files, async path => {
        const wrong = "amber-kettle-19";
        const options = (password: string): ConnectionOptions => TlsOptionsReaderTests.options(
          server, SslMode.Require, null, path("client.pem"), path("client.key"), password);
        const error = await Assert.throwsAsync(() => new SessionStarter(options(wrong)).startAsync(), DataException);
        await TlsOptionsReaderTests.connectAsync(options(TlsOptionsReaderTests.passphrase));

        Assert.areEqual(
          `The private key in the sslkey file '${path("client.key")}' could not be opened; check that the file holds a PEM private key and that sslpassword opens it.`,
          error.message);
        TlsOptionsReaderTests.assertHides(error, [wrong, TlsOptionsReaderTests.passphrase, TlsOptionsReaderTests.body(client.key)]);
      });

      Assert.areEqual("CN=client", server.peers[1]?.client?.subject);
    }
    finally {
      await TlsOptionsReaderTests.closeAsync(server);
    }
  }

  @TestMethod
  public async failsOnFilesItCannotUseWithoutShowingThemAsync(): Promise<void> {
    const root = TestCertificate.authority("Test Root");
    const client = root.issue("client");
    const server = await TlsOptionsReaderTests.startAsync(root.issue("server", TestCertificate.ipAddress("127.0.0.1")));
    const secret = "PRIVATE-CONTENT-4411";
    try {
      const files = new Map([["client.pem", client.certificate], ["client.key", client.key], ["junk.key", secret], ["junk.pem", secret]]);
      await TlsOptionsReaderTests.inFolderAsync(files, async path => {
        const fail = (options: ConnectionOptions): Promise<DataException> => Assert.throwsAsync(() => new SessionStarter(options).startAsync(), DataException);
        const missing = await fail(TlsOptionsReaderTests.options(server, SslMode.VerifyCa, path("missing.pem")));
        const key = await fail(TlsOptionsReaderTests.options(server, SslMode.Require, null, path("client.pem"), path("junk.key")));
        const certificate = await fail(TlsOptionsReaderTests.options(server, SslMode.Require, null, path("junk.pem"), path("client.key")));

        Assert.areEqual(`The sslrootcert file '${path("missing.pem")}' could not be read.`, missing.message);
        Assert.isTrue(String(missing.cause).includes("ENOENT"));
        Assert.isTrue(key.message.includes(path("junk.key")));
        Assert.areEqual(
          "The certificate files could not be used; check that sslrootcert and sslcert hold PEM certificates and that sslcert matches sslkey.", certificate.message);
        TlsOptionsReaderTests.assertHides(key, [secret, TlsOptionsReaderTests.body(client.key)]);
        TlsOptionsReaderTests.assertHides(certificate, [secret, TlsOptionsReaderTests.body(client.key)]);
      });
    }
    finally {
      await TlsOptionsReaderTests.closeAsync(server);
    }
  }

  @TestMethod
  public refusesACertificateWithoutItsKeyAndAKeyWithoutItsCertificate(): void {
    const create = (certificate: string | null, key: string | null): ConnectionOptions => new ConnectionOptions(
      "127.0.0.1", 5432, "app", "app", "", SslMode.Require, ChannelBinding.Prefer, 0, new Map(), null, certificate, key, null);

    const keyless = Assert.throws(() => create("/client.pem", null), ArgumentException);
    const certificateless = Assert.throws(() => create(null, "/client.key"), ArgumentException);

    Assert.areEqual("sslkey", keyless.parameterName);
    Assert.areEqual("sslcert", certificateless.parameterName);
  }

  private static options(
    server: FakeServer, sslMode: SslMode, root: string | null, certificate: string | null = null, key: string | null = null,
    password: string | null = null): ConnectionOptions {
    return new ConnectionOptions("127.0.0.1", server.port, "app", "app", "", sslMode, ChannelBinding.Prefer, 0, new Map(), root, certificate, key, password);
  }

  private static async startAsync(certificate: TestCertificate, authority: TestCertificate | null = null): Promise<FakeServer> {
    const server = await FakeServer.startAsync(certificate, authority);
    server.ssl = "accept";
    return server;
  }

  private static async connectAsync(options: ConnectionOptions): Promise<void> {
    const session = await new SessionStarter(options).startAsync();
    const secure = session.socket instanceof PostgreSQLSocket && session.socket.isSecure;
    session.socket.destroy();
    Assert.isTrue(secure);
  }

  private static assertHides(error: Error, secrets: readonly string[]): void {
    const shown = [error.message, String(error), inspect(error, { depth: 10 })];
    for (const secret of secrets)
      Assert.isFalse(shown.some(text => text.includes(secret)));
  }

  private static body(pem: string): string {
    return pem.split("\n")[1] ?? pem;
  }

  private static async inFolderAsync(files: ReadonlyMap<string, string>, action: (path: (name: string) => string) => Promise<void>): Promise<void> {
    const folder = await mkdtemp(join(tmpdir(), "noldova-ssl-"));
    try {
      for (const [name, text] of files)
        await writeFile(join(folder, name), text);
      await action(name => join(folder, name));
    }
    finally {
      await rm(folder, { recursive: true, force: true });
    }
  }

  private static async closeAsync(server: FakeServer): Promise<void> {
    await server.closeAsync();
    Assert.isTrue(await Released.socketsAsync());
  }
}
