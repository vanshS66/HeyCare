// Every read and write of the `patients` table lives here. Components get a
// list of records and three actions; they never touch Supabase directly.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PatientData, patientToRow, rowToPatient } from '@/lib/patient';

export const usePatientRecords = () => {
  // Notes loaded from Supabase (persisted patients/records)
  const [savedNotes, setSavedNotes] = useState<PatientData[]>([]);
  const { toast } = useToast();

  // Fetch all patients from the database, newest first, and map DB columns
  // to the UI's PatientData shape for consistent rendering/editing.
  const loadPatients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading patients:', error);
        toast({
          title: "Error loading patients",
          description: "Could not load patient records from database.",
          variant: "destructive",
        });
        return;
      }

      setSavedNotes((data || []).map(rowToPatient));
    } catch (error) {
      console.error('Error loading patients:', error);
      toast({
        title: "Error loading patients",
        description: "Could not load patient records from database.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load patients from Supabase on mount
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Insert or update the patient record, then refresh the list.
  // Returns true when the record was written, so the caller knows whether
  // it is safe to reset the form.
  const savePatient = useCallback(async (patient: PatientData) => {
    if (!patient.patientName.trim()) {
      toast({
        title: "Patient name required",
        description: "Please enter the patient's name before saving.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // An id means we are editing a record that already exists
      if (patient.id) {
        const { error } = await supabase
          .from('patients')
          .update(patientToRow(patient))
          .eq('id', patient.id);

        if (error) throw error;

        toast({
          title: "Patient information updated",
          description: `Updated information for ${patient.patientName}.`,
        });
      } else {
        const { error } = await supabase
          .from('patients')
          .insert(patientToRow(patient));

        if (error) throw error;

        toast({
          title: "Patient information saved",
          description: `Saved information for ${patient.patientName}.`,
        });
      }

      await loadPatients();
      return true;
    } catch (error) {
      console.error('Error saving patient:', error);
      toast({
        title: "Error saving patient",
        description: "Could not save patient information to database.",
        variant: "destructive",
      });
      return false;
    }
  }, [loadPatients, toast]);

  // Permanently delete a note. `onDeleted` runs between the delete and the
  // reload so the caller can leave a view of the record that just vanished
  // without waiting on the round trip.
  const deletePatient = useCallback(async (noteId: string, onDeleted?: () => void) => {
    try {
      const noteToDeleteData = savedNotes.find(note => note.id === noteId);

      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      onDeleted?.();

      await loadPatients();

      toast({
        title: "Note deleted",
        description: `Patient note for ${noteToDeleteData?.patientName || 'patient'} has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error deleting patient",
        description: "Could not delete patient record from database.",
        variant: "destructive",
      });
    }
  }, [loadPatients, savedNotes, toast]);

  return { savedNotes, savePatient, deletePatient };
};
