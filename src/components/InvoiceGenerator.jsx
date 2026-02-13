import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, Download, Loader2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { googleSheets } from "@/api/googleSheetsClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import SignaturePad from "./SignaturePad";
import { toast } from "sonner";

const VEHICLES = [
  "CCB-06", "CCB-07", "CCB-08", "CCB-10", "CCB-12", "CCB-13", "CCB-15", "CCB-16",
  "VAN-111", "VAN-139", "STB-18", "STB-23", "STB-25", "STB-28",
];

export default function InvoiceGenerator() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [confirmationSignature, setConfirmationSignature] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [editSurvey, setEditSurvey] = useState(null);
  const [deleteSurveyId, setDeleteSurveyId] = useState(null);
  const invoiceRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: surveys = [], isLoading, error } = useQuery({
    queryKey: ['surveys', selectedDate],
    queryFn: async () => {
      const result = await googleSheets.listSurveysByDate(selectedDate);
      return Array.isArray(result) ? result : (result.surveys || []);
    },
    enabled: !!selectedDate
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => googleSheets.updateSurvey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys', selectedDate] });
      setEditSurvey(null);
      toast.success('Entry updated successfully');
    },
    onError: () => toast.error('Failed to update entry. Please try again.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => googleSheets.deleteSurvey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys', selectedDate] });
      setDeleteSurveyId(null);
      toast.success('Entry deleted successfully');
    },
    onError: () => toast.error('Failed to delete entry. Please try again.'),
  });

  const totalQuantity = surveys.reduce((sum, s) => sum + (s.quantity || 0), 0);

  const handleEditSave = () => {
    if (!editSurvey) return;
    const { id, vehicle, type, quantity } = editSurvey;
    if (!vehicle || !type || !quantity) {
      toast.error('Please fill in all fields');
      return;
    }
    updateMutation.mutate({
      id,
      data: { vehicle, type, quantity: parseFloat(quantity) },
    });
  };

  const exportToPDF = async () => {
    if (!confirmationSignature) {
      return;
    }

    setIsExporting(true);

    // Small delay to ensure everything is rendered
    await new Promise(resolve => setTimeout(resolve, 300));

    const element = invoiceRef.current;
    const margin = 15; // mm
    const captureWidth = 595; // A4 at 72dpi for consistent rendering

    // Temporarily set fixed width for consistent PDF output
    const origWidth = element.style.width;
    const origMaxWidth = element.style.maxWidth;
    const origMinWidth = element.style.minWidth;
    element.style.width = `${captureWidth}px`;
    element.style.maxWidth = `${captureWidth}px`;
    element.style.minWidth = `${captureWidth}px`;

    await new Promise(resolve => setTimeout(resolve, 100)); // Allow reflow

    const scrollHeight = element.scrollHeight;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: captureWidth,
      height: scrollHeight,
      windowWidth: captureWidth,
      windowHeight: scrollHeight,
      scrollY: -window.scrollY,
      scrollX: -window.scrollX
    });

    // Restore original styles
    element.style.width = origWidth;
    element.style.maxWidth = origMaxWidth;
    element.style.minWidth = origMinWidth;

    const imgData = canvas.toDataURL('image/png');
    const contentWidth = 210 - 2 * margin;  // 180mm
    const contentHeight = 297 - 2 * margin; // 267mm

    let imgWidth = contentWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > contentHeight) {
      imgHeight = contentHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    // Use page height that fits content when short (reduce extra space)
    const neededHeight = imgHeight + 2 * margin;
    const pageHeight = Math.min(297, neededHeight);
    const pdf = new jsPDF('p', 'mm', [210, pageHeight]);

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
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
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698d530486a5af9808992ca1/e6be25309_wahfupic.jpg"
                alt="Logo"
                className="max-w-12 max-h-12 w-auto h-auto object-contain"
              />
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
                        <TableHead className="font-semibold text-slate-700">Type 類型</TableHead>
                        <TableHead className="font-semibold text-slate-700">Vehicle 車輛</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Quantity (L) 數量（升）</TableHead>
                        {!isExporting && (
                          <TableHead className="font-semibold text-slate-700 text-right w-24">Actions 操作</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {surveys.map((survey, idx) => (
                        <TableRow key={survey.id ?? idx} className="hover:bg-slate-50/50">
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {survey.type}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">{survey.vehicle}</TableCell>
                          <TableCell className="text-right font-mono">{survey.quantity?.toFixed(2)}</TableCell>
                          {!isExporting && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => setEditSurvey({
                                    id: survey.rowIndex ?? survey.id ?? idx,
                                    vehicle: survey.vehicle,
                                    type: survey.type || 'HVO',
                                    quantity: String(survey.quantity ?? ''),
                                  })}
                                  disabled={updateMutation.isPending}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setDeleteSurveyId(survey.rowIndex ?? survey.id ?? idx)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
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

      {/* Edit Dialog */}
      <Dialog open={!!editSurvey} onOpenChange={(open) => !open && setEditSurvey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Entry 編輯記錄</DialogTitle>
          </DialogHeader>
          {editSurvey && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-vehicle">Vehicle 車輛</Label>
                <Select
                  value={editSurvey.vehicle}
                  onValueChange={(v) => setEditSurvey((s) => ({ ...s, vehicle: v }))}
                >
                  <SelectTrigger id="edit-vehicle">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLES.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type 類型</Label>
                <Select
                  value={editSurvey.type}
                  onValueChange={(v) => setEditSurvey((s) => ({ ...s, type: v }))}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HVO">HVO</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity (L) 數量（升）</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editSurvey.quantity}
                  onChange={(e) => setEditSurvey((s) => ({ ...s, quantity: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSurvey(null)}>
              Cancel 取消
            </Button>
            <Button onClick={handleEditSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save 保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSurveyId} onOpenChange={(open) => !open && setDeleteSurveyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry 刪除記錄</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
              確定要刪除此記錄嗎？此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel 取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteSurveyId != null && deleteMutation.mutate(deleteSurveyId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete 刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
