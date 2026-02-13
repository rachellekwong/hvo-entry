import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Fuel, Truck, Droplets, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { googleSheets } from "@/api/googleSheetsClient";
import { toast } from "sonner";
import SignaturePad from "./SignaturePad";

const VEHICLES = [
  "CCB-06",
  "CCB-07",
  "CCB-08",
  "CCB-10",
  "CCB-12",
  "CCB-13",
  "CCB-15",
  "CCB-16",
  "VAN-111",
  "VAN-139",
  "STB-18",
  "STB-23",
  "STB-25",
  "STB-28",
];

export default function SurveyForm() {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'HVO',
    vehicle: '',
    quantity: '',
    signature: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vehicle || !formData.quantity || !formData.signature) {
      toast.error('Please fill in all fields and provide a signature');
      return;
    }

    setIsSubmitting(true);

    try {
      await googleSheets.appendSurvey({
        date: formData.date,
        type: formData.type,
        vehicle: formData.vehicle,
        quantity: parseFloat(formData.quantity),
        signature: formData.signature
      });
    } catch (err) {
      toast.error('Failed to record survey. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    
    // Reset form
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'HVO',
      vehicle: '',
      quantity: '',
      signature: null
    });
    
    toast.success('Survey recorded successfully');
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-slate-800 to-slate-900 text-white pb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Fuel Entry 燃料輸入</CardTitle>
              <p className="text-slate-300 text-sm mt-1">Record vehicle fuel data 記錄車輛燃料數據</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 -mt-4 bg-white rounded-t-3xl">
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Date Field */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Date 日期
              </Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            {/* Type Field - Read Only */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium flex items-center gap-2">
                <Droplets className="w-4 h-4 text-slate-400" />
                Fuel Type 燃料類型
              </Label>
              <div className="h-12 px-4 flex items-center bg-slate-100 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-700">HVO</span>
                <span className="ml-2 text-xs text-slate-500">(Hydrotreated Vegetable Oil)</span>
              </div>
            </div>

            {/* Vehicle Field */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" />
                Vehicle 車輛
              </Label>
              <Select
                value={formData.vehicle}
                onValueChange={(value) => setFormData({ ...formData, vehicle: value })}
              >
                <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select vehicle number plate" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLES.map((vehicle) => (
                    <SelectItem key={vehicle} value={vehicle}>
                      {vehicle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Field */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium flex items-center gap-2">
                <Fuel className="w-4 h-4 text-slate-400" />
                Quantity (Liters) 數量（公升）
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>

            {/* Signature Field */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Signature 簽名</Label>
              <SignaturePad
                key={showSuccess ? 'reset' : 'active'}
                onSignatureChange={(sig) => setFormData({ ...formData, signature: sig })}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Recording... 記錄中...
                </>
              ) : showSuccess ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Recorded Successfully! 記錄成功！
                </>
              ) : (
                'Submit Survey 提交調查'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
