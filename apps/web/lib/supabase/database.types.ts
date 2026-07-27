export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      content_items: {
        Row: {
          character: string | null
          content_origin: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          current_snapshot_id: string | null
          current_source_fingerprint: string | null
          first_seen_snapshot_id: string | null
          id: string
          identity_key: string
          is_active: boolean
          last_seen_snapshot_id: string | null
          level: Database["public"]["Enums"]["jlpt_level"]
          pattern: string | null
          reading: string | null
          updated_at: string
          word: string | null
        }
        Insert: {
          character?: string | null
          content_origin?: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          current_snapshot_id?: string | null
          current_source_fingerprint?: string | null
          first_seen_snapshot_id?: string | null
          id?: string
          identity_key: string
          is_active?: boolean
          last_seen_snapshot_id?: string | null
          level: Database["public"]["Enums"]["jlpt_level"]
          pattern?: string | null
          reading?: string | null
          updated_at?: string
          word?: string | null
        }
        Update: {
          character?: string | null
          content_origin?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          current_snapshot_id?: string | null
          current_source_fingerprint?: string | null
          first_seen_snapshot_id?: string | null
          id?: string
          identity_key?: string
          is_active?: boolean
          last_seen_snapshot_id?: string | null
          level?: Database["public"]["Enums"]["jlpt_level"]
          pattern?: string | null
          reading?: string | null
          updated_at?: string
          word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_current_snapshot_id_fkey"
            columns: ["current_snapshot_id"]
            isOneToOne: false
            referencedRelation: "source_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_first_seen_snapshot_id_fkey"
            columns: ["first_seen_snapshot_id"]
            isOneToOne: false
            referencedRelation: "source_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_last_seen_snapshot_id_fkey"
            columns: ["last_seen_snapshot_id"]
            isOneToOne: false
            referencedRelation: "source_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          content_item_id: string
          created_at: string
          field_name: string
          id: string
          locale: string
          message: string
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          field_name: string
          id?: string
          locale: string
          message: string
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          field_name?: string
          id?: string
          locale?: string
          message?: string
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      editorial_content_details: {
        Row: {
          content_item_id: string
          created_at: string
          editor_id: string
          examples: Json
          formation: string
          frequency: number | null
          grade: number | null
          kunyomi: string[]
          meanings: string[]
          notes: string
          onyomi: string[]
          reading: string
          strokes: number | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          editor_id: string
          examples?: Json
          formation?: string
          frequency?: number | null
          grade?: number | null
          kunyomi?: string[]
          meanings: string[]
          notes?: string
          onyomi?: string[]
          reading?: string
          strokes?: number | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          editor_id?: string
          examples?: Json
          formation?: string
          frequency?: number | null
          grade?: number | null
          kunyomi?: string[]
          meanings?: string[]
          notes?: string
          onyomi?: string[]
          reading?: string
          strokes?: number | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_content_details_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar: {
        Row: {
          content_item_id: string
          created_at: string
          examples: Json
          formation: string
          id: string
          meaning: string
          notes: string
          pattern: string
          snapshot_id: string
          source_fingerprint: string
          tags: string[]
        }
        Insert: {
          content_item_id: string
          created_at?: string
          examples?: Json
          formation?: string
          id?: string
          meaning: string
          notes?: string
          pattern: string
          snapshot_id: string
          source_fingerprint: string
          tags?: string[]
        }
        Update: {
          content_item_id?: string
          created_at?: string
          examples?: Json
          formation?: string
          id?: string
          meaning?: string
          notes?: string
          pattern?: string
          snapshot_id?: string
          source_fingerprint?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "grammar_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "source_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_translations: {
        Row: {
          content_item_id: string
          created_at: string
          editor_id: string | null
          examples: Json
          formation: string
          id: string
          locale: Database["public"]["Enums"]["translation_locale"]
          meaning: string
          notes: string
          published_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          source_fingerprint: string
          status: Database["public"]["Enums"]["translation_status"]
          submitted_at: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          editor_id?: string | null
          examples?: Json
          formation?: string
          id?: string
          locale: Database["public"]["Enums"]["translation_locale"]
          meaning: string
          notes?: string
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          source_fingerprint: string
          status?: Database["public"]["Enums"]["translation_status"]
          submitted_at?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          editor_id?: string | null
          examples?: Json
          formation?: string
          id?: string
          locale?: Database["public"]["Enums"]["translation_locale"]
          meaning?: string
          notes?: string
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          source_fingerprint?: string
          status?: Database["public"]["Enums"]["translation_status"]
          submitted_at?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_translations_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      kanji: {
        Row: {
          character: string
          content_item_id: string
          created_at: string
          frequency: number | null
          grade: number | null
          id: string
          kunyomi: string[]
          meanings: string[]
          onyomi: string[]
          snapshot_id: string
          source_fingerprint: string
          strokes: number | null
        }
        Insert: {
          character: string
          content_item_id: string
          created_at?: string
          frequency?: number | null
          grade?: number | null
          id?: string
          kunyomi?: string[]
          meanings?: string[]
          onyomi?: string[]
          snapshot_id: string
          source_fingerprint: string
          strokes?: number | null
        }
        Update: {
          character?: string
          content_item_id?: string
          created_at?: string
          frequency?: number | null
          grade?: number | null
          id?: string
          kunyomi?: string[]
          meanings?: string[]
          onyomi?: string[]
          snapshot_id?: string
          source_fingerprint?: string
          strokes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kanji_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanji_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "source_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      kanji_translations: {
        Row: {
          content_item_id: string
          created_at: string
          editor_id: string | null
          id: string
          locale: Database["public"]["Enums"]["translation_locale"]
          meanings: string[]
          published_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          source_fingerprint: string
          status: Database["public"]["Enums"]["translation_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          editor_id?: string | null
          id?: string
          locale: Database["public"]["Enums"]["translation_locale"]
          meanings: string[]
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          source_fingerprint: string
          status?: Database["public"]["Enums"]["translation_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          editor_id?: string | null
          id?: string
          locale?: Database["public"]["Enums"]["translation_locale"]
          meanings?: string[]
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          source_fingerprint?: string
          status?: Database["public"]["Enums"]["translation_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanji_translations_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          attempts_count: number
          content_item_id: string
          correct_count: number
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_rating: Database["public"]["Enums"]["review_rating"] | null
          last_reviewed_at: string | null
          mastered_at: string | null
          next_review_at: string | null
          review_count: number
          status: Database["public"]["Enums"]["learning_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts_count?: number
          content_item_id: string
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_rating?: Database["public"]["Enums"]["review_rating"] | null
          last_reviewed_at?: string | null
          mastered_at?: string | null
          next_review_at?: string | null
          review_count?: number
          status?: Database["public"]["Enums"]["learning_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts_count?: number
          content_item_id?: string
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_rating?: Database["public"]["Enums"]["review_rating"] | null
          last_reviewed_at?: string | null
          mastered_at?: string | null
          next_review_at?: string | null
          review_count?: number
          status?: Database["public"]["Enums"]["learning_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_session_items: {
        Row: {
          client_attempt_id: string
          completed_at: string | null
          content_item_id: string
          created_at: string
          position: number
          progress_applied_at: string | null
          session_id: string
          studied_at: string | null
          user_id: string
        }
        Insert: {
          client_attempt_id?: string
          completed_at?: string | null
          content_item_id: string
          created_at?: string
          position: number
          progress_applied_at?: string | null
          session_id: string
          studied_at?: string | null
          user_id: string
        }
        Update: {
          client_attempt_id?: string
          completed_at?: string | null
          content_item_id?: string
          created_at?: string
          position?: number
          progress_applied_at?: string | null
          session_id?: string
          studied_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_session_items_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_session_items_session_user_fk"
            columns: ["session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          completed_at: string | null
          completed_item_count: number
          content_types: Database["public"]["Enums"]["content_type"][]
          correct_item_count: number
          created_at: string
          id: string
          level: Database["public"]["Enums"]["jlpt_level"]
          session_mode: string
          started_at: string
          target_item_count: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_item_count?: number
          content_types: Database["public"]["Enums"]["content_type"][]
          correct_item_count?: number
          created_at?: string
          id?: string
          level: Database["public"]["Enums"]["jlpt_level"]
          session_mode?: string
          started_at?: string
          target_item_count: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_item_count?: number
          content_types?: Database["public"]["Enums"]["content_type"][]
          correct_item_count?: number
          created_at?: string
          id?: string
          level?: Database["public"]["Enums"]["jlpt_level"]
          session_mode?: string
          started_at?: string
          target_item_count?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          content_locale: string
          created_at: string
          daily_goal: number
          display_name: string | null
          id: string
          interface_locale: string
          onboarding_completed_at: string | null
          target_level: Database["public"]["Enums"]["jlpt_level"]
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          content_locale?: string
          created_at?: string
          daily_goal?: number
          display_name?: string | null
          id: string
          interface_locale?: string
          onboarding_completed_at?: string | null
          target_level?: Database["public"]["Enums"]["jlpt_level"]
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          content_locale?: string
          created_at?: string
          daily_goal?: number
          display_name?: string | null
          id?: string
          interface_locale?: string
          onboarding_completed_at?: string | null
          target_level?: Database["public"]["Enums"]["jlpt_level"]
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answer_text: string | null
          answered_at: string
          client_attempt_id: string
          content_item_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_type: string
          rating: Database["public"]["Enums"]["review_rating"] | null
          response_time_ms: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string
          client_attempt_id: string
          content_item_id: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_type: string
          rating?: Database["public"]["Enums"]["review_rating"] | null
          response_time_ms?: number | null
          session_id: string
          user_id: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string
          client_attempt_id?: string
          content_item_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_type?: string
          rating?: Database["public"]["Enums"]["review_rating"] | null
          response_time_ms?: number | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_session_user_fk"
            columns: ["session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      source_snapshots: {
        Row: {
          activated_at: string | null
          created_at: string
          dataset_checksum: string
          id: string
          imported_at: string
          item_counts: Json
          license: string
          source_commit: string | null
          source_name: string
          source_url: string
          source_version: string
          status: Database["public"]["Enums"]["snapshot_status"]
          validated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          dataset_checksum: string
          id?: string
          imported_at?: string
          item_counts?: Json
          license?: string
          source_commit?: string | null
          source_name?: string
          source_url?: string
          source_version: string
          status?: Database["public"]["Enums"]["snapshot_status"]
          validated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          dataset_checksum?: string
          id?: string
          imported_at?: string
          item_counts?: Json
          license?: string
          source_commit?: string | null
          source_name?: string
          source_url?: string
          source_version?: string
          status?: Database["public"]["Enums"]["snapshot_status"]
          validated_at?: string | null
        }
        Relationships: []
      }
      translation_revisions: {
        Row: {
          changed_by: string | null
          content_item_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          locale: Database["public"]["Enums"]["translation_locale"]
          operation: string
          payload: Json
          status: Database["public"]["Enums"]["translation_status"]
          translation_id: string
        }
        Insert: {
          changed_by?: string | null
          content_item_id: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          locale: Database["public"]["Enums"]["translation_locale"]
          operation: string
          payload: Json
          status: Database["public"]["Enums"]["translation_status"]
          translation_id: string
        }
        Update: {
          changed_by?: string | null
          content_item_id?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          locale?: Database["public"]["Enums"]["translation_locale"]
          operation?: string
          payload?: Json
          status?: Database["public"]["Enums"]["translation_status"]
          translation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_revisions_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vocab: {
        Row: {
          content_item_id: string
          created_at: string
          examples: Json
          id: string
          meanings: string[]
          reading: string
          snapshot_id: string
          source_fingerprint: string
          word: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          examples?: Json
          id?: string
          meanings: string[]
          reading?: string
          snapshot_id: string
          source_fingerprint: string
          word: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          examples?: Json
          id?: string
          meanings?: string[]
          reading?: string
          snapshot_id?: string
          source_fingerprint?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocab_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "source_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_translations: {
        Row: {
          content_item_id: string
          created_at: string
          editor_id: string | null
          examples: Json
          id: string
          locale: Database["public"]["Enums"]["translation_locale"]
          meanings: string[]
          published_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          source_fingerprint: string
          status: Database["public"]["Enums"]["translation_status"]
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          editor_id?: string | null
          examples?: Json
          id?: string
          locale: Database["public"]["Enums"]["translation_locale"]
          meanings: string[]
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          source_fingerprint: string
          status?: Database["public"]["Enums"]["translation_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          editor_id?: string | null
          examples?: Json
          id?: string
          locale?: Database["public"]["Enums"]["translation_locale"]
          meanings?: string[]
          published_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          source_fingerprint?: string
          status?: Database["public"]["Enums"]["translation_status"]
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocab_translations_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_taxonomy: {
        Row: {
          adjective_types: Database["public"]["Enums"]["vocabulary_adjective_type"][]
          classification_source: string
          confidence: number
          content_item_id: string
          created_at: string
          needs_review: boolean
          parts_of_speech: Database["public"]["Enums"]["vocabulary_part_of_speech"][]
          reviewed_at: string | null
          reviewed_by: string | null
          source_reference: string | null
          themes: Database["public"]["Enums"]["vocabulary_theme"][]
          transitivities: Database["public"]["Enums"]["vocabulary_transitivity"][]
          updated_at: string
          verb_groups: Database["public"]["Enums"]["vocabulary_verb_group"][]
        }
        Insert: {
          adjective_types?: Database["public"]["Enums"]["vocabulary_adjective_type"][]
          classification_source?: string
          confidence?: number
          content_item_id: string
          created_at?: string
          needs_review?: boolean
          parts_of_speech?: Database["public"]["Enums"]["vocabulary_part_of_speech"][]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_reference?: string | null
          themes?: Database["public"]["Enums"]["vocabulary_theme"][]
          transitivities?: Database["public"]["Enums"]["vocabulary_transitivity"][]
          updated_at?: string
          verb_groups?: Database["public"]["Enums"]["vocabulary_verb_group"][]
        }
        Update: {
          adjective_types?: Database["public"]["Enums"]["vocabulary_adjective_type"][]
          classification_source?: string
          confidence?: number
          content_item_id?: string
          created_at?: string
          needs_review?: boolean
          parts_of_speech?: Database["public"]["Enums"]["vocabulary_part_of_speech"][]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_reference?: string | null
          themes?: Database["public"]["Enums"]["vocabulary_theme"][]
          transitivities?: Database["public"]["Enums"]["vocabulary_transitivity"][]
          updated_at?: string
          verb_groups?: Database["public"]["Enums"]["vocabulary_verb_group"][]
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_taxonomy_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_learning_review: {
        Args: {
          p_attempts_count: number
          p_correct_count: number
          p_ease_factor: number
          p_interval_days: number
          p_mastered_at: string | null
          p_next_review_at: string
          p_position: number
          p_rating: Database["public"]["Enums"]["review_rating"]
          p_review_count: number
          p_session_id: string
          p_status: Database["public"]["Enums"]["learning_status"]
        }
        Returns: boolean
      }
      assign_user_role_by_email: {
        Args: {
          p_email: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      browse_catalog_items: {
        Args: {
          p_adjective_types: Database["public"]["Enums"]["vocabulary_adjective_type"][]
          p_content_type: Database["public"]["Enums"]["content_type"] | null
          p_level: Database["public"]["Enums"]["jlpt_level"]
          p_limit: number
          p_offset: number
          p_parts_of_speech: Database["public"]["Enums"]["vocabulary_part_of_speech"][]
          p_search: string
          p_themes: Database["public"]["Enums"]["vocabulary_theme"][]
          p_transitivities: Database["public"]["Enums"]["vocabulary_transitivity"][]
          p_verb_groups: Database["public"]["Enums"]["vocabulary_verb_group"][]
        }
        Returns: {
          content_item_id: string
          total_count: number
        }[]
      }
      activate_source_snapshot: {
        Args: { p_snapshot_id: string }
        Returns: Json
      }
      create_source_snapshot: {
        Args: {
          p_dataset_checksum: string
          p_source_commit: string
          p_source_version: string
        }
        Returns: string
      }
      delete_own_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_dashboard_summary: {
        Args: { p_target_level: string }
        Returns: {
          mastered_count: number
          learning_count: number
          new_count: number
          due_count: number
          total_attempts: number
          total_correct: number
          total_items: number
          content_breakdown: Json
        }[]
      }
      get_learning_activity: {
        Args: { p_timezone?: string }
        Returns: {
          activity_date: string
          completed_items: number
          correct_answers: number
          sessions_completed: number
          total_answers: number
        }[]
      }
      get_learning_candidates: {
        Args: {
          p_adjective_types: Database["public"]["Enums"]["vocabulary_adjective_type"][]
          p_content_type: Database["public"]["Enums"]["content_type"]
          p_level: Database["public"]["Enums"]["jlpt_level"]
          p_limit: number
          p_parts_of_speech: Database["public"]["Enums"]["vocabulary_part_of_speech"][]
          p_themes: Database["public"]["Enums"]["vocabulary_theme"][]
          p_transitivities: Database["public"]["Enums"]["vocabulary_transitivity"][]
          p_verb_groups: Database["public"]["Enums"]["vocabulary_verb_group"][]
        }
        Returns: {
          content_item_id: string
        }[]
      }
      remove_user_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      import_source_batch: {
        Args: {
          p_content_type: Database["public"]["Enums"]["content_type"]
          p_items: Json
          p_snapshot_id: string
        }
        Returns: number
      }
      save_editorial_content: {
        Args: {
          p_content_item_id: string | null
          p_content_type: Database["public"]["Enums"]["content_type"]
          p_examples: Json
          p_formation: string
          p_frequency: number | null
          p_grade: number | null
          p_kunyomi: string[]
          p_level: Database["public"]["Enums"]["jlpt_level"]
          p_meanings: string[]
          p_notes: string
          p_onyomi: string[]
          p_reading: string
          p_strokes: number | null
          p_tags: string[]
          p_title: string
        }
        Returns: string
      }
      save_vocabulary_taxonomy: {
        Args: {
          p_adjective_types: Database["public"]["Enums"]["vocabulary_adjective_type"][]
          p_content_item_id: string
          p_parts_of_speech: Database["public"]["Enums"]["vocabulary_part_of_speech"][]
          p_themes: Database["public"]["Enums"]["vocabulary_theme"][]
          p_transitivities: Database["public"]["Enums"]["vocabulary_transitivity"][]
          p_verb_groups: Database["public"]["Enums"]["vocabulary_verb_group"][]
        }
        Returns: boolean
      }
      set_content_active: {
        Args: {
          p_content_item_id: string
          p_is_active: boolean
        }
        Returns: boolean
      }
      search_catalog_items: {
        Args: {
          p_content_type: Database["public"]["Enums"]["content_type"] | null
          p_level: Database["public"]["Enums"]["jlpt_level"]
          p_limit: number
          p_offset: number
          p_search: string
        }
        Returns: {
          content_item_id: string
          total_count: number
        }[]
      }
      source_snapshot_diff: {
        Args: { p_snapshot_id: string }
        Returns: Json
      }
      validate_source_snapshot: {
        Args: { p_snapshot_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "editor" | "reviewer" | "admin" | "superadmin"
      content_type: "vocabulary" | "kanji" | "grammar"
      jlpt_level: "N5" | "N4" | "N3" | "N2" | "N1"
      learning_status: "new" | "learning" | "review" | "mastered"
      report_status: "open" | "triaged" | "resolved" | "rejected"
      review_rating: "forgot" | "hard" | "good" | "easy"
      snapshot_status:
        | "importing"
        | "validated"
        | "active"
        | "archived"
        | "failed"
      translation_locale: "id" | "ko"
      translation_status: "draft" | "reviewed" | "published" | "needs_review"
      vocabulary_adjective_type: "i" | "na"
      vocabulary_part_of_speech: "noun" | "verb" | "adjective" | "other"
      vocabulary_theme:
        | "numbers_units"
        | "self_family"
        | "time_weather"
        | "daily_life"
        | "food_drink"
        | "school_work"
        | "travel_places"
        | "nature_health"
        | "communication_feelings"
      vocabulary_transitivity: "transitive" | "intransitive"
      vocabulary_verb_group: "godan" | "ichidan" | "irregular"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["editor", "reviewer", "admin", "superadmin"],
      content_type: ["vocabulary", "kanji", "grammar"],
      jlpt_level: ["N5", "N4", "N3", "N2", "N1"],
      learning_status: ["new", "learning", "review", "mastered"],
      report_status: ["open", "triaged", "resolved", "rejected"],
      review_rating: ["forgot", "hard", "good", "easy"],
      snapshot_status: [
        "importing",
        "validated",
        "active",
        "archived",
        "failed",
      ],
      translation_locale: ["id", "ko"],
      translation_status: ["draft", "reviewed", "published", "needs_review"],
      vocabulary_adjective_type: ["i", "na"],
      vocabulary_part_of_speech: ["noun", "verb", "adjective", "other"],
      vocabulary_theme: [
        "numbers_units",
        "self_family",
        "time_weather",
        "daily_life",
        "food_drink",
        "school_work",
        "travel_places",
        "nature_health",
        "communication_feelings",
      ],
      vocabulary_transitivity: ["transitive", "intransitive"],
      vocabulary_verb_group: ["godan", "ichidan", "irregular"],
    },
  },
} as const
