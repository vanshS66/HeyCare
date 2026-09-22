// Main page. Owns the tab/dialog/form state and wires the recorder, the AI
// analysis hook, and the patient-record hook together. All Supabase access and
// transcript logic live in those hooks.
import { useState } from 'react';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { PatientForm } from '@/components/PatientForm';
import { PatientView } from '@/components/PatientView';
import { NotesManager } from '@/components/NotesManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Stethoscope, FileText, Mic, User } from 'lucide-react';
import { PatientData, createEmptyPatient } from '@/lib/patient';
import { usePatientRecords } from '@/hooks/usePatientRecords';
import { useTranscriptAnalysis } from '@/hooks/useTranscriptAnalysis';
import heycareLogoImage from '@/assets/heycare-logo.avif';

const TAB_TRIGGER_CLASS = "tab-enhanced flex items-center gap-3 py-3 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg";

const Index = () => {
  // Live transcript from the recorder (includes interim + final text)
  const [currentTranscript, setCurrentTranscript] = useState('');
  // Current patient model being edited or created
  const [currentPatient, setCurrentPatient] = useState<PatientData>(createEmptyPatient);
  const [activeTab, setActiveTab] = useState('record');
  // When viewing a saved note, this holds the selected patient
  const [viewingNote, setViewingNote] = useState<PatientData | null>(null);
  // Dialog state for starting a new recording when unsaved data exists
  const [showNewRecordingDialog, setShowNewRecordingDialog] = useState(false);
  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const { savedNotes, savePatient, deletePatient } = usePatientRecords();
  const { analyzeTranscript, analyzeRecording } = useTranscriptAnalysis();

  // Keep the live transcript in state so it can be inserted into fields
  const handleTranscriptUpdate = (transcript: string) => {
    setCurrentTranscript(transcript);
  };

  // Finalize a recording session: analyze the full transcript and merge
  // extracted fields into the current patient, preserving any manual entries.
  const handleRecordingComplete = async (finalTranscript: string) => {
    setCurrentTranscript(finalTranscript);

    if (finalTranscript.trim()) {
      const analyzed = await analyzeRecording(finalTranscript, currentPatient);

      if (analyzed) {
        setCurrentPatient(analyzed);
      } else {
        // Fallback: just save the transcript
        setCurrentPatient(prev => ({ ...prev, transcript: finalTranscript }));
      }

      setActiveTab('patient');
    }
  };

  // Persist the current form, then clear it for the next entry
  const handleSavePatient = async () => {
    if (await savePatient(currentPatient)) {
      setCurrentPatient(createEmptyPatient());
      setCurrentTranscript('');
      setActiveTab('notes');
    }
  };

  // Open a saved note in the read-only patient view tab
  const handleViewNote = (note: PatientData) => {
    setViewingNote(note);
    setActiveTab('view');
  };

  // From the read-only view, jump into edit mode for the same record
  const handleEditFromView = () => {
    if (viewingNote) {
      setCurrentPatient(viewingNote);
      setCurrentTranscript(viewingNote.transcript);
      setActiveTab('patient');
    }
  };

  // Return to the list of saved notes from the read-only view
  const handleBackToNotes = () => {
    setViewingNote(null);
    setActiveTab('notes');
  };

  // Open a confirmation dialog for deleting a note
  const handleDeleteNote = (noteId: string) => {
    setNoteToDelete(noteId);
    setShowDeleteDialog(true);
  };

  // Permanently delete the selected note (after confirm)
  const confirmDeleteNote = async () => {
    if (noteToDelete) {
      await deletePatient(noteToDelete, () => {
        // If we're currently viewing the note being deleted, go back to notes
        if (viewingNote && viewingNote.id === noteToDelete) {
          setViewingNote(null);
          setActiveTab('notes');
        }
      });
    }
    setNoteToDelete(null);
    setShowDeleteDialog(false);
  };

  // Reset the form and go to the recorder tab
  const handleNewRecording = () => {
    setCurrentPatient(createEmptyPatient());
    setCurrentTranscript('');
    setActiveTab('record');
    setShowNewRecordingDialog(false);
  };

  // Prompt to save if unsaved data exists before starting a new recording
  const handleNewRecordingClick = () => {
    const hasUnsavedData = currentPatient.patientName.trim() ||
                          currentPatient.symptoms.trim() ||
                          currentPatient.diagnosis.trim() ||
                          currentPatient.treatmentPlan.trim() ||
                          currentTranscript.trim();

    if (hasUnsavedData) {
      setShowNewRecordingDialog(true);
    } else {
      handleNewRecording();
    }
  };

  // Convenience action: save (if name present) then reset for a fresh recording.
  // The save is deliberately not awaited — it works from the record it captured,
  // and its trailing tab switch lands after the reset below.
  const handleSaveAndNewRecording = () => {
    if (currentPatient.patientName.trim()) {
      handleSavePatient();
    }
    handleNewRecording();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Professional Header */}
      <header className="professional-header sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <img
                    src={heycareLogoImage}
                    alt="HeyCare Logo"
                    className="h-12 w-auto"
                  />
                  <div className="ml-3">
                    <p className="text-muted-foreground text-sm font-medium">AI-Powered Medical Documentation</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end text-sm">
                <p className="text-foreground font-medium">Quick Actions</p>
                <p className="text-muted-foreground">Start recording anytime</p>
              </div>
              <Button
                onClick={handleNewRecordingClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3"
                size="lg"
              >
                <Mic className="w-5 h-5 mr-2" />
                New Recording
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* New Recording Confirmation Dialog */}
      <AlertDialog open={showNewRecordingDialog} onOpenChange={setShowNewRecordingDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Save Current Patient Information?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved patient information. Would you like to save it before starting a new recording?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNewRecordingDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleNewRecording}>
              Don't Save
            </Button>
            <AlertDialogAction onClick={handleSaveAndNewRecording} className="bg-primary hover:bg-primary/90">
              Save & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <FileText className="w-5 h-5" />
              Delete Patient Note?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this patient note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNote}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content: Tabs for recorder, patient form, notes, and read-only view */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full mb-8 h-14 p-1 bg-card/60 backdrop-blur-sm border border-border/50 ${activeTab === 'view' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="record" className={TAB_TRIGGER_CLASS}>
              <Mic className="w-4 h-4" />
              <span className="font-medium">Record</span>
            </TabsTrigger>
            <TabsTrigger value="patient" className={TAB_TRIGGER_CLASS}>
              <Stethoscope className="w-4 h-4" />
              <span className="font-medium">Patient Info</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className={TAB_TRIGGER_CLASS}>
              <FileText className="w-4 h-4" />
              <span className="font-medium">Notes ({savedNotes.length})</span>
            </TabsTrigger>
            {activeTab === 'view' && (
              <TabsTrigger value="view" className={TAB_TRIGGER_CLASS}>
                <User className="w-4 h-4" />
                <span className="font-medium">View Patient</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="record" className="space-y-6 animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <VoiceRecorder
                onTranscriptUpdate={handleTranscriptUpdate}
                onRecordingComplete={handleRecordingComplete}
                onTranscriptAnalysis={analyzeTranscript}
              />
            </div>
          </TabsContent>

          <TabsContent value="patient" className="space-y-6 animate-fade-in">
            <div className="max-w-6xl mx-auto">
              <PatientForm
                patientData={currentPatient}
                onPatientDataChange={setCurrentPatient}
                onSave={handleSavePatient}
                transcript={currentTranscript}
              />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6 animate-fade-in">
            <div className="max-w-6xl mx-auto">
              <NotesManager
                notes={savedNotes}
                onEditNote={handleViewNote}
                onDeleteNote={handleDeleteNote}
              />
            </div>
          </TabsContent>

          <TabsContent value="view" className="space-y-6 animate-fade-in">
            <div className="max-w-6xl mx-auto">
              {viewingNote && (
                <PatientView
                  patientData={viewingNote}
                  onEdit={handleEditFromView}
                  onDelete={handleDeleteNote}
                  onBack={handleBackToNotes}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
