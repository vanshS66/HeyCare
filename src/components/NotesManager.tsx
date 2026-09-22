// NotesManager lists all saved patient notes with search, preview,
// and export actions. Acts as the "records" dashboard.
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Download,
  Search,
  Copy,
  Trash2,
  User,
  Calendar,
  Eye
} from 'lucide-react';
import { PatientData } from '@/lib/patient';
import {
  buildNoteSummary,
  copyToClipboard,
  downloadNoteAsHtml,
  downloadNoteAsText,
} from '@/lib/export';
import { useToast } from '@/hooks/use-toast';

interface NotesManagerProps {
  notes: PatientData[];
  onEditNote: (note: PatientData) => void;
  onDeleteNote: (noteId: string) => void;
}

// Truncate a preview line the same way for every field.
const preview = (text: string) => (text.length > 100 ? `${text.substring(0, 100)}...` : text);

export const NotesManager: React.FC<NotesManagerProps> = ({
  notes,
  onEditNote,
  onDeleteNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Basic text search across key fields
  const filteredNotes = notes.filter(note =>
    note.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="medical-card p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Patient Notes</h2>
            <Badge variant="secondary" className="ml-2">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes by patient name, symptoms, or diagnosis..."
            className="pl-10"
          />
        </div>

        {/* Notes List */}
        <ScrollArea className="h-[500px] w-full">
          <div className="space-y-4">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {notes.length === 0 ? (
                  <div>
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No patient notes yet.</p>
                    <p className="text-sm">Record a conversation to create your first note.</p>
                  </div>
                ) : (
                  <div>
                    <Search className="w-8 h-8 mx-auto mb-4 opacity-50" />
                    <p>No notes match your search.</p>
                  </div>
                )}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id} className="p-4 border border-border hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-foreground">{note.patientName}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Age: {note.age}</span>
                            <span>Gender: {note.gender}</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(note.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => onEditNote(note)}
                          variant="outline"
                          size="sm"
                          className="p-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => onDeleteNote(note.id)}
                          variant="outline"
                          size="sm"
                          className="p-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="space-y-2 text-sm">
                      {note.symptoms && (
                        <div>
                          <span className="font-medium text-foreground">Symptoms: </span>
                          <span className="text-muted-foreground">{preview(note.symptoms)}</span>
                        </div>
                      )}
                      {note.diagnosis && (
                        <div>
                          <span className="font-medium text-foreground">Diagnosis: </span>
                          <span className="text-muted-foreground">{preview(note.diagnosis)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        onClick={() => copyToClipboard(buildNoteSummary(note), toast)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        onClick={() => downloadNoteAsText(note, toast)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        .txt
                      </Button>
                      <Button
                        onClick={() => downloadNoteAsHtml(note, toast)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        .html
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
