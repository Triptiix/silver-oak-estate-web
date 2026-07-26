alter type public.payment_status
  add value if not exists 'manually_verified' after 'verified';
