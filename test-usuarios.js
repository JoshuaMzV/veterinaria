// Test: Verificar rol de usuarios
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  database: 'mascotico',
  port: 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function verificarUsuarios() {
  try {
    const conn = await pool.getConnection();
    
    // Verificar Ana Gómez
    const [rows] = await conn.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE email = ?',
      ['ana.gomez@example.com']
    );
    
    console.log('\n📋 Usuarios encontrados:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Verificar todos los vendedores
    const [vendedores] = await conn.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE rol = ?',
      ['vendedor']
    );
    
    console.log('\n📋 Todos los vendedores:');
    console.log(JSON.stringify(vendedores, null, 2));
    
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verificarUsuarios();
