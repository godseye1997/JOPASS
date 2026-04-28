-- Run in Supabase → SQL Editor

-- Add referral columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS referral_signup_rewarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_purchase_rewarded boolean NOT NULL DEFAULT false;

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
  taken int;
BEGIN
  LOOP
    code := 'JO-';
    FOR i IN 1..4 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT COUNT(*) INTO taken FROM public.profiles WHERE referral_code = code;
    EXIT WHEN taken = 0;
  END LOOP;
  RETURN code;
END;
$$;

-- Auto-assign referral code on profile creation
CREATE OR REPLACE FUNCTION auto_referral_code()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_code ON public.profiles;
CREATE TRIGGER trg_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION auto_referral_code();

-- Back-fill existing profiles
UPDATE public.profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- RPC: called after signup when referred by someone
CREATE OR REPLACE FUNCTION claim_referral_signup(p_code text)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_referrer uuid;
BEGIN
  SELECT id INTO v_referrer FROM profiles WHERE referral_code = p_code;
  IF v_referrer IS NULL OR v_referrer = auth.uid() THEN RETURN; END IF;
  IF (SELECT referral_signup_rewarded FROM profiles WHERE id = auth.uid()) THEN RETURN; END IF;
  -- No credit reward on signup — only track who referred whom
  UPDATE profiles SET referred_by = v_referrer, referral_signup_rewarded = true WHERE id = auth.uid();
END;
$$;

-- RPC: called after first credit purchase
CREATE OR REPLACE FUNCTION claim_referral_purchase()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_referrer uuid;
BEGIN
  SELECT referred_by INTO v_referrer FROM profiles WHERE id = auth.uid();
  IF v_referrer IS NULL THEN RETURN; END IF;
  IF (SELECT referral_purchase_rewarded FROM profiles WHERE id = auth.uid()) THEN RETURN; END IF;
  UPDATE profiles SET credits = credits + 2 WHERE id = v_referrer;
  UPDATE profiles SET referral_purchase_rewarded = true WHERE id = auth.uid();
END;
$$;
