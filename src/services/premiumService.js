import { supabase } from '../supabaseClient';

// Central premium logic: plan pricing & durations
export const PREMIUM_PLANS = {
  weekly: { amount: 1, days: 7 },
  monthly: { amount: 3.14, months: 1 },
  yearly: { amount: 31.4, years: 1 },
};

// Compute expiration date based on plan
export function computePremiumUntil(planKey) {
  const plan = PREMIUM_PLANS[planKey];
  if (!plan) throw new Error('Unknown premium plan');
  const now = new Date();
  const d = new Date(now);
  if (plan.days) d.setDate(d.getDate() + plan.days);
  if (plan.months) d.setMonth(d.getMonth() + plan.months);
  if (plan.years) d.setFullYear(d.getFullYear() + plan.years);
  return d.toISOString();
}

// Check (client-side) if a user object has active premium (not expired)
export function isPremiumActive(user) {
  if (!user?.is_premium) return false;
  if (!user?.premium_until) return false;
  return new Date(user.premium_until) > new Date();
}

// Ensure premium validity: if expired resets row in Supabase & returns updated user row
export async function ensurePremiumFresh(user) {
  if (!user?.id) return user;
  if (isPremiumActive(user)) return user; // still valid or not premium
  // If flagged as premium but expired -> reset
  if (user.is_premium && user.premium_until && new Date(user.premium_until) <= new Date()) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_premium: false, premium_until: null, premium_plan: null })
      .eq('id', user.id)
      .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, premium_plan, created_at')
      .maybeSingle();
    if (!error && data) return data;
  }
  return user;
}

// Perform DB update after confirmed payment
export async function activatePremium({ userId, planKey }) {
  const premium_until = computePremiumUntil(planKey);
  const { data, error } = await supabase
    .from('users')
    .update({ is_premium: true, premium_plan: planKey, premium_until })
    .eq('id', userId)
    .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, premium_plan, created_at')
    .single();
  if (error) throw error;
  return data;
}

// Server authoritative check (fallback) – simple select
export async function fetchUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, pi_user_uid, username, wallet_address, is_premium, premium_until, premium_plan, created_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

