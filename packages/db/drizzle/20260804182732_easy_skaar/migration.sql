CREATE TABLE "idiom_char" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"idiom_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"char" text NOT NULL,
	"pinyin" text NOT NULL,
	"initial" text NOT NULL,
	"final" text NOT NULL,
	"tone" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idiom_char_idiom_position_unique" UNIQUE("idiom_id","position")
);
--> statement-breakpoint
CREATE TABLE "idiom_phrase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"char_count" smallint NOT NULL,
	"pinyin" text NOT NULL,
	"tone_pattern" text NOT NULL,
	"meaning" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idiom_phrase_text_unique" UNIQUE("text")
);
--> statement-breakpoint
CREATE INDEX "idiom_char_idiom_id_idx" ON "idiom_char" USING btree ("idiom_id");--> statement-breakpoint
CREATE INDEX "idiom_char_position_final_tone_idx" ON "idiom_char" USING btree ("position","final","tone");--> statement-breakpoint
CREATE INDEX "idiom_char_initial_final_tone_idx" ON "idiom_char" USING btree ("initial","final","tone");--> statement-breakpoint
CREATE INDEX "idiom_phrase_tone_pattern_idx" ON "idiom_phrase" USING btree ("tone_pattern");--> statement-breakpoint
CREATE INDEX "idiom_phrase_char_count_idx" ON "idiom_phrase" USING btree ("char_count");