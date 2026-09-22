// Calls the `analyze-transcript` edge function (which prompts the LLM) and
// folds the structured fields it returns into the patient being edited.
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExtractedPatientInfo, PatientData } from '@/lib/patient';

// The fields the model fills in, paired with the wording used to tell the
// clinician which ones were auto-filled. Order drives the toast message.
const EXTRACTED_FIELDS: ReadonlyArray<readonly [keyof PatientData, string]> = [
  ['patientName', 'name'],
  ['age', 'age'],
  ['gender', 'gender'],
  ['symptoms', 'symptoms'],
  ['medicalHistory', 'medical history'],
  ['diagnosis', 'diagnosis'],
  ['treatmentPlan', 'treatment plan'],
  ['bloodPressure', 'blood pressure'],
  ['heartRate', 'heart rate'],
  ['temperature', 'temperature'],
  ['respiratoryRate', 'respiratory rate'],
  ['oxygenSaturation', 'oxygen saturation'],
  ['weight', 'weight'],
  ['height', 'height'],
];

// The model writes "N/A" when the transcript does not mention a field, and we
// never let that overwrite something the clinician already typed.
const isUsable = (value?: string): value is string => Boolean(value) && value !== 'N/A';

// Merge extracted fields over the current record, keeping manual entries
// wherever the model had nothing usable to say.
const mergeExtracted = (
  current: PatientData,
  extracted: ExtractedPatientInfo,
  finalTranscript: string,
): PatientData => {
  const merged: PatientData = { ...current };

  merged.transcript = finalTranscript;
  merged.formattedTranscript = extracted.formattedTranscript || '';

  // EXTRACTED_FIELDS only names string-valued fields, which the indexed
  // write below cannot prove to the type checker on its own.
  const writable = merged as unknown as Record<string, string>;
  for (const [field] of EXTRACTED_FIELDS) {
    const newValue = extracted[field];
    if (isUsable(newValue)) {
      writable[field] = newValue;
    }
  }

  return merged;
};

export const useTranscriptAnalysis = () => {
  const { toast } = useToast();

  // Raw invocation, used while recording is paused. Swallows failures and
  // returns null so a mid-session hiccup never interrupts the recording.
  const analyzeTranscript = useCallback(async (transcript: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-transcript', {
        body: { transcript }
      });

      if (error) {
        console.error('Error calling analyze-transcript function:', error);
        throw new Error(error.message || 'Failed to analyze transcript');
      }

      if (data?.success && data?.data) {
        return data.data as ExtractedPatientInfo;
      } else {
        throw new Error('Invalid response from transcript analysis');
      }
    } catch (error) {
      console.error('Error analyzing transcript segment:', error);
      return null;
    }
  }, []);

  // Full-recording analysis: merges the result into `currentPatient` and
  // reports which fields were auto-filled. Returns null if analysis failed,
  // leaving the caller to fall back to a transcript-only record.
  const analyzeRecording = useCallback(async (
    finalTranscript: string,
    currentPatient: PatientData,
  ): Promise<PatientData | null> => {
    try {
      // Show loading message
      toast({
        title: "Analyzing transcript",
        description: "Using AI to extract patient information...",
      });

      const { data, error } = await supabase.functions.invoke('analyze-transcript', {
        body: { transcript: finalTranscript }
      });

      if (error) {
        console.error('Error calling analyze-transcript function:', error);
        throw new Error(error.message || 'Failed to analyze transcript');
      }

      if (!data?.success || !data?.data) {
        throw new Error('Invalid response from transcript analysis');
      }

      const extractedInfo = data.data as ExtractedPatientInfo;
      const updatedPatient = mergeExtracted(currentPatient, extractedInfo, finalTranscript);

      // Show completion message with info about auto-filled fields
      const filledFields = EXTRACTED_FIELDS
        .filter(([field]) => isUsable(extractedInfo[field]))
        .map(([, label]) => label);

      const description = filledFields.length > 0
        ? `AI analysis complete! Auto-filled: ${filledFields.join(', ')}. Please review and edit as needed.`
        : 'AI analysis complete. You can now fill in patient information.';

      toast({
        title: "Recording complete",
        description,
      });

      return updatedPatient;
    } catch (error) {
      console.error('Error analyzing transcript:', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze transcript with AI. Transcript saved for manual entry.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  return { analyzeTranscript, analyzeRecording };
};
