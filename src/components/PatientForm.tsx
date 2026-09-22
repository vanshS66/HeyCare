// PatientForm displays and edits structured patient information.
// It is fully controlled by the parent via props and callbacks.
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Calendar, Stethoscope, FileText, ClipboardList, Activity } from 'lucide-react';
import { PatientData, VITAL_FIELDS } from '@/lib/patient';

// The free-text sections below the vitals grid. Each gets a transcript-insert
// button, so they are described once rather than repeated four times.
const NARRATIVE_FIELDS = [
  {
    field: 'symptoms',
    label: 'Symptoms / Chief Complaint',
    Icon: Stethoscope,
    placeholder: "Describe the patient's primary symptoms and chief complaint",
    className: 'min-h-[100px] resize-y',
  },
  {
    field: 'medicalHistory',
    label: 'Medical History',
    Icon: FileText,
    placeholder: 'Previous medical conditions, surgeries, medications, allergies',
    className: 'min-h-[100px] resize-y',
  },
  {
    field: 'diagnosis',
    label: 'Diagnosis',
    Icon: Calendar,
    placeholder: 'Enter diagnosis (can be edited after transcription)',
    className: 'min-h-[80px] resize-y',
  },
  {
    field: 'treatmentPlan',
    label: 'Treatment Plan / Notes',
    Icon: ClipboardList,
    placeholder: 'Treatment recommendations, follow-up instructions, prescriptions',
    className: 'min-h-[120px] resize-y',
  },
] as const satisfies ReadonlyArray<{ field: keyof PatientData; label: string; Icon: React.ElementType; placeholder: string; className: string }>;

interface PatientFormProps {
  patientData: PatientData;
  onPatientDataChange: (data: PatientData) => void;
  onSave: () => void;
  transcript?: string;
}

export const PatientForm: React.FC<PatientFormProps> = ({
  patientData,
  onPatientDataChange,
  onSave,
  transcript = '',
}) => {
  // Helper: update a specific field of the patient in an immutable way
  const handleInputChange = (field: keyof PatientData, value: string) => {
    onPatientDataChange({
      ...patientData,
      [field]: value,
    });
  };

  // Convenience: append the captured transcript text into a field
  const insertTranscriptToField = (field: keyof PatientData) => {
    if (transcript) {
      const currentValue = patientData[field] as string;
      const newValue = currentValue ? `${currentValue}\n\n${transcript}` : transcript;
      handleInputChange(field, newValue);
    }
  };

  return (
    <Card className="medical-card p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Patient Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Name */}
          <div className="space-y-2">
            <Label htmlFor="patientName" className="text-sm font-medium text-foreground">
              Patient Name
            </Label>
            <Input
              id="patientName"
              value={patientData.patientName}
              onChange={(e) => handleInputChange('patientName', e.target.value)}
              placeholder="Enter patient's full name"
              className="w-full"
            />
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium text-foreground">
              Age
            </Label>
            <Input
              id="age"
              type="number"
              value={patientData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="Enter age"
              className="w-full"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-sm font-medium text-foreground">
              Gender
            </Label>
            <Select value={patientData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vitals Section: capture common vital signs in a compact grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Vital Signs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {VITAL_FIELDS.map(({ field, label, placeholder }) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="text-sm font-medium text-foreground">
                  {label}
                </Label>
                <Input
                  id={field}
                  value={patientData[field] as string}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Narrative sections, each with an optional "Insert Transcript" action */}
        {NARRATIVE_FIELDS.map(({ field, label, Icon, placeholder, className }) => (
          <div key={field} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field} className="text-sm font-medium text-foreground flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </Label>
              {transcript && (
                <Button
                  onClick={() => insertTranscriptToField(field)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Insert Transcript
                </Button>
              )}
            </div>
            <Textarea
              id={field}
              value={patientData[field] as string}
              onChange={(e) => handleInputChange(field, e.target.value)}
              placeholder={placeholder}
              className={className}
            />
          </div>
        ))}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={onSave} className="px-8 py-2 success-glow">
            Save Patient Information
          </Button>
        </div>
      </div>
    </Card>
  );
};
