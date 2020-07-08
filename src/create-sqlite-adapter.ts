import sqlite from "sqlite";
import createAdapter, { IAdapter } from "./create-adapter";

type Options = {
  fileName?: string;
  tableName?: string;
};
type Connection = {
  config: {
    fileName: string;
    tableName: string;
  };
  close: () => Promise<void>;
  exec: (sql: string) => Promise<any>;
  all: (sql: string) => Promise<Array<any>>;
};

export function escapeId(str: string): string {
  return `"${String(str).replace(/(["])/gi, "$1$1")}"`;
}

export async function connect(options: Options): Promise<Connection> {
  const config = {
    fileName: options?.fileName ?? ":memory:",
    tableName: options?.tableName ?? "values",
  };
  const database = await sqlite.open(config.fileName);
  return {
    config,
    exec: database.exec.bind(database),
    all: database.all.bind(database),
    close: database.close.bind(database),
  };
}

export async function init(connection: Connection) {
  await connection.exec(
    `CREATE TABLE IF NOT EXISTS ${escapeId(connection.config.tableName)}(
      ${escapeId("value")} BIGINT NOT NULL
    );
    INSERT INTO ${escapeId(connection.config.tableName)}(
      ${escapeId("value")}
    ) VALUES(0);`
  );
}

export async function get(connection: Connection) {
  const [{ value }] = await connection.all(
    `SELECT ${escapeId("value")} 
    FROM ${escapeId(connection.config.tableName)}
    LIMIT 0, 1`
  );
  return value;
}

export async function set(connection: Connection, value: number) {
  await connection.exec(
    `UPDATE ${escapeId(connection.config.tableName)}
    SET ${escapeId("value")} = ${escapeId("value")} + 1;`
  );
}

export async function dispose(connection: Connection) {
  await connection.close();
}

export function createSQLiteAdapter(options: Options): IAdapter {
  return createAdapter(
    {
      connect,
      init,
      get,
      set,
      dispose,
    },
    options
  );
}

export default createSQLiteAdapter;
