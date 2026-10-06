-- Pricing in kwacha, driven by one admin-controlled exchange rate.
--
-- pricing_settings: a single row holding the MWK-per-USD rate we price at, the
-- target markup on wholesale and the hard floor. No anon/authenticated access:
-- only server code (service role, behind the admin check) reads or changes it.
--
-- plan_costs: what eSIM Access charges us per plan, kept out of the public
-- plans table so our wholesale prices are never exposed through the public API.

CREATE TABLE public.pricing_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mwk_per_usd NUMERIC(10, 2) NOT NULL CHECK (mwk_per_usd > 0),
  markup NUMERIC(5, 3) NOT NULL DEFAULT 1.5 CHECK (markup >= 1),
  min_markup NUMERIC(5, 3) NOT NULL DEFAULT 1.3 CHECK (min_markup >= 1),
  mwk_rounding INTEGER NOT NULL DEFAULT 50 CHECK (mwk_rounding BETWEEN 1 AND 1000),
  rate_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  CHECK (markup >= min_markup)
);
REVOKE ALL ON public.pricing_settings FROM anon, authenticated;
GRANT ALL ON public.pricing_settings TO service_role;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Server manages pricing settings"
ON public.pricing_settings FOR ALL TO service_role
USING (true) WITH CHECK (true);

INSERT INTO public.pricing_settings (id, mwk_per_usd, markup, min_markup, mwk_rounding, updated_by)
VALUES (1, 4150, 1.5, 1.3, 50, 'initial setup');

CREATE TABLE public.plan_costs (
  plan_id TEXT PRIMARY KEY REFERENCES public.plans (id) ON DELETE CASCADE,
  wholesale_usd NUMERIC(10, 4) NOT NULL CHECK (wholesale_usd > 0),
  source TEXT NOT NULL DEFAULT 'esim_access',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE ALL ON public.plan_costs FROM anon, authenticated;
GRANT ALL ON public.plan_costs TO service_role;
ALTER TABLE public.plan_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Server manages plan costs"
ON public.plan_costs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Snapshot of prices before each bulk reprice, so any change can be rolled back.
CREATE TABLE public.plan_price_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  reason TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE ALL ON public.plan_price_history FROM anon, authenticated;
GRANT ALL ON public.plan_price_history TO service_role;
ALTER TABLE public.plan_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Server manages plan price history"
ON public.plan_price_history FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Hard rule: a plan's USD price can never sit below min_markup x wholesale.
-- Applied on every write to plans (admin edits, imports, reprices).
CREATE OR REPLACE FUNCTION public.enforce_plan_price_floor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  floor_minor INTEGER;
BEGIN
  SELECT CEIL(c.wholesale_usd * COALESCE(s.min_markup, 1.3) * 100)::INTEGER
    INTO floor_minor
    FROM public.plan_costs c
    LEFT JOIN public.pricing_settings s ON s.id = 1
   WHERE c.plan_id = NEW.id;
  IF floor_minor IS NOT NULL AND NEW.amount_minor < floor_minor THEN
    NEW.amount_minor := floor_minor;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_plan_price_floor() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_plans_price_floor
BEFORE INSERT OR UPDATE OF amount_minor ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_price_floor();

-- Sets every costed plan to markup x wholesale (rounded up to the cent), after
-- saving the old prices. Plans without a known cost are left as they are.
CREATE OR REPLACE FUNCTION public.reprice_plans(_reason TEXT DEFAULT 'reprice')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed INTEGER;
BEGIN
  INSERT INTO public.plan_price_history (plan_id, amount_minor, reason)
  SELECT p.id, p.amount_minor, _reason
    FROM public.plans p
    JOIN public.plan_costs c ON c.plan_id = p.id
    JOIN public.pricing_settings s ON s.id = 1
   WHERE p.amount_minor <> GREATEST(CEIL(c.wholesale_usd * s.markup * 100), CEIL(c.wholesale_usd * s.min_markup * 100))::INTEGER;

  UPDATE public.plans p
     SET amount_minor = GREATEST(CEIL(c.wholesale_usd * s.markup * 100), CEIL(c.wholesale_usd * s.min_markup * 100))::INTEGER
    FROM public.plan_costs c, public.pricing_settings s
   WHERE c.plan_id = p.id
     AND s.id = 1
     AND p.amount_minor <> GREATEST(CEIL(c.wholesale_usd * s.markup * 100), CEIL(c.wholesale_usd * s.min_markup * 100))::INTEGER;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.reprice_plans(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reprice_plans(TEXT) TO service_role;

-- Raises any plan below the floor right away (used after cost updates).
CREATE OR REPLACE FUNCTION public.apply_price_floor(_reason TEXT DEFAULT 'floor')
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed INTEGER;
BEGIN
  INSERT INTO public.plan_price_history (plan_id, amount_minor, reason)
  SELECT p.id, p.amount_minor, _reason
    FROM public.plans p
    JOIN public.plan_costs c ON c.plan_id = p.id
    JOIN public.pricing_settings s ON s.id = 1
   WHERE p.amount_minor < CEIL(c.wholesale_usd * s.min_markup * 100);

  UPDATE public.plans p
     SET amount_minor = CEIL(c.wholesale_usd * s.min_markup * 100)::INTEGER
    FROM public.plan_costs c, public.pricing_settings s
   WHERE c.plan_id = p.id
     AND s.id = 1
     AND p.amount_minor < CEIL(c.wholesale_usd * s.min_markup * 100);
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_price_floor(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_price_floor(TEXT) TO service_role;
