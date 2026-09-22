// Read-only view of a saved patient's record with utilities to
// copy and download the record for documentation.
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Calendar,
  Stethoscope,
  FileText,
  ClipboardList,
  Activity,
  Edit3,
  Download,
  Copy,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PatientData, VITAL_FIELDS } from '@/lib/patient';
import { flagVital } from '@/lib/vitals';
import {
  buildRecordSummary,
  copyToClipboard,
  downloadRecordAsText,
  formatTranscriptWithSpeakers,
} from '@/lib/export';
import { useToast } from '@/hooks/use-toast';

// The narrative sections, each rendered as its own card with an empty-state line.
const NARRATIVE_SECTIONS = [
  { field: 'symptoms', title: 'Symptoms / Chief Complaint', Icon: Stethoscope, empty: 'No symptoms recorded.' },
  { field: 'medicalHistory', title: 'Medical History', Icon: FileText, empty: 'No medical history recorded.' },
  { field: 'diagnosis', title: 'Diagnosis', Icon: Calendar, empty: 'No diagnosis recorded.' },
  { field: 'treatmentPlan', title: 'Treatment Plan / Notes', Icon: ClipboardList, empty: 'No treatment plan recorded.' },
] as const satisfies ReadonlyArray<{ field: keyof PatientData; title: string; Icon: React.ElementType; empty: string }>;

interface PatientViewProps {
  patientData: PatientData;
  onEdit: () => void;
  onDelete: (noteId: string) => void;
  onBack: () => void;
}

export const PatientView: React.FC<PatientViewProps> = ({
  patientData,
  onEdit,
  onDelete,
  onBack,
}) => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card className="medical-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">{patientData.patientName}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>Age: {patientData.age}</span>
                  <span>Gender: {patientData.gender}</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(patientData.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => copyToClipboard(buildRecordSummary(patientData), toast)}
                variant="outline"
                size="sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
              <Button
                onClick={() => downloadRecordAsText(patientData, toast)}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={() => onDelete(patientData.id)}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                onClick={onEdit}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Vital Signs */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VITAL_FIELDS.map(({ field, label }) => {
              const flag = flagVital(field, patientData[field]);
              return (
                <div key={field} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${flag ? 'text-destructive' : ''}`}>
                      {patientData[field] || 'N/A'}
                    </p>
                    {flag && (
                      <Badge
                        variant="destructive"
                        title="Outside typical adult resting range"
                      >
                        {flag === 'high' ? 'High' : 'Low'}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Narrative sections */}
      {NARRATIVE_SECTIONS.map(({ field, title, Icon, empty }) => (
        <Card key={field} className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">
              {patientData[field] || empty}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Original Transcript */}
      {(patientData.transcript || patientData.formattedTranscript) && (
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Original Transcript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <div className="bg-muted/30 p-4 rounded-lg">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                  {patientData.formattedTranscript || formatTranscriptWithSpeakers(patientData.transcript)}
                </pre>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Back to Notes Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={onBack}>
          Back to All Notes
        </Button>
      </div>
    </div>
  );
};
