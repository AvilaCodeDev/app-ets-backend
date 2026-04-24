import { pgTable, integer, varchar } from 'drizzle-orm/pg-core';

export const carreras = pgTable('carreras', {
    id:     integer('id').primaryKey(),
    nombre: varchar('nombre').notNull(),
    codigo: varchar('codigo').notNull(),
});

export const roles = pgTable('roles', {
    id:        integer('id').primaryKey(),
    nombreRol: varchar('nombre_rol').notNull(),
});

export const users = pgTable('users', {
    id:          integer('id').primaryKey(),
    nombre:      varchar('nombre').notNull(),
    apPaterno:   varchar('ap_paterno').notNull(),
    apMaterno:   varchar('ap_materno').notNull(),
    correo:      varchar('correo').notNull(),
    pass:        varchar('pass').notNull(),
    usuarioRol:  integer('usuario_rol').references(() => roles.id),
});
