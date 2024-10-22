import { useEffect, useRef, useState } from 'react';
import json from '../utils/Potosi.json';
import getCanvas from '../utils/canvas/canvas';
import Vertex from '../utils/graphs/Vertex';
import { calculateDistance, drawCircle, getVertex } from '../utils/utils';

const totalScale = 4000;
const positionX = 500;
const positionY = 450;
let integerX: any = null;
let integerY: any = null;
const scaleX = (lon: number) => (lon + 180) * (getCanvas().width / 360) * totalScale;
const scaleY = (lat: number) => (90 - lat) * (getCanvas().height / 180) * totalScale;

function transFormPoint(firstCoord: number, secondCoord: number) {
    const coorsX = scaleX(firstCoord);
    const coorsY = scaleY(secondCoord);
    if (integerX == null && integerY == null) {
        integerX = Math.floor(coorsX);
        integerY = Math.floor(coorsY);
    }
    const x = coorsX - integerX + positionX;
    const y = coorsY - integerY + positionY;
    return { x, y };
}

const CanvasComponent: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.save();
                if (zoom > 1) {
                    ctx.translate(offset.x, offset.y);
                }
                ctx.scale(zoom, zoom);
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 0.4;
                const graph: Record<string, Vertex> = {};
                json.features.forEach((feature: any) => {
                    if (feature.geometry.type === 'LineString') {
                        ctx.beginPath();
                        feature.geometry.coordinates.forEach((line: number[], index: number) => {
                            const [firstCoord, secondCoord] = line;
                            const { x, y } = transFormPoint(firstCoord, secondCoord);
                            if (index === 0) {
                                ctx.moveTo(x, y);
                            } else {

                                ctx.lineTo(x, y);
                            }
                            drawCircle(x, y, 0.4);
                            const vertex = getVertex(graph, x, y);
                            if (index + 1 < feature.geometry.coordinates.length) {
                                const next = feature.geometry.coordinates[index + 1];
                                const [firstCoord, secondCoord] = next;
                                const { x: x2, y: y2 } = transFormPoint(firstCoord, secondCoord);
                                const nextVertex = getVertex(graph, x2, y2);
                                vertex?.addNeighbor(nextVertex, calculateDistance({ x, y }, { x: x2, y: y2 }));
                            }
                            if (index > 0) {
                                const prev = feature.geometry.coordinates[index - 1];
                                const [firstCoord, secondCoord] = prev;
                                const { x: x2, y: y2 } = transFormPoint(firstCoord, secondCoord);
                                const prevVertex = getVertex(graph, x2, y2);
                                vertex?.addNeighbor(prevVertex, calculateDistance({ x, y }, { x: x2, y: y2 }));
                            }
                        });
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }
        }
    }, [zoom, offset]);

    const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setZoom(parseFloat(event.target.value));
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({
            x: event.clientX - offset.x,
            y: event.clientY - offset.y,
        });
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            setOffset({
                x: event.clientX - dragStart.x,
                y: event.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className='canvas'>
            <div>
                <input id="zoomRange" type="range" min="1" max="5" step="0.1" value={zoom} onChange={handleZoomChange} />
                <span> {zoom}x</span>
            </div>
            <canvas
                ref={canvasRef}
                id="app"
                width={1024}
                height={720}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{cursor: isDragging ? 'grabbing' : 'grab'}}
            ></canvas>
        </div>
    );
};

export default CanvasComponent;