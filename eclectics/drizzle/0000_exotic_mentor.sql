CREATE TABLE "choreographies" (
	"id" serial PRIMARY KEY NOT NULL,
	"choreographer_user_id" integer NOT NULL,
	"cut" varchar(512),
	"cleaning_videos" varchar(512),
	"cleaning_notes" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "choreographies" ADD CONSTRAINT "choreographies_choreographer_user_id_users_id_fk" FOREIGN KEY ("choreographer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;