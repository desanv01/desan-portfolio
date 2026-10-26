-- Run with the authorized server database role after reviewing deployment origin.
-- Store the scoped delivery secret separately in Vault as desan_jobs_secret.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE SCHEMA IF NOT EXISTS desan_private;
REVOKE ALL ON SCHEMA desan_private FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION desan_private.dispatch_due_publications()
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE delivery_secret text; request_id bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.owner_state
    WHERE kind = 'schedule' AND status = 'pending' AND run_at <= now()
  ) THEN RETURN NULL; END IF;
  SELECT decrypted_secret INTO STRICT delivery_secret
  FROM vault.decrypted_secrets WHERE name = 'desan_jobs_secret';
  IF length(delivery_secret) < 32 THEN RAISE EXCEPTION 'Delivery secret unavailable'; END IF;
  SELECT net.http_post(
    url := 'https://desan-portfolio.vercel.app/api/internal/jobs',
    headers := jsonb_build_object('Content-Type','application/json','x-desan-job-secret',delivery_secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  ) INTO request_id;
  RETURN request_id;
END;
$$;
REVOKE ALL ON FUNCTION desan_private.dispatch_due_publications() FROM PUBLIC, anon, authenticated;
-- Activate only after the deployed authenticated endpoint has passed validation:
-- SELECT cron.schedule('desan-publication-delivery','* * * * *',
--   'SELECT desan_private.dispatch_due_publications();');
-- pg_net temporarily stores the scoped job header in its queue. Supabase's
-- platform exposes queued headers to database login roles; Vault does not remove
-- that constraint. Do not put a service-role or database credential in this header.
