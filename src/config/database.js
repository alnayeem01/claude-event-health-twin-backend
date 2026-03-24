const { Sequelize } = require("sequelize");

const defineOpts = { underscored: true };

function createSequelize() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return new Sequelize(databaseUrl, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
      logging: false,
      define: defineOpts,
    });
  }

  const host = process.env.PGHOST || "localhost";
  const port = parseInt(process.env.PGPORT || "5432", 10);
  const database = process.env.PGDATABASE || "bench_pgvector";
  const username = process.env.PGUSER || "utsavgohel";
  const password = process.env.PGPASSWORD || "";

  return new Sequelize(database, username, password, {
    host,
    port,
    dialect: "postgres",
    logging: false,
    define: defineOpts,
  });
}

const sequelize = createSequelize();

module.exports = { sequelize };
