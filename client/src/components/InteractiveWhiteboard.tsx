/**
 * Interactive Whiteboard Component
 * Simple drawing canvas with basic tools
 */

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Pen,
  Eraser,
  Circle,
  Square,
  Minus,
  Trash2,
  Download,
  Undo,
  Redo,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'eraser' | 'line' | 'circle' | 'rectangle' | 'text';

interface Point {
  x: number;
  y: number;
}

interface DrawAction {
  tool: Tool;
  points: Point[];
  color: string;
  lineWidth: number;
  text?: string; // For text tool
}

export const InteractiveWhiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  // Khởi tạo canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw history
    redrawCanvas();
  }, []);

  // Redraw canvas from history
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all actions in history
    history.slice(0, historyStep).forEach((action) => {
      drawAction(ctx, action);
    });
  };

  // Draw a single action
  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.strokeStyle = action.color;
    ctx.lineWidth = action.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.tool === 'text' && action.text && action.points.length > 0) {
      // Draw text
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = action.color;
      ctx.font = `${action.lineWidth * 8}px sans-serif`;
      ctx.fillText(action.text, action.points[0].x, action.points[0].y);
    } else if (action.tool === 'pen' || action.tool === 'eraser') {
      if (action.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.beginPath();
      action.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    } else if (action.points.length === 2) {
      const [start, end] = action.points;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();

      if (action.tool === 'line') {
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (action.tool === 'rectangle') {
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (action.tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Start drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getMousePos(e);
    
    if (tool === 'text') {
      // Prompt for text input
      const text = prompt('Enter text:');
      if (text && text.trim()) {
        const newAction: DrawAction = {
          tool: 'text',
          points: [point],
          color,
          lineWidth,
          text: text.trim(),
        };
        setHistory((prev) => [...prev.slice(0, historyStep), newAction]);
        setHistoryStep((prev) => prev + 1);
        redrawCanvas();
      }
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);

    if (tool === 'pen' || tool === 'eraser') {
      const newAction: DrawAction = {
        tool,
        points: [point],
        color: tool === 'eraser' ? '#ffffff' : color,
        lineWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth,
      };
      setHistory((prev) => [...prev.slice(0, historyStep), newAction]);
      setHistoryStep((prev) => prev + 1);
    }
  };

  // Continue drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = getMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'eraser') {
      // Add point to current action
      setHistory((prev) => {
        const newHistory = [...prev];
        const currentAction = newHistory[newHistory.length - 1];
        if (currentAction) {
          currentAction.points.push(point);
        }
        return newHistory;
      });

      // Draw in real-time
      redrawCanvas();
    } else if (startPoint) {
      // For shapes, redraw with preview
      redrawCanvas();

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      if (tool === 'line') {
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      } else if (tool === 'rectangle') {
        ctx.strokeRect(
          startPoint.x,
          startPoint.y,
          point.x - startPoint.x,
          point.y - startPoint.y
        );
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(point.x - startPoint.x, 2) + Math.pow(point.y - startPoint.y, 2)
        );
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  // End drawing
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = getMousePos(e);

    if ((tool === 'line' || tool === 'rectangle' || tool === 'circle') && startPoint) {
      const newAction: DrawAction = {
        tool,
        points: [startPoint, point],
        color,
        lineWidth,
      };
      setHistory((prev) => [...prev.slice(0, historyStep), newAction]);
      setHistoryStep((prev) => prev + 1);
      redrawCanvas();
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  // Clear canvas
  const handleClear = () => {
    setHistory([]);
    setHistoryStep(0);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Undo
  const handleUndo = () => {
    if (historyStep > 0) {
      setHistoryStep((prev) => prev - 1);
      setTimeout(redrawCanvas, 0);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyStep < history.length) {
      setHistoryStep((prev) => prev + 1);
      setTimeout(redrawCanvas, 0);
    }
  };

  // Export as image
  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whiteboard_${new Date().toISOString()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // Redraw when history or step changes
  useEffect(() => {
    redrawCanvas();
  }, [historyStep]);

  const colors = ['#000000', '#FF0000', '#0000FF', '#00FF00'];

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border">
      {/* Toolbar - 2 rows để tránh tràn */}
      <div className="flex flex-col gap-1.5 p-2 border-b bg-muted/30">
        {/* Row 1: Drawing tools + Colors */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {/* Drawing tools */}
            <Button
              size="sm"
              variant={tool === 'pen' ? 'default' : 'outline'}
              onClick={() => setTool('pen')}
              title="Pen"
              className="h-7 w-7 p-0"
            >
              <Pen className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'eraser' ? 'default' : 'outline'}
              onClick={() => setTool('eraser')}
              title="Eraser"
              className="h-7 w-7 p-0"
            >
              <Eraser className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'line' ? 'default' : 'outline'}
              onClick={() => setTool('line')}
              title="Line"
              className="h-7 w-7 p-0"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'rectangle' ? 'default' : 'outline'}
              onClick={() => setTool('rectangle')}
              title="Rectangle"
              className="h-7 w-7 p-0"
            >
              <Square className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'circle' ? 'default' : 'outline'}
              onClick={() => setTool('circle')}
              title="Circle"
              className="h-7 w-7 p-0"
            >
              <Circle className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'text' ? 'default' : 'outline'}
              onClick={() => setTool('text')}
              title="Text"
              className="h-7 w-7 p-0"
            >
              <Type className="w-3.5 h-3.5" />
            </Button>

            <div className="w-px h-5 bg-border mx-0.5" />

            {/* Colors */}
            {colors.map((c) => (
              <button
                key={c}
                className={cn(
                  'w-5 h-5 rounded-full border-2 transition-all flex-shrink-0',
                  color === c ? 'border-primary scale-110' : 'border-muted-foreground/30'
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
          </div>

          {/* Action buttons - Undo/Redo only */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={historyStep === 0}
              title="Undo"
              className="h-7 w-7 p-0"
            >
              <Undo className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              disabled={historyStep === history.length}
              title="Redo"
              className="h-7 w-7 p-0"
            >
              <Redo className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Row 2: Size slider + Clear/Export */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs whitespace-nowrap">Size:</Label>
            <Slider
              value={[lineWidth]}
              onValueChange={([value]) => setLineWidth(value)}
              min={1}
              max={20}
              step={1}
              className="w-20"
            />
            <span className="text-xs font-mono w-5 text-center">{lineWidth}</span>
          </div>

          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleClear} 
              title="Clear"
              className="h-7 w-7 p-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleExport} 
              title="Export"
              className="h-7 w-7 p-0"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
};
