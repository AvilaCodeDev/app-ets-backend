CREATE TABLE "carreras" (
	"id" integer PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	"codigo" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(512) NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" integer PRIMARY KEY NOT NULL,
	"nombre_rol" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" varchar NOT NULL,
	"ap_paterno" varchar NOT NULL,
	"ap_materno" varchar NOT NULL,
	"correo" varchar NOT NULL,
	"pass" varchar NOT NULL,
	"usuario_rol" integer,
	CONSTRAINT "users_correo_unique" UNIQUE("correo")
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_usuario_rol_roles_id_fk" FOREIGN KEY ("usuario_rol") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;