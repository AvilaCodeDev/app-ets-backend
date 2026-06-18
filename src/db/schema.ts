import {
    pgTable,
    pgEnum,
    integer,
    varchar,
    serial,
    timestamp,
    date,
    text,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const turnoEnum = pgEnum('turno_enum', ['MATUTINO', 'VESPERTINO']);

// ─── Lookup / reference tables ────────────────────────────────────────────────

export const carreras = pgTable('carreras', {
    id:     serial('id').primaryKey(),
    nombre: varchar('nombre').notNull(),
    codigo: varchar('codigo').notNull(),
});

export const roles = pgTable('roles', {
    id:        integer('id').primaryKey(),
    nombreRol: varchar('nombre_rol').notNull(),
});

export const areas = pgTable('areas', {
    id:     serial('id').primaryKey(),
    nombre: varchar('nombre').notNull(),
});

// ─── Users (extended with carreraId + areaId) ─────────────────────────────────

export const users = pgTable('users', {
    id:         serial('id').primaryKey(),
    nombre:     varchar('nombre').notNull(),
    apPaterno:  varchar('ap_paterno').notNull(),
    apMaterno:  varchar('ap_materno').notNull(),
    correo:     varchar('correo').notNull().unique(),
    pass:       varchar('pass', { length: 255 }).notNull(),
    usuarioRol: integer('usuario_rol').references(() => roles.id),
    carreraId:  integer('carrera_id').references(() => carreras.id),
    areaId:     integer('area_id').references(() => areas.id),
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const refreshTokens = pgTable('refresh_tokens', {
    id:        serial('id').primaryKey(),
    token:     varchar('token', { length: 512 }).notNull().unique(),
    userId:    integer('user_id').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Physical locations ───────────────────────────────────────────────────────

export const edificios = pgTable('edificios', {
    id:        serial('id').primaryKey(),
    nombre:    varchar('nombre').notNull(),
    direccion: varchar('direccion').notNull(),
});

export const salones = pgTable('salones', {
    id:         serial('id').primaryKey(),
    nombre:     varchar('nombre').notNull(),
    edificioId: integer('edificio_id').notNull().references(() => edificios.id),
});

// ─── Academic ─────────────────────────────────────────────────────────────────

export const materias = pgTable('materias', {
    id:        serial('id').primaryKey(),
    nombre:    varchar('nombre').notNull(),
    semestre:  integer('semestre').notNull(),
    carreraId: integer('carrera_id').notNull().references(() => carreras.id),
    areaId:    integer('area_id').notNull().references(() => areas.id),
});

// ─── ETS ──────────────────────────────────────────────────────────────────────

export const ets = pgTable('ets', {
    id:         serial('id').primaryKey(),
    materiaId:  integer('materia_id').notNull().references(() => materias.id),
    fecha:      date('fecha').notNull(),
    turno:      turnoEnum('turno').notNull(),
    salonId:    integer('salon_id').notNull().references(() => salones.id),
    profesorId: integer('profesor_id').references(() => users.id),
});

export const etsComments = pgTable('ets_comments', {
    id:         serial('id').primaryKey(),
    etsId:      integer('ets_id').notNull().references(() => ets.id),
    profesorId: integer('profesor_id').notNull().references(() => users.id),
    texto:      text('texto').notNull(),
    createdAt:  timestamp('created_at').notNull().defaultNow(),
});

export const etsGuides = pgTable('ets_guides', {
    id:         serial('id').primaryKey(),
    etsId:      integer('ets_id').notNull().references(() => ets.id),
    profesorId: integer('profesor_id').notNull().references(() => users.id),
    titulo:     varchar('titulo').notNull(),
    filePath:   varchar('file_path').notNull(),
    createdAt:  timestamp('created_at').notNull().defaultNow(),
});
