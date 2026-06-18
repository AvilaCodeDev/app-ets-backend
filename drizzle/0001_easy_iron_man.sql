CREATE TYPE "public"."turno_enum" AS ENUM('MATUTINO', 'VESPERTINO');--> statement-breakpoint
CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "edificios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	"direccion" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ets" (
	"id" serial PRIMARY KEY NOT NULL,
	"materia_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"turno" "turno_enum" NOT NULL,
	"salon_id" integer NOT NULL,
	"profesor_id" integer
);
--> statement-breakpoint
CREATE TABLE "ets_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ets_id" integer NOT NULL,
	"profesor_id" integer NOT NULL,
	"texto" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ets_guides" (
	"id" serial PRIMARY KEY NOT NULL,
	"ets_id" integer NOT NULL,
	"profesor_id" integer NOT NULL,
	"titulo" varchar NOT NULL,
	"file_path" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	"semestre" integer NOT NULL,
	"carrera_id" integer NOT NULL,
	"area_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salones" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	"edificio_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carreras" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "pass" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "carrera_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "area_id" integer;--> statement-breakpoint
ALTER TABLE "ets" ADD CONSTRAINT "ets_materia_id_materias_id_fk" FOREIGN KEY ("materia_id") REFERENCES "public"."materias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ets" ADD CONSTRAINT "ets_salon_id_salones_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ets" ADD CONSTRAINT "ets_profesor_id_users_id_fk" FOREIGN KEY ("profesor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ets_comments" ADD CONSTRAINT "ets_comments_ets_id_ets_id_fk" FOREIGN KEY ("ets_id") REFERENCES "public"."ets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ets_comments" ADD CONSTRAINT "ets_comments_profesor_id_users_id_fk" FOREIGN KEY ("profesor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ets_guides" ADD CONSTRAINT "ets_guides_ets_id_ets_id_fk" FOREIGN KEY ("ets_id") REFERENCES "public"."ets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ets_guides" ADD CONSTRAINT "ets_guides_profesor_id_users_id_fk" FOREIGN KEY ("profesor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materias" ADD CONSTRAINT "materias_carrera_id_carreras_id_fk" FOREIGN KEY ("carrera_id") REFERENCES "public"."carreras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materias" ADD CONSTRAINT "materias_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salones" ADD CONSTRAINT "salones_edificio_id_edificios_id_fk" FOREIGN KEY ("edificio_id") REFERENCES "public"."edificios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_carrera_id_carreras_id_fk" FOREIGN KEY ("carrera_id") REFERENCES "public"."carreras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;