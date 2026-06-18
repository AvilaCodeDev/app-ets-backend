import { db } from './index.ts';
import { roles, users } from './schema.ts';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

await db.execute(sql`
    INSERT INTO roles (id, nombre_rol)
    VALUES (1, 'admin'), (2, 'teacher')
    ON CONFLICT DO NOTHING
`);

console.log('Roles seeded.');

const hash = await bcrypt.hash('password123', 10);

await db.insert(users).values({
    nombre: 'Jose Antonio',
    apPaterno: 'Ortiz',
    apMaterno: 'Ramirez',
    correo: 'jose.ortiz@escom.ipn.mx',
    pass: hash,
    usuarioRol: 1,
}).onConflictDoNothing();

console.log('User Jose Antonio Ortiz Ramirez seeded (correo: jose.ortiz@escom.ipn.mx, pass: password123)');
