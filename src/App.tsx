import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, X, CheckCircle, Clock, Trash2, 
  MapPin, Wrench, Calendar, FileText, PlusCircle, 
  LayoutList, CheckSquare, Pencil, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';

// Types
type ReportStatus = 'pending' | 'completed';

interface Report {
  id: string;
  location: string;
  damageType: string;
  date: string;
  description: string;
  photos: string[]; // Base64 data URLs
  afterPhotos?: string[]; // Base64 data URLs
  completionDate?: string;
  remarks?: string;
  status: ReportStatus;
  createdAt: number;
}

const DAMAGE_TYPES = [
  'Plumbing / Leak', 'Electrical / Lighting', 'HVAC / Temperature',
  'Structural (Wall, Floor, Ceiling)', 'Furniture (Desk, Chair, etc)',
  'Window / Door', 'Vandalism', 'IT / Tech', 'Other'
];

function Header() {
  return (
    <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-sm shrink-0">
      <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <Wrench className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">EduCare Maintenance</span>
      </div>
    </nav>
  );
}

interface TabsProps {
  activeTab: 'submit' | 'pending' | 'completed';
  onTabChange: (tab: 'submit' | 'pending' | 'completed') => void;
  counts: { pending: number; completed: number };
}

function Tabs({ activeTab, onTabChange, counts }: TabsProps) {
  const tabs = [
    { id: 'submit', label: 'Submit Report', icon: PlusCircle, count: undefined },
    { id: 'pending', label: 'Pending', icon: Clock, count: counts.pending },
    { id: 'completed', label: 'Completed', icon: CheckSquare, count: counts.completed },
  ] as const;

  return (
    <div className="flex gap-2 p-1 bg-slate-200 rounded-lg w-fit mx-auto overflow-x-auto no-scrollbar max-w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col sm:flex-row items-center justify-center whitespace-nowrap px-4 sm:px-6 py-2 rounded-md font-bold text-sm transition-all duration-200 ${
              isActive 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50'
            }`}
          >
            <span className="flex items-center">
              <Icon className={`w-4 h-4 sm:mr-2 mb-1 sm:mb-0 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </span>
            {tab.count !== undefined && (
              <span className={`sm:ml-2 mt-1 sm:mt-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300 text-slate-700'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ReportForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isEdit 
}: { 
  initialData?: Report;
  onSubmit: (data: Omit<Report, 'id' | 'createdAt' | 'status'>) => void;
  onCancel?: () => void;
  isEdit?: boolean;
  key?: string;
}) {
  const [location, setLocation] = useState(initialData?.location || '');
  const [damageType, setDamageType] = useState(initialData?.damageType || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const remainingSlots = 4 - photos.length;
    const allowedFiles = files.slice(0, remainingSlots);

    allowedFiles.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos(prev => {
            if (prev.length < 4) return [...prev, event.target!.result as string];
            return prev;
          });
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!location || !damageType || !date || !description) return;
    
    onSubmit({
      location,
      damageType,
      date,
      description,
      photos
    });
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Wrench className="w-5 h-5 text-indigo-600" />
          {isEdit ? 'Edit Damage Report' : 'Submit New Damage Report'}
        </h2>
        {isEdit && onCancel && (
          <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              Location <span className="text-red-500 ml-1">*</span>
            </label>
            <input 
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Science Lab 4B"
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500">
              <Wrench className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Damage Type <span className="text-red-500 ml-1">*</span>
            </label>
            <select 
              required
              value={damageType}
              onChange={(e) => setDamageType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            >
              <option value="" disabled>Select damage type...</option>
              {DAMAGE_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
            Submission Date <span className="text-red-500 ml-1">*</span>
          </label>
          <input 
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500">
            <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
            Issue Description <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea 
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the damage in detail..."
            className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow resize-none placeholder-slate-400"
          />
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center">
              <Camera className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              Evidence Photos <span className="text-slate-400 ml-1 capitalize normal-case text-[10px] sm:text-xs tracking-normal">(Max 4)</span>
            </span>
            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{photos.length}/4</span>
          </label>
          
          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group bg-slate-100">
                <img src={photo} alt={`Upload ${idx+1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {photos.length < 4 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-indigo-50 transition-colors group"
              >
                <Camera className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-[10px] mt-1 text-slate-500 font-medium group-hover:text-indigo-600 transition-colors">Add Photo</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            multiple 
            className="hidden" 
            ref={fileInputRef}
            onChange={handlePhotoUpload}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md transition-all mt-6 flex items-center justify-center"
        >
          {isEdit ? 'Save Changes' : 'Submit Report'}
        </button>
      </div>
    </motion.form>
  );
}

interface ReportListProps {
  reports: Report[];
  onUpdateStatus: (id: string, status: ReportStatus) => void;
  onDelete: (id: string) => void;
  onEdit?: (report: Report) => void;
  onComplete?: (report: Report) => void;
  onExport?: (report: Report) => void;
  emptyMessage: string;
  key?: string;
}

function ReportList({ reports, onUpdateStatus, onDelete, onEdit, onComplete, onExport, emptyMessage }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 border-dashed"
      >
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          <LayoutList className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">{emptyMessage}</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {reports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 group"
          >
            {(() => {
              const displayPhoto = (report.status === 'completed' && report.afterPhotos && report.afterPhotos.length > 0) 
                 ? report.afterPhotos[0] 
                 : (report.photos.length > 0 ? report.photos[0] : null);
              const extraPhotos = (report.photos.length + (report.afterPhotos?.length || 0)) - 1;
              const photoLabel = (report.status === 'completed' && report.afterPhotos && report.afterPhotos.length > 0) ? 'After' : (report.photos.length > 0 ? 'Before' : null);

              if (displayPhoto) {
                return (
                  <div className="w-full sm:w-20 h-48 sm:h-20 bg-slate-100 rounded-lg shrink-0 overflow-hidden relative border border-slate-200">
                    <img src={displayPhoto} alt="Damage evidence" className="w-full h-full object-cover" />
                    {photoLabel && (
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold backdrop-blur-sm uppercase">
                        {photoLabel}
                      </div>
                    )}
                    {extraPhotos > 0 && (
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
                        +{extraPhotos}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div className="w-full sm:w-20 h-12 sm:h-20 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center border border-slate-200">
                  <Wrench className="w-6 h-6 text-slate-300" />
                </div>
              );
            })()}
            
            <div className="flex-1 w-full">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-slate-800 text-sm">
                  {report.damageType}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  report.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {report.status === 'pending' ? 'Pending' : 'Completed'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                {report.location}. {report.description}
              </p>

              {report.status === 'completed' && (
                <div className="mt-2 bg-slate-50 border border-slate-100 rounded-md p-2.5 text-xs text-slate-600">
                  <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Completed {report.completionDate ? 'on ' + new Date(report.completionDate).toLocaleDateString() : ''}</span>
                  </div>
                  {report.remarks && <p className="italic text-slate-500 line-clamp-2 mt-1">"{report.remarks}"</p>}
                </div>
              )}
              
              <div className="mt-3 sm:mt-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold border-t border-slate-100 sm:border-transparent pt-3 sm:pt-0">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(report.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onDelete(report.id)}
                    className="flex items-center text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 sm:mr-1" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  {report.status === 'pending' && onEdit && (
                    <>
                      <button
                        onClick={() => onEdit(report)}
                        className="flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Pencil className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <span className="text-slate-300">|</span>
                    </>
                  )}
                  {report.status === 'completed' && onExport && (
                    <>
                      <button
                        onClick={() => onExport(report)}
                        className="flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Download className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Export PDF</span>
                      </button>
                      <span className="text-slate-300">|</span>
                    </>
                  )}
                  {report.status === 'completed' && onComplete && (
                    <>
                      <button
                        onClick={() => onComplete(report)}
                        className="flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        <Pencil className="w-3 h-3 sm:mr-1" />
                        <span className="hidden sm:inline">Update Log</span>
                      </button>
                      <span className="text-slate-300">|</span>
                    </>
                  )}
                  {report.status === 'pending' ? (
                    <button
                      onClick={() => onComplete?.(report)}
                      className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Mark Completed</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(report.id, 'pending')}
                      className="flex items-center text-amber-600 hover:text-amber-800 transition-colors"
                    >
                      <Clock className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">Reopen</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'submit' | 'pending' | 'completed'>('submit');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [completingReportId, setCompletingReportId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>(() => {
    try {
      const saved = localStorage.getItem('school-reports');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load reports', e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('school-reports', JSON.stringify(reports));
  }, [reports]);

  const sortedReports = [...reports].sort((a, b) => b.createdAt - a.createdAt);
  const pendingCounts = reports.filter(r => r.status === 'pending').length;
  const completedCounts = reports.filter(r => r.status === 'completed').length;
  
  const editingReport = editingReportId ? reports.find(r => r.id === editingReportId) : null;
  const completingReport = completingReportId ? reports.find(r => r.id === completingReportId) : null;

  async function exportReportToPDF(report: Report) {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(50, 50, 50);
    doc.text('EduCare Maintenance Report', 20, 20);
    
    // Status Badge background (simulated)
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(20, 28, 30, 8, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('COMPLETED', 23, 34);
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(12);
    
    // Meta Information
    const leftColX = 20;
    const rightColX = 110;
    const initialY = 55;
    const lineSpacing = 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Location:', leftColX, initialY);
    doc.setFont('helvetica', 'normal');
    doc.text(report.location, leftColX + 30, initialY);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Reported:', rightColX, initialY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(report.date).toLocaleDateString(), rightColX + 35, initialY);

    doc.setFont('helvetica', 'bold');
    doc.text('Damage Type:', leftColX, initialY + lineSpacing);
    doc.setFont('helvetica', 'normal');
    doc.text(report.damageType, leftColX + 30, initialY + lineSpacing);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Completed:', rightColX, initialY + lineSpacing);
    doc.setFont('helvetica', 'normal');
    doc.text(report.completionDate ? new Date(report.completionDate).toLocaleDateString() : 'N/A', rightColX + 35, initialY + lineSpacing);

    // Description Section
    const descY = initialY + lineSpacing * 2.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Issue Description:', leftColX, descY);
    doc.setFont('helvetica', 'normal');
    const splitDescription = doc.splitTextToSize(report.description, 170);
    doc.text(splitDescription, leftColX, descY + 6);
    
    let currentY = descY + 6 + (splitDescription.length * 6);
    
    // Remarks Section
    if (report.remarks) {
      currentY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Completion Remarks:', leftColX, currentY);
      doc.setFont('helvetica', 'normal');
      const splitRemarks = doc.splitTextToSize(report.remarks, 170);
      doc.text(splitRemarks, leftColX, currentY + 6);
      currentY += 6 + (splitRemarks.length * 6);
    }
    
    currentY += 10;
    
    // Helper function to load image
    const addPhotosToPDF = async (photos: string[], title: string, startY: number): Promise<number> => {
      if (!photos || photos.length === 0) return startY;
      
      let cy = startY;
      
      // Page break if too low
      if (cy > 230) {
        doc.addPage();
        cy = 20;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(title, leftColX, cy);
      cy += 8;
      
      const imgWidth = 80;
      const imgHeight = 60;
      
      for (let i = 0; i < photos.length; i++) {
        // Page break if we run out of vertical space
        if (i > 0 && i % 2 === 0) {
          cy += imgHeight + 10;
          if (cy + imgHeight > 270) {
             doc.addPage();
             cy = 20;
          }
        }
        
        const xPos = leftColX + (i % 2) * (imgWidth + 10);
        
        try {
          // If photos are base64, we can directly add them by specifying format (e.g., 'JPEG' or 'PNG').
          // Assuming JPEG/PNG from standard inputs.
          const imgData = photos[i];
          const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(imgData, format, xPos, cy, imgWidth, imgHeight);
        } catch (err) {
          console.error("Failed to add image to PDF", err);
        }
      }
      
      // Calculate final Y after photos
      const numRows = Math.ceil(photos.length / 2);
      cy += (numRows * imgHeight) + 10;
      
      return cy;
    };
    
    currentY = await addPhotosToPDF(report.photos, 'Before (Reported Damage)', currentY);
    currentY = await addPhotosToPDF(report.afterPhotos || [], 'After (Repaired)', currentY);

    // Save
    doc.save(`Maintenance_Report_${report.id.substring(0,6)}.pdf`);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-12">
       <Header />
       <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 flex flex-col gap-6">
         {!editingReport && !completingReport && (
           <Tabs 
             activeTab={activeTab} 
             onTabChange={setActiveTab} 
             counts={{ pending: pendingCounts, completed: completedCounts }} 
           />
         )}
         
         <div className="mt-2 w-full max-w-2xl mx-auto">
           <AnimatePresence mode="wait">
             {completingReport ? (
               <CompletionForm 
                 key="complete"
                 initialData={completingReport}
                 onSubmit={(data) => {
                   updateReport(completingReport.id, data);
                   setCompletingReportId(null);
                 }}
                 onCancel={() => setCompletingReportId(null)}
               />
             ) : editingReport ? (
               <ReportForm 
                 key="edit"
                 isEdit
                 initialData={editingReport}
                 onSubmit={(data) => {
                   updateReport(editingReport.id, data);
                   setEditingReportId(null);
                 }}
                 onCancel={() => setEditingReportId(null)}
               />
             ) : (
               <>
                 {activeTab === 'submit' && (
                   <ReportForm 
                     onSubmit={(data) => { 
                       const newReport: Report = {
                         id: crypto.randomUUID(),
                         ...data,
                         status: 'pending',
                         createdAt: Date.now()
                       };
                       setReports([newReport, ...reports]); 
                       setActiveTab('pending'); 
                     }} 
                     key="submit" 
                   />
                 )}
                 {activeTab === 'pending' && (
                   <ReportList 
                     reports={sortedReports.filter(r => r.status === 'pending')} 
                     onUpdateStatus={updateStatus} 
                     onDelete={deleteReport} 
                     onEdit={(report) => setEditingReportId(report.id)}
                     onComplete={(report) => setCompletingReportId(report.id)}
                     emptyMessage="Great job! There are no pending maintenance reports." 
                     key="pending" 
                   />
                 )}
                 {activeTab === 'completed' && (
                   <ReportList 
                     reports={sortedReports.filter(r => r.status === 'completed')} 
                     onUpdateStatus={updateStatus} 
                     onDelete={deleteReport} 
                     onEdit={(report) => setEditingReportId(report.id)}
                     onComplete={(report) => setCompletingReportId(report.id)}
                     onExport={exportReportToPDF}
                     emptyMessage="No completed reports yet." 
                     key="completed" 
                   />
                 )}
               </>
             )}
           </AnimatePresence>
         </div>
       </main>
    </div>
  );

  function updateStatus(id: string, status: ReportStatus) {
    setReports(reports.map(r => r.id === id ? { ...r, status } : r));
  }
  
  function updateReport(id: string, data: Partial<Report>) {
    setReports(reports.map(r => r.id === id ? { ...r, ...data } : r));
  }
  
  function deleteReport(id: string) {
    setReports(reports.filter(r => r.id !== id));
  }
}

function CompletionForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: { 
  initialData: Report;
  onSubmit: (data: { afterPhotos: string[]; completionDate: string; remarks: string; status: ReportStatus }) => void;
  onCancel: () => void;
  key?: string;
}) {
  const [afterPhotos, setAfterPhotos] = useState<string[]>(initialData.afterPhotos || []);
  const [completionDate, setCompletionDate] = useState(initialData.completionDate || new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState(initialData.remarks || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const remainingSlots = 4 - afterPhotos.length;
    const allowedFiles = files.slice(0, remainingSlots);

    allowedFiles.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAfterPhotos(prev => {
            if (prev.length < 4) return [...prev, event.target!.result as string];
            return prev;
          });
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setAfterPhotos(afterPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      afterPhotos,
      completionDate,
      remarks,
      status: 'completed'
    });
  };

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
    >
      <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          {initialData.status === 'completed' ? 'Update Completion Log' : 'Mark Report as Completed'}
        </h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="p-5 sm:p-6 space-y-4">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm mb-2">
          <p className="font-bold text-slate-800">{initialData.damageType} at {initialData.location}</p>
          <p className="text-slate-500 truncate">{initialData.description}</p>
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span className="flex items-center">
              <Camera className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
              After Photos (Repaired) <span className="text-slate-400 ml-1 capitalize normal-case text-[10px] sm:text-xs tracking-normal">(Max 4)</span>
            </span>
            <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{afterPhotos.length}/4</span>
          </label>
          
          <div className="grid grid-cols-4 gap-2">
            {afterPhotos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group bg-slate-100">
                <img src={photo} alt={`Upload ${idx+1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-red-500/90 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {afterPhotos.length < 4 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-emerald-50 transition-colors group"
              >
                <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span className="text-[10px] mt-1 text-slate-500 font-medium group-hover:text-emerald-600 transition-colors">Add Photo</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            multiple 
            className="hidden" 
            ref={fileInputRef}
            onChange={handlePhotoUpload}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              Completion Date <span className="text-slate-400 ml-1 capitalize normal-case text-[10px] sm:text-xs tracking-normal">(Optional)</span>
            </label>
            <input 
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-500">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
              Remarks <span className="text-slate-400 ml-1 capitalize normal-case text-[10px] sm:text-xs tracking-normal">(Optional)</span>
            </label>
            <textarea 
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any comments regarding the repair..."
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow resize-none placeholder-slate-400"
            />
          </div>
        </div>

      </div>

      <div className="p-5 sm:p-6 bg-white border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all flex items-center justify-center"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {initialData.status === 'completed' ? 'Save Changes' : 'Mark as Completed'}
        </button>
      </div>
    </motion.form>
  );
}

