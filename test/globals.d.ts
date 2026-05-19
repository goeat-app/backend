/// <reference types="jest" />

/**
 * Minimal ambient declarations for packages that ship without bundled types.
 */

declare module 'pg' {
  export interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number;
  }

  export class Client {
    constructor(opts: {
      connectionString: string;
      ssl?: boolean | Record<string, unknown>;
    });
    connect(): Promise<void>;
    query(text: string, values?: unknown[]): Promise<QueryResult>;
    end(): Promise<void>;
  }
}
