import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const CUSTOMER_COLUMNS = ['namn', 'projektnummer', 'kontaktperson', 'email', 'telefon', 'adress', 'anteckningar', 'kundansvarig_email'];
const SITE_COLUMNS = ['platsnamn', 'kundnamn', 'adress', 'beskrivning'];

function downloadTemplate(type) {
  const wb = XLSX.utils.book_new();

  if (type === 'customers') {
    const wsData = [
      CUSTOMER_COLUMNS,
      ['Exempelkund AB', 'PRJ-001', 'Anna Andersson', 'anna@exempel.se', '070-1234567', 'Storgatan 1, Stockholm', 'VIP-kund', 'ansvarig@foretaget.se'],
      ['Trädgård & Co', 'PRJ-002', 'Erik Eriksson', 'erik@tradgard.se', '073-9876543', 'Parkvägen 5, Göteborg', '', '']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = CUSTOMER_COLUMNS.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Kunder');
    XLSX.writeFile(wb, 'mall_kunder.xlsx');
  } else {
    const wsData = [
      SITE_COLUMNS,
      ['Rosengården', 'Exempelkund AB', 'Blomstervägen 3, Malmö', 'Stor trädgård med rosor'],
      ['Stadsparken', 'Trädgård & Co', 'Centrumgatan 10, Uppsala', 'Offentlig park']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = SITE_COLUMNS.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, 'Platser');
    XLSX.writeFile(wb, 'mall_platser.xlsx');
  }
}

export default function ImportExcelDialog({ open, onOpenChange, type }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [results, setResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  const isCustomers = type === 'customers';
  const title = isCustomers ? 'Importera kunder' : 'Importera platser';

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      setPreview(rows.slice(0, 6)); // header + up to 5 rows preview
    };
    reader.readAsBinaryString(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResults(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const [header, ...dataRows] = rows;
      const succeeded = [];
      const failed = [];

      if (isCustomers) {
        const allUsers = await base44.entities.User.list();
        for (const row of dataRows) {
          if (!row[0]) continue; // skip empty rows
          try {
            const managerEmail = (row[7] || '').trim().toLowerCase();
            const manager = managerEmail ? allUsers.find(u => u.email?.toLowerCase() === managerEmail) : null;
            await base44.entities.Customer.create({
              name: row[0] || '',
              project_number: row[1] || '',
              contact_person: row[2] || '',
              email: row[3] || '',
              phone: row[4] || '',
              address: row[5] || '',
              notes: row[6] || '',
              ...(manager ? { account_manager: manager.id } : {})
            });
            succeeded.push(row[0]);
          } catch (e) {
            failed.push(row[0]);
          }
        }
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      } else {
        // Sites: need to look up customer by name
        const allCustomers = await base44.entities.Customer.list();
        for (const row of dataRows) {
          if (!row[0]) continue;
          try {
            const customerName = row[1] || '';
            const customer = allCustomers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
            await base44.entities.Site.create({
              name: row[0] || '',
              customer_id: customer?.id || '',
              location: row[2] || '',
              description: row[3] || '',
              map_type: 'uploaded'
            });
            succeeded.push(row[0]);
          } catch (e) {
            failed.push(row[0]);
          }
        }
        queryClient.invalidateQueries({ queryKey: ['sites'] });
        queryClient.invalidateQueries({ queryKey: ['all-sites'] });
      }

      setResults({ succeeded, failed });
      setImporting(false);
      if (succeeded.length > 0) {
        toast.success(`${succeeded.length} poster importerade`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setResults(null);
    setImporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download template */}
          <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-900">Ladda ner mall</p>
              <p className="text-sm text-blue-700">Fyll i mallen och ladda sedan upp den här</p>
            </div>
            <Button variant="outline" onClick={() => downloadTemplate(type)} className="border-blue-300 text-blue-700 hover:bg-blue-100">
              <Download className="w-4 h-4 mr-2" />
              Ladda ner mall
            </Button>
          </div>

          {/* Column info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Förväntade kolumner:</p>
            <div className="flex flex-wrap gap-2">
              {(isCustomers ? CUSTOMER_COLUMNS : SITE_COLUMNS).map(col => (
                <span key={col} className="text-xs bg-white border rounded px-2 py-1 text-gray-700">{col}</span>
              ))}
            </div>
          </div>

          {/* File upload */}
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload className="w-7 h-7 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-600">
              {file ? file.name : 'Klicka för att välja Excel-fil (.xlsx)'}
            </span>
            <span className="text-xs text-gray-400 mt-1">Stödjer .xlsx och .xls</span>
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} />
          </label>

          {/* Preview */}
          {preview.length > 0 && !results && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Förhandsgranskning:</p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="text-xs w-full">
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className={i === 0 ? 'bg-gray-100 font-semibold' : 'border-t'}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 whitespace-nowrap">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 5 && (
                <p className="text-xs text-gray-500 mt-1">Visar de första 5 raderna...</p>
              )}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-2">
              {results.succeeded.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {results.succeeded.length} poster importerades
                  </p>
                  <div className="mt-1 space-y-1">
                    {results.succeeded.map((name, i) => (
                      <p key={i} className="text-xs text-green-700 pl-6">{name}</p>
                    ))}
                  </div>
                </div>
              )}
              {results.failed.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {results.failed.length} poster misslyckades
                  </p>
                  <div className="mt-1 space-y-1">
                    {results.failed.map((name, i) => (
                      <p key={i} className="text-xs text-red-700 pl-6">{name}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>
              {results ? 'Stäng' : 'Avbryt'}
            </Button>
            {!results && (
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="bg-green-600 hover:bg-green-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importerar...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importera
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}