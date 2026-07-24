alter type public.payment_status add value if not exists 'checkout_started' after 'order_created';
alter type public.payment_status add value if not exists 'verified' after 'captured';
alter type public.payment_status add value if not exists 'expired' after 'failed';
alter type public.payment_status add value if not exists 'reconciliation_required' after 'refund_pending';

