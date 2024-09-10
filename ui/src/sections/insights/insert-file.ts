import { AsyncDuckDB, InsertFileError } from "duckdb-wasm-kit";

/**
 * Insert a remote CSV, Arrow, or Parquet file into DuckDB using its URL.
 * DuckDB will directly read the remote file using the appropriate SQL functions.
 *
 * @param db - The DuckDB instance.
 * @param fileUrl - The URL of the remote file (CSV, Parquet, or Arrow).
 * @param tableName - The name of the table to insert the data into.
 */
/**
 * Insert a remote file (CSV, Parquet) into DuckDB-Wasm using autoloading for HTTPFS.
 * Ensure that the remote file is CORS compliant.
 *
 * @param db - The DuckDB instance.
 * @param fileUrl - The URL of the remote file (e.g., CSV or Parquet).
 * @param tableName - The name of the table to insert the data into.
 */
export const insertRemoteFile = async (
    db: AsyncDuckDB,
    fileUrl: string,
    tableName: string
  ): Promise<void> => {
    try {
      const conn = await db.connect();
  
      // No need to manually install/load HTTPFS. DuckDB will autoload it when the URL is queried.
      await conn.query(`
        CREATE OR REPLACE TABLE ${tableName} AS 
        SELECT * FROM '${fileUrl}';
      `);
  
      await conn.close();
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        throw new Error(
          `Failed to import the file from ${fileUrl}: ${e.message}. Ensure the file is CORS-enabled.`
        );
      } else {
        throw new Error(`Failed to import the file from ${fileUrl}: An unknown error occurred.`);
      }
    }
  };
  