import React, { useState, useRef } from "react";
import { removeBackground } from "@imgly/background-removal";
import { 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Crop, 
  SunMedium, 
  FileCheck,
  RefreshCw 
} from "lucide-react";

interface SmartImageUploadProps {
  onImageProcessed: (processedImageUrl: string, blob: Blob) => void;
  initialImageUrl?: string | null;
}

// Passos do Pipeline de Processamento
const PIPELINE_STEPS = [
  { id: 1, name: "Remoção de Fundo (IA)", icon: Sparkles, weight: 60 },
  { id: 2, name: "Realce de Nitidez & Cores", icon: SunMedium, weight: 15 },
  { id: 3, name: "Enquadramento 1:1 & Sombra 3D", icon: Crop, weight: 15 },
  { id: 4, name: "Compressão Otimizada (WebP)", icon: FileCheck, weight: 10 },
];

export function SmartProductImageUpload({ onImageProcessed, initialImageUrl }: SmartImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepProgress, setStepProgress] = useState<number>(0); // 0 a 100% da etapa atual
  const [totalProgress, setTotalProgress] = useState<number>(0); // 0 a 100% do processo global
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Processamento no Canvas: Nitidez + Enquadramento 1:1 + Sombra 3D
  const processCanvasPipeline = async (bgRemovedBlob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(bgRemovedBlob);
      
      img.onload = () => {
        // --- PASSO 2: Nitidez e Ajuste de Cores ---
        setCurrentStep(2);
        setStepProgress(30);
        setTotalProgress(65);

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Definir tamanho fixo quadrado (1:1 Proporção ideal para PDV e Carrossel 3D)
        const canvasSize = 800;
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        if (!ctx) return resolve(bgRemovedBlob);

        setStepProgress(80);
        setTotalProgress(72);

        // --- PASSO 3: Enquadramento 1:1 Centralizado com Margem Segura ---
        setCurrentStep(3);
        setStepProgress(20);
        setTotalProgress(77);

        // Limpa o fundo para transparência total
        ctx.clearRect(0, 0, canvasSize, canvasSize);

        // Aplicação de filtros de nitidez, saturação e contraste profissional
        ctx.filter = "contrast(1.18) saturate(1.12) brightness(1.02)";

        // Cálculo de escala mantendo a proporção (Aspect Ratio) com 15% de padding interno
        const padding = canvasSize * 0.15;
        const availableSpace = canvasSize - padding * 2;
        const scale = Math.min(availableSpace / img.width, availableSpace / img.height);
        
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        const drawX = (canvasSize - drawWidth) / 2;
        const drawY = (canvasSize - drawHeight) / 2;

        setStepProgress(60);
        setTotalProgress(83);

        // Desenhar Sombra Flutuante na Base (Projeção 3D)
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 15;

        // Desenhar Imagem Centralizada
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        setStepProgress(100);
        setTotalProgress(90);

        // --- PASSO 4: Compressão WebP ---
        setCurrentStep(4);
        setStepProgress(40);
        setTotalProgress(94);

        canvas.toBlob(
          (blob) => {
            setStepProgress(100);
            setTotalProgress(100);
            resolve(blob || bgRemovedBlob);
          },
          "image/webp",
          0.92
        );
      };
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setCurrentStep(1);
      setStepProgress(0);
      setTotalProgress(0);

      // PASSO 1: Remoção de Fundo com Progresso Real via Event Listener da Lib
      const bgRemovedBlob = await removeBackground(file, {
        output: { format: "image/png" },
        progress: (key, current, total) => {
          if (total > 0) {
            const percent = Math.round((current / total) * 100);
            setStepProgress(percent);
            // Passo 1 representa até 60% do progresso geral do pipeline
            setTotalProgress(Math.round(percent * 0.6));
          }
        },
      });

      // PASSO 2, 3 e 4: Processamento no Canvas
      const finalBlob = await processCanvasPipeline(bgRemovedBlob);

      // Finalização do Preview
      const finalUrl = URL.createObjectURL(finalBlob);
      setPreviewUrl(finalUrl);
      onImageProcessed(finalUrl, finalBlob);

    } catch (error) {
      console.error("Erro no processamento da imagem:", error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 400);
    }
  };

  return (
    <div className="w-full bg-white border border-neutral-200 rounded-3xl p-5 select-none shadow-xs">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* ⏳ ECRÃ DE PROGRESSO DETALHADO */}
      {isProcessing && (
        <div className="min-h-[300px] bg-neutral-50 border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between">
          {/* Header com percentagem total */}
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Pipeline HD Ativo
              </span>
              <h4 className="text-sm font-extrabold text-neutral-900 mt-2">Processando Fotografia</h4>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-600">{totalProgress}%</span>
              <p className="text-[10px] text-neutral-400 font-bold">Concluído</p>
            </div>
          </div>

          {/* Barra de Progresso Principal */}
          <div className="w-full my-4">
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden p-0.5 border border-neutral-300/60">
              <div
                className="h-full bg-gradient-to-r from-[#32D583] to-[#E1FB15] rounded-full transition-all duration-300 ease-out shadow-xs"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>

          {/* Lista das 4 Etapas com Indicadores Visuais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PIPELINE_STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isCurrent
                      ? "bg-white border-emerald-500 shadow-sm"
                      : isCompleted
                      ? "bg-emerald-50/50 border-emerald-200/80 opacity-90"
                      : "bg-white border-neutral-200/60 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isCurrent
                          ? "bg-zinc-950 text-[#E1FB15]"
                          : isCompleted
                          ? "bg-[#32D583]/20 text-emerald-700"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-800 line-clamp-1">{step.name}</p>
                      {isCurrent && (
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Progresso da etapa: {stepProgress}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estado do Ícone */}
                  <div>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isCurrent && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🖼️ PRÉ-VISUALIZAÇÃO APÓS CONCLUÍDO */}
      {!isProcessing && previewUrl && (
        <div className="flex flex-col items-center">
          <div className="w-full h-64 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            
            <div className="absolute top-3 left-3 bg-[#32D583] text-black text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              <span>1:1 HD Transparente</span>
            </div>

            <img
              src={previewUrl}
              alt="Produto Otimizado"
              className="max-h-full max-w-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.15)]"
            />
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs font-bold text-neutral-800 rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Processar Nova Fotografia</span>
          </button>
        </div>
      )}

      {/* 📤 DROPZONE INICIAL */}
      {!isProcessing && !previewUrl && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="h-60 border-2 border-dashed border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-2xl cursor-pointer flex flex-col items-center justify-center gap-3 transition group p-6 text-center bg-neutral-50/60"
        >
          <div className="p-3.5 bg-white border border-neutral-200 group-hover:border-emerald-400 group-hover:shadow-xs rounded-2xl transition">
            <Upload className="w-6 h-6 text-neutral-400 group-hover:text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-neutral-800">Carregar Imagem do Produto</p>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs">
              O sistema aplicará <span className="text-emerald-600 font-bold">Remoção de Fundo</span>, <span className="text-emerald-600 font-bold">Nitidez HD</span> e <span className="text-neutral-800 font-bold">Enquadramento 1:1</span> automaticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
