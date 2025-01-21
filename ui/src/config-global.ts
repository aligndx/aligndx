export const CONFIG = {
    API: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    APDB: process.env.NEXT_PUBLIC_APDB_URL || 'https://github.com/aligndx/apdb',
    APDB_RAW: process.env.NEXT_PUBLIC_APDB_RAW_URL || 'https://raw.githubusercontent.com/aligndx/apdb/main/panels.csv',
    KRAKEN_INDEX: 'https://genome-idx.s3.amazonaws.com/kraken/pluspfp_08gb_20231009/inspect.txt',
};
