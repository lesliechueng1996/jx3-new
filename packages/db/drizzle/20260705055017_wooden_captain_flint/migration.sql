ALTER TABLE "raid_loot" ADD COLUMN "winner_character_name" text;--> statement-breakpoint
ALTER TABLE "raid_loot" ADD COLUMN "winner_server_name" text;--> statement-breakpoint
UPDATE "raid_loot" AS rl
SET
  "winner_character_name" = rs."character_name",
  "winner_server_name" = gs."name"
FROM "raid_signup" AS rs
LEFT JOIN "game_server" AS gs ON rs."server_id" = gs."id"
WHERE rl."winner_signup_id" = rs."id"
  AND rl."winner_character_name" IS NULL;