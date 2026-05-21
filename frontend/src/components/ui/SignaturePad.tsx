import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Eraser } from 'lucide-react';

export interface SignaturePadHandle {
  getSignatureData: () => string | null;
  clear: () => void;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
  label?: string;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

const MIN_WIDTH = 1.5;
const MAX_WIDTH = 4;
const MIN_SPEED = 0.5;
const MAX_SPEED = 8;

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ height = 150, label }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasDrawn = useRef(false);
    const points = useRef<Point[]>([]);
    const lastWidth = useRef(MIN_WIDTH);
    const dpr = useRef(1);

    // Get position adjusted for canvas scale (retina)
    const getPos = useCallback((e: MouseEvent | Touch): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, time: Date.now() };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * dpr.current,
        y: (e.clientY - rect.top) * dpr.current,
        time: Date.now(),
      };
    }, []);

    // Calculate line width based on speed (faster = thinner)
    const getWidth = useCallback((p1: Point, p2: Point): number => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dt = Math.max(p2.time - p1.time, 1);
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;
      const clamped = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
      const normalized = (clamped - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
      const target = MAX_WIDTH - normalized * (MAX_WIDTH - MIN_WIDTH);
      // Smooth transition from last width
      const smoothed = lastWidth.current * 0.6 + target * 0.4;
      lastWidth.current = smoothed;
      return smoothed;
    }, []);

    const drawCurve = useCallback((ctx: CanvasRenderingContext2D, pts: Point[]) => {
      if (pts.length < 2) return;

      ctx.strokeStyle = '#000000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (pts.length === 2) {
        // Simple line for 2 points
        ctx.beginPath();
        ctx.lineWidth = getWidth(pts[0], pts[1]);
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
        return;
      }

      // Draw quadratic Bezier curves through midpoints for smoothness
      const last = pts.length - 1;
      const p0 = pts[last - 2];
      const p1 = pts[last - 1];
      const p2 = pts[last];

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.beginPath();
      ctx.lineWidth = getWidth(p1, p2);

      if (pts.length === 3) {
        const prevMidX = (p0.x + p1.x) / 2;
        const prevMidY = (p0.y + p1.y) / 2;
        ctx.moveTo(prevMidX, prevMidY);
      } else {
        const pp = pts[last - 3];
        const prevMidX = (pp.x + p0.x) / 2;
        const prevMidY = (pp.y + p0.y) / 2;
        ctx.moveTo(prevMidX, prevMidY);
        const prevMid2X = (p0.x + p1.x) / 2;
        const prevMid2Y = (p0.y + p1.y) / 2;
        ctx.quadraticCurveTo(p0.x, p0.y, prevMid2X, prevMid2Y);
      }

      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      ctx.stroke();
    }, [getWidth]);

    const startDraw = useCallback((pos: Point) => {
      isDrawing.current = true;
      points.current = [pos];
      lastWidth.current = (MIN_WIDTH + MAX_WIDTH) / 2;

      // Draw a dot for single tap/click
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        hasDrawn.current = true;
        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.arc(pos.x, pos.y, 1.5 * dpr.current, 0, Math.PI * 2);
        ctx.fill();
      }
    }, []);

    const draw = useCallback((pos: Point) => {
      if (!isDrawing.current) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      hasDrawn.current = true;
      points.current.push(pos);
      drawCurve(ctx, points.current);
    }, [drawCurve]);

    const endDraw = useCallback(() => {
      isDrawing.current = false;
      points.current = [];
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

    // Initialize canvas with retina scaling
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      dpr.current = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr.current;
      canvas.height = height * dpr.current;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, [height]);

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
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        )}
        <p id="signature-instructions" className="sr-only">Dibuja tu firma en el área de abajo usando el ratón o la pantalla táctil. Usa el botón Limpiar para borrar y empezar de nuevo.</p>
        <canvas
          ref={canvasRef}
          aria-label={label || 'Área de firma digital'}
          aria-describedby="signature-instructions"
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
        <p className="text-xs text-slate-500 mt-1">Si no puedes firmar, escribe tu nombre completo en el campo de abajo</p>
      </div>
    );
  },
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
