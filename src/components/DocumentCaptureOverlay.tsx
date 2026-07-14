'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCcw, X, Check, Loader2, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import ImageCropper from './ImageCropper';

type CaptureOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (docFile: File, secFile?: File) => void;
  documentType: string;
};

export default function DocumentCaptureOverlay({ isOpen, onClose, onCapture, documentType }: CaptureOverlayProps) {
  const [step, setStep] = useState<'request_permission' | 'security_capture' | 'document_capture' | 'preview'>('request_permission');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [secFile, setSecFile] = useState<File | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [errorMsg, setErrorMsg] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('request_permission');
      setErrorMsg('');
      setDocFile(null);
      setSecFile(null);
      if (docPreviewUrl) URL.revokeObjectURL(docPreviewUrl);
      setDocPreviewUrl(null);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      setStream(s);
      setFacingMode(mode);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play();
      }
      return s;
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Không thể mở camera. Vui lòng cấp quyền hoặc tải ảnh lên từ thư viện.');
      return null;
    }
  };

  const handleStartProcess = async () => {
    const s = await startCamera('user');
    if (s) {
      setStep('security_capture');
      // Auto capture security photo after 1.5 seconds to ensure camera is ready
      setTimeout(() => {
        captureSecurityPhoto();
      }, 1500);
    }
  };

  const captureSecurityPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'security_photo.jpg', { type: 'image/jpeg' });
          setSecFile(file);
          // Switch to document capture
          setStep('document_capture');
          startCamera('environment');
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const captureDocumentPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'document_photo.jpg', { type: 'image/jpeg' });
          setDocFile(file);
          setDocPreviewUrl(URL.createObjectURL(file));
          setStep('preview');
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleFallbackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
      setDocPreviewUrl(URL.createObjectURL(file));
      setStep('preview');
      stopCamera();
    }
  };

  const submit = () => {
    if (docFile) {
      onCapture(docFile, secFile || undefined);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-lg font-bold">Chụp ảnh xác thực</h2>
        <button onClick={onClose} className="p-2 text-white/70 hover:text-white bg-white/10 rounded-full">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
        {step === 'request_permission' && (
          <div className="p-6 max-w-md w-full bg-slate-800 rounded-2xl text-center space-y-6 mx-4 border border-slate-700">
            <ShieldAlert className="w-16 h-16 text-indigo-400 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Xác thực danh tính</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Để đảm bảo tính bảo mật và xác thực người gửi hồ sơ, hệ thống sẽ yêu cầu quyền truy cập Camera để tự động chụp một bức ảnh khuôn mặt của bạn trước khi chụp tài liệu.
              </p>
            </div>
            {errorMsg && <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{errorMsg}</p>}
            <div className="space-y-3 pt-4">
              <button 
                onClick={handleStartProcess}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" /> Bắt đầu chụp ảnh
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" /> Chọn từ thư viện (Không khuyến nghị)
              </button>
            </div>
          </div>
        )}

        {(step === 'security_capture' || step === 'document_capture') && (
          <div className="absolute inset-0 w-full h-full">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            
            {step === 'security_capture' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                <p className="text-lg font-bold text-white drop-shadow-md">Đang xác thực khuôn mặt...</p>
                <p className="text-sm text-white/80 mt-2">Vui lòng nhìn thẳng vào camera</p>
              </div>
            )}

            {step === 'document_capture' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Overlay with cutout */}
                <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <div className="text-center mb-8 px-4">
                    <p className="text-white font-bold text-lg drop-shadow-md">
                      {documentType === 'zairyu' ? 'Chụp mặt trước Thẻ Ngoại Kiều' : 
                       documentType === 'passport' ? 'Chụp trang thông tin Hộ chiếu' : 
                       documentType === 'nenkin' ? 'Chụp Sổ tay Nenkin' : 'Chụp Sổ/Thẻ ngân hàng'}
                    </p>
                    <p className="text-white/80 text-sm mt-1">Căn chỉnh tài liệu vừa vặn vào khung bên dưới</p>
                  </div>
                  
                  {/* Card Frame Cutout (aspect ratio ~1.58 for card) */}
                  <div className="w-[90%] max-w-[400px] aspect-[1.58/1] border-2 border-white/80 rounded-lg relative" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}>
                    <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
                  </div>
                  
                  <div className="flex-1 w-full"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && docPreviewUrl && (
          <div className="absolute inset-0 w-full h-full bg-slate-900 z-50">
            <ImageCropper 
              imageSrc={docPreviewUrl}
              onSave={(blob) => {
                const newFile = new File([blob], docFile?.name || 'document_photo.jpg', { type: blob.type || 'image/jpeg' });
                setDocFile(newFile);
                onCapture(newFile, secFile || undefined);
                onClose();
              }}
              onCancel={() => {
                setStep('document_capture');
                startCamera('environment');
              }}
            />
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
        <input type="file" ref={fileInputRef} onChange={handleFallbackUpload} className="hidden" accept="image/*" />
      </div>

      {step === 'document_capture' && (
        <div className="bg-black pb-safe p-6 flex items-center justify-center gap-8">
          <button onClick={() => startCamera(facingMode === 'environment' ? 'user' : 'environment')} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white">
            <RefreshCcw className="w-6 h-6" />
          </button>
          
          <button onClick={captureDocumentPhoto} className="w-20 h-20 rounded-full bg-white/20 p-1 flex items-center justify-center border-2 border-white/50">
            <div className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 transition-colors"></div>
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white">
            <ImageIcon className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
