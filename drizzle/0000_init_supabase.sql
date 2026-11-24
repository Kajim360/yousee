CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"evidence_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_interpretations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid,
	"kind" text NOT NULL,
	"output" jsonb NOT NULL,
	"method" text NOT NULL,
	"model" text,
	"prompt_version" text NOT NULL,
	"review_status" text DEFAULT 'pending' NOT NULL,
	"reviewer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"name" text NOT NULL,
	"level" text DEFAULT 'kecamatan' NOT NULL,
	"centroid_lat" double precision NOT NULL,
	"centroid_lng" double precision NOT NULL,
	"geometry_note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ask_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"method" text NOT NULL,
	"model" text,
	"prompt_version" text NOT NULL,
	"evidence_sufficient" boolean NOT NULL,
	"helpful" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"center_lat" double precision NOT NULL,
	"center_lng" double precision NOT NULL,
	"default_zoom" integer DEFAULT 12 NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid NOT NULL,
	"consent_version" text NOT NULL,
	"public_display" boolean NOT NULL,
	"research_use" boolean NOT NULL,
	"demographic_use" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text NOT NULL,
	"cover_key" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"author_name" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contribution_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid NOT NULL,
	"mime_type" text NOT NULL,
	"data_base64" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initiative_id" uuid,
	"user_id" uuid,
	"city_id" uuid NOT NULL,
	"area_id" uuid,
	"kind" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"emotion" text,
	"emotion_note" text,
	"cognitive_type" text,
	"observation" text,
	"geometry_type" text DEFAULT 'none' NOT NULL,
	"geometry" jsonb,
	"location_precision" text DEFAULT 'none' NOT NULL,
	"public_lat" double precision,
	"public_lng" double precision,
	"participation_mode" text DEFAULT 'anonymous' NOT NULL,
	"pseudonym" text,
	"age_range" text,
	"gender_identity" text,
	"privacy_class" text DEFAULT 'public' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_synthetic" boolean DEFAULT false NOT NULL,
	"delete_token_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"publisher" text NOT NULL,
	"url" text NOT NULL,
	"source_type" text NOT NULL,
	"description" text NOT NULL,
	"coverage" text NOT NULL,
	"spatial_resolution" text,
	"license" text NOT NULL,
	"limitations" text NOT NULL,
	"data_quality" text NOT NULL,
	"processing_history" text NOT NULL,
	"collected_at" text,
	"last_checked" text NOT NULL,
	CONSTRAINT "evidence_sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "initiatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "initiatives_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "insight_contributions" (
	"insight_id" uuid NOT NULL,
	"contribution_id" uuid NOT NULL,
	CONSTRAINT "insight_contributions_insight_id_contribution_id_pk" PRIMARY KEY("insight_id","contribution_id")
);
--> statement-breakpoint
CREATE TABLE "insight_sources" (
	"insight_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	CONSTRAINT "insight_sources_insight_id_source_id_pk" PRIMARY KEY("insight_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initiative_id" uuid,
	"area_id" uuid,
	"category" text,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"themes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emotion_distribution" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence" text NOT NULL,
	"uncertainty_note" text NOT NULL,
	"representation_note" text NOT NULL,
	"method" text NOT NULL,
	"model" text,
	"prompt_version" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "knowledge_docs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"title" text NOT NULL,
	"topic" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" uuid,
	"target_type" text DEFAULT 'contribution' NOT NULL,
	"target_id" text,
	"action" text NOT NULL,
	"note" text,
	"actor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"organization" text NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL,
	"geographic_scope" text NOT NULL,
	"last_verified" text NOT NULL,
	"verification_note" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"initiative_id" uuid,
	"area_id" uuid,
	"insight_id" uuid,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"author_pseudonym" text,
	"status" text DEFAULT 'proposed' NOT NULL,
	"status_evidence_url" text,
	"support_count" integer DEFAULT 0 NOT NULL,
	"moderation" text DEFAULT 'pending' NOT NULL,
	"is_synthetic" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"points" integer NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text,
	"awarded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"phone" text,
	"password_hash" text,
	"provider" text DEFAULT 'credentials' NOT NULL,
	"provider_subject" text,
	"role" text DEFAULT 'participant' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_note" text,
	"is_demo_admin" boolean DEFAULT false NOT NULL,
	"public_profile" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "validation_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_id" uuid NOT NULL,
	"reviewer_role" text NOT NULL,
	"reviewer_name" text,
	"verdict" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interpretations" ADD CONSTRAINT "ai_interpretations_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution_media" ADD CONSTRAINT "contribution_media_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_contributions" ADD CONSTRAINT "insight_contributions_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_contributions" ADD CONSTRAINT "insight_contributions_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_sources" ADD CONSTRAINT "insight_sources_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_sources" ADD CONSTRAINT "insight_sources_source_id_evidence_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."evidence_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_docs" ADD CONSTRAINT "knowledge_docs_source_id_evidence_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."evidence_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_records" ADD CONSTRAINT "moderation_records_contribution_id_contributions_id_fk" FOREIGN KEY ("contribution_id") REFERENCES "public"."contributions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validation_records" ADD CONSTRAINT "validation_records_insight_id_insights_id_fk" FOREIGN KEY ("insight_id") REFERENCES "public"."insights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contrib_status_idx" ON "contributions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contrib_area_idx" ON "contributions" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "contrib_category_idx" ON "contributions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "contrib_latlng_idx" ON "contributions" USING btree ("public_lat","public_lng");--> statement-breakpoint
CREATE UNIQUE INDEX "users_provider_subject_idx" ON "users" USING btree ("provider","provider_subject");