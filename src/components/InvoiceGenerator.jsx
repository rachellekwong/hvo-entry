import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { googleSheets } from "@/api/googleSheetsClient";
import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import SignaturePad from "./SignaturePad";

export default function InvoiceGenerator() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [confirmationSignature, setConfirmationSignature] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const invoiceRef = useRef(null);

  const { data: surveys = [], isLoading, error } = useQuery({
    queryKey: ['surveys', selectedDate],
    queryFn: async () => {
      const result = await googleSheets.listSurveysByDate(selectedDate);
      return Array.isArray(result) ? result : (result.surveys || []);
    },
    enabled: !!selectedDate
  });

  const totalQuantity = surveys.reduce((sum, s) => sum + (s.quantity || 0), 0);

  const exportToPDF = async () => {
    if (!confirmationSignature) {
      return;
    }

    setIsExporting(true);

    // Small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 300));

    const element = invoiceRef.current;
    
    // Get actual dimensions
    const originalWidth = element.offsetWidth;
    const scrollHeight = element.scrollHeight;
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: originalWidth,
      height: scrollHeight,
      windowWidth: originalWidth,
      windowHeight: scrollHeight,
      scrollY: -window.scrollY,
      scrollX: -window.scrollX
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    
    let imgWidth = pdfWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Scale down if content is taller than page
    if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }
    
    // Center on page
    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
    pdf.save(`Invoice_${selectedDate}.pdf`);

    setIsExporting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Date Selector Card */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-slate-700 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Select Invoice Date 選擇發票日期
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview */}
      <div ref={invoiceRef} className="bg-white">
        <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">
                  Invoice 發票 for {format(new Date(selectedDate), 'MMMM d, yyyy')}
                </CardTitle>
                <p className="text-slate-300 text-sm mt-1">Summary 終結</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-red-500">
                <AlertCircle className="w-5 h-5 mr-2" />
                Error loading data. Please try again.
              </div>
            ) : surveys.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <p className="font-medium">No surveys recorded for this date 此日期沒有記錄的調查</p>
                <p className="text-sm text-slate-400 mt-1">Select a different date or add new surveys 選擇其他日期或添加新調查</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Data Table */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Vehicle 車輛</TableHead>
                        <TableHead className="font-semibold text-slate-700">Type 類型</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Quantity (L) 數量（升）</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {surveys.map((survey, idx) => (
                        <TableRow key={survey.id || idx} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium text-slate-900">{survey.vehicle}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {survey.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{survey.quantity?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total */}
                <div className="flex justify-end">
                  <div className="bg-slate-900 text-white rounded-xl px-6 py-4 inline-flex items-center gap-4">
                    <span className="text-slate-300">Total Quantity 總數量:</span>
                    <span className="text-2xl font-bold">{totalQuantity.toFixed(2)} L</span>
                  </div>
                </div>

                {/* Confirmation Signature */}
                <div className="pt-6 border-t border-slate-200">
                  <Label className="text-slate-700 font-medium mb-3 block">Confirmation Signature 確認簽名</Label>
                  <SignaturePad onSignatureChange={setConfirmationSignature} hideControls />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      {surveys.length > 0 && (
        <Button
          onClick={exportToPDF}
          disabled={!confirmationSignature || isExporting}
          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating PDF... 生成PDF中...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              {confirmationSignature ? 'Download Invoice PDF 下載發票PDF' : 'Sign to Download PDF 簽名以下載PDF'}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
