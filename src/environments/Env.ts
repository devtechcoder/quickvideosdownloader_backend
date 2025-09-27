export interface Environment {
  nodeEnv: string;
  dbUrl: string;
}

export function env(): Environment {
  return {
    nodeEnv: process.env.NODE_ENV,
    dbUrl: process.env.DB_URL,
  };
}
