import { supabase } from '../lib/supabaseClient';
import { LoanRecord, DBLoan } from '../types';

/**
 * Lädt alle Loans einer Organisation
 */
export async function fetchLoans(organizationId: string): Promise<LoanRecord[]> {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      *,
      profiles!loans_user_id_fkey(full_name)
    `)
    .eq('organization_id', organizationId)
    .order('timestamp_out', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Loans:', error);
    throw error;
  }

  if (!data) return [];

  return data.map((loan: any) => ({
    id: loan.id,
    assetId: loan.asset_id,
    userId: loan.user_id,
    userName: loan.profiles?.full_name || 'Unbekannt',
    timestampOut: loan.timestamp_out,
    timestampIn: loan.timestamp_in || undefined,
  }));
}

/**
 * Lädt Loans für ein spezifisches Asset
 */
export async function fetchLoansForAsset(assetId: string): Promise<LoanRecord[]> {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      *,
      profiles!loans_user_id_fkey(full_name)
    `)
    .eq('asset_id', assetId)
    .order('timestamp_out', { ascending: false });

  if (error) {
    console.error('Fehler beim Laden der Loans:', error);
    throw error;
  }

  if (!data) return [];

  return data.map((loan: any) => ({
    id: loan.id,
    assetId: loan.asset_id,
    userId: loan.user_id,
    userName: loan.profiles?.full_name || 'Unbekannt',
    timestampOut: loan.timestamp_out,
    timestampIn: loan.timestamp_in || undefined,
  }));
}

/**
 * Erstellt einen neuen Loan (Ausleihe)
 */
export async function createLoan(
  organizationId: string,
  assetId: string,
  userId: string,
  notes?: string
): Promise<LoanRecord> {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      organization_id: organizationId,
      asset_id: assetId,
      user_id: userId,
      timestamp_out: new Date().toISOString(),
      timestamp_in: null,
      notes: notes || null,
    })
    .select(`
      *,
      profiles!loans_user_id_fkey(full_name)
    `)
    .single();

  if (error || !data) {
    console.error('Fehler beim Erstellen des Loans:', error);
    throw error || new Error('Loan konnte nicht erstellt werden');
  }

  return {
    id: data.id,
    assetId: data.asset_id,
    userId: data.user_id,
    userName: (data.profiles as any)?.full_name || 'Unbekannt',
    timestampOut: data.timestamp_out,
    timestampIn: data.timestamp_in || undefined,
  };
}

/**
 * Aktualisiert einen Loan (Rückgabe)
 */
export async function returnLoan(loanId: string): Promise<LoanRecord> {
  const { data, error } = await supabase
    .from('loans')
    .update({
      timestamp_in: new Date().toISOString(),
    })
    .eq('id', loanId)
    .select(`
      *,
      profiles!loans_user_id_fkey(full_name)
    `)
    .single();

  if (error || !data) {
    console.error('Fehler beim Aktualisieren des Loans:', error);
    throw error || new Error('Loan konnte nicht aktualisiert werden');
  }

  return {
    id: data.id,
    assetId: data.asset_id,
    userId: data.user_id,
    userName: (data.profiles as any)?.full_name || 'Unbekannt',
    timestampOut: data.timestamp_out,
    timestampIn: data.timestamp_in || undefined,
  };
}

/**
 * Findet den aktiven Loan für ein Asset (noch nicht zurückgegeben)
 */
export async function findActiveLoan(assetId: string): Promise<LoanRecord | null> {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      *,
      profiles!loans_user_id_fkey(full_name)
    `)
    .eq('asset_id', assetId)
    .is('timestamp_in', null)
    .order('timestamp_out', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    assetId: data.asset_id,
    userId: data.user_id,
    userName: (data.profiles as any)?.full_name || 'Unbekannt',
    timestampOut: data.timestamp_out,
    timestampIn: data.timestamp_in || undefined,
  };
}
