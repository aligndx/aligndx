import { AsyncDuckDB, exportCsv } from "duckdb-wasm-kit";
import { toast } from "sonner";

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
        CREATE OR REPLACE TABLE '${tableName}' AS 
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


/**
 * Export a table to a CSVfile.
 *
 * @param db - The DuckDB instance.
 * @param tableName - The name of the table to export data from.
 */
export const handleExport = async (
    db: AsyncDuckDB,
    tableName: string,
) => {
    try {
        // Call exportCsv to get the File object
        const file = await exportCsv(db, tableName);

        // Explicitly cast the file as a browser Blob
        const browserBlob = file as unknown as Blob;

        // Create a URL for the Blob object using the browser's URL API
        const url = window.URL.createObjectURL(browserBlob);

        // Create an anchor element and trigger a download
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name || "export.csv"; // Ensure a valid filename is provided
        document.body.appendChild(link);
        link.click();

        // Clean up the DOM and revoke the object URL
        document.body.removeChild(link);
        
        // Ensure the URL is not null or undefined before revoking it
        if (url) {
            window.URL.revokeObjectURL(url);
        }
    } catch (err) {
        console.error("Error exporting data:", err);
        toast.error("Couldn't export the data");
    }
};
