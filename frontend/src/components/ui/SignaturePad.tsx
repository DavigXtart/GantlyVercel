import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Eraser } from 'lucide-react';

export interface SignaturePadHandle {
  getSignatureData: () => string | null;
  clear: () => void;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ height = 150 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasDrawn = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    const getPos = useCallback((e: MouseEvent | Touch): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }, []);

    const startDraw = useCallback((pos: { x: number; y: number }) => {
      isDrawing.current = true;
      lastPos.current = pos;
    }, []);

    const draw = useCallback((pos: { x: number; y: number }) => {
      if (!isDrawing.current || !lastPos.current) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      hasDrawn.current = true;
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPos.current = pos;
    }, []);

    const endDraw = useCallback(() => {
      isDrawing.current = false;
      lastPos.current = null;
    }, []);

    // Mouse events
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        startDraw(getPos(e));
      };
      const onMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        draw(getPos(e));
      };
      const onMouseUp = () => endDraw();
      const onMouseLeave = () => endDraw();

      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('mouseleave', onMouseLeave);

      return () => {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('mouseleave', onMouseLeave);
      };
    }, [getPos, startDraw, draw, endDraw]);

    // Touch events
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const onTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1) {
          startDraw(getPos(e.touches[0]));
        }
      };
      const onTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 1) {
          draw(getPos(e.touches[0]));
        }
      };
      const onTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        endDraw();
      };

      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      };
    }, [getPos, startDraw, draw, endDraw]);

    // Initialize canvas with white background
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      hasDrawn.current = false;
    }, []);

    useImperativeHandle(ref, () => ({
      getSignatureData: () => {
        if (!hasDrawn.current || !canvasRef.current) return null;
        return canvasRef.current.toDataURL('image/png');
      },
      clear: clearCanvas,
    }));

    return (
      <div className="space-y-2">
        <canvas
          ref={canvasRef}
          width={600}
          height={height}
          className="w-full border border-slate-200 rounded-md cursor-crosshair bg-white"
          style={{ height: `${height}px`, touchAction: 'none' }}
        />
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer transition-colors duration-200"
        >
          <Eraser size={14} />
          Limpiar
        </button>
      </div>
    );
  },
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
