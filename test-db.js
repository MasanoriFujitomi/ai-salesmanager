const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:Masatomi%261028@34.84.101.86:5432/ai_sales_manager'
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? 'Error: ' + err.message : 'Success: ' + res.rows[0].now);
  pool.end();
});
