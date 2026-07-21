create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;

comment on extension btree_gist is
  'Provides GiST equality support for UUID property IDs in the inventory overlap exclusion constraint.';

create type public.booking_status as enum (
  'draft',
  'held',
  'payment_pending',
  'confirmed',
  'checked_in',
  'completed',
  'cancelled',
  'expired'
);

create type public.payment_status as enum (
  'not_started',
  'order_created',
  'pending',
  'authorized',
  'captured',
  'failed',
  'refund_pending',
  'partially_refunded',
  'refunded'
);

create type public.reservation_type as enum (
  'temporary_hold',
  'confirmed_booking',
  'manual_booking',
  'ota_booking',
  'owner_block',
  'maintenance_block'
);

create type public.reservation_status as enum (
  'active',
  'released',
  'expired',
  'cancelled'
);

create type public.pricing_rule_type as enum (
  'weekday',
  'weekend',
  'special_date'
);

create type public.webhook_processing_status as enum (
  'pending',
  'processed',
  'failed'
);

create type public.notification_status as enum (
  'pending',
  'sent',
  'failed'
);

create type public.admin_role as enum (
  'super_admin',
  'admin',
  'operations'
);
