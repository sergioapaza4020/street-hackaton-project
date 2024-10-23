import { useEffect, useRef, useState } from 'react';
import json from '../utils/Potosi.json';
import Vertex from '../utils/graphs/Vertex';
import { calculateDistance, drawCircle, getVertex } from '../utils/utils';

const totalScale = 4000;
const positionX = 500;
const positionY = 450;
let integerX: any = null;
let integerY: any = null;

const scaleX = (lon: number, canvasWidth: number) => (lon + 180) * (canvasWidth / 360) * totalScale;
const scaleY = (lat: number, canvasHeight: number) => (90 - lat) * (canvasHeight / 180) * totalScale;

function transFormPoint(firstCoord: number, secondCoord: number, canvasWidth: number, canvasHeight: number) {
    const coorsX = scaleX(firstCoord, canvasWidth);
    const coorsY = scaleY(secondCoord, canvasHeight);
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
    const [selectedVertex, setSelectedVertex] = useState<{ x: number, y: number } | null>(null);
    const [isHoveringVertex, setIsHoveringVertex] = useState(false);
    const [hoveredVertex, setHoveredVertex] = useState<Vertex | null>(null);

    const graph: Record<string, Vertex> = {};

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const canvasWidth = canvas.width || 1024;
                const canvasHeight = canvas.height || 720;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                ctx.save();
                if (zoom > 1) {
                    ctx.translate(offset.x, offset.y);
                }
                ctx.scale(zoom, zoom);
                ctx.strokeStyle = '#00f';
                ctx.lineWidth = 0.4;
                json.features.forEach((feature: any) => {
                    if (feature.geometry.type === 'LineString') {
                        ctx.beginPath();
                        feature.geometry.coordinates.forEach((line: number[], index: number) => {
                            const [firstCoord, secondCoord] = line;
                            const { x, y } = transFormPoint(firstCoord, secondCoord, canvasWidth, canvasHeight);
                            if (index === 0) {
                                ctx.moveTo(x, y);
                            } else {
                                ctx.lineTo(x, y);
                            }

                            if (selectedVertex && Math.abs(selectedVertex.x - x) < 5 && Math.abs(selectedVertex.y - y) < 5) {
                                if (selectedVertex === hoveredVertex) {
                                    ctx.fillStyle = '#0f0';
                                }
                                ctx.fillStyle = '#f00';
                                drawCircle(x, y, 2.5);
                            } else {
                                ctx.fillStyle = '#00f';
                                drawCircle(x, y, 1);
                            }

                            const vertex = getVertex(graph, x, y);
                            if (index + 1 < feature.geometry.coordinates.length) {
                                const next = feature.geometry.coordinates[index + 1];
                                const [nextFirstCoord, nextSecondCoord] = next;
                                const { x: x2, y: y2 } = transFormPoint(nextFirstCoord, nextSecondCoord, canvasWidth, canvasHeight);
                                const nextVertex = getVertex(graph, x2, y2);
                                vertex?.addNeighbor(nextVertex, calculateDistance({ x, y }, { x: x2, y: y2 }));
                            }
                            if (index > 0) {
                                const prev = feature.geometry.coordinates[index - 1];
                                const [prevFirstCoord, prevSecondCoord] = prev;
                                const { x: x2, y: y2 } = transFormPoint(prevFirstCoord, prevSecondCoord, canvasWidth, canvasHeight);
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
    }, [zoom, offset, selectedVertex]);

    const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setZoom(parseFloat(event.target.value));
    };

    // const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    //     const canvas = canvasRef.current;
    //     if (canvas) {
    //         const canvasBounds = canvas.getBoundingClientRect();

    //         const mouseX = (event.clientX - canvasBounds.left - offset.x) / zoom;
    //         const mouseY = (event.clientY - canvasBounds.top - offset.y) / zoom;

    //         const foundVertex = Object.values(graph).find(vertex =>
    //             Math.abs(vertex.x - mouseX) < 5 && Math.abs(vertex.y - mouseY) < 5
    //         );

    //         if (foundVertex) {
    //             setSelectedVertex({ x: foundVertex.x, y: foundVertex.y });
    //         } else {
    //             setSelectedVertex(null);
    //         }
    //     }
    //     console.log(graph)
    // };

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({
            x: event.clientX - offset.x,
            y: event.clientY - offset.y,
        });

        const canvas = canvasRef.current;
        if (canvas) {
            const canvasBounds = canvas.getBoundingClientRect();

            const clickX = (event.clientX - canvasBounds.left - offset.x) / zoom;
            const clickY = (event.clientY - canvasBounds.top - offset.y) / zoom;

            const foundVertex = Object.values(graph).find(vertex =>
                Math.abs(vertex.x - clickX) < 5 && Math.abs(vertex.y - clickY) < 5
            );

            if (foundVertex) {
                setSelectedVertex({ x: foundVertex.x, y: foundVertex.y });
            } else {
                setSelectedVertex(null);
            }
        }
        console.log(graph)
    };

    // const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    //     if (isDragging) {
    //         const canvas = canvasRef.current;
    //         if (canvas) {
    //             const canvasWidth = canvas.width || 1024;
    //             const canvasHeight = canvas.height || 720;

    //             let newOffsetX = event.clientX - dragStart.x;
    //             let newOffsetY = event.clientY - dragStart.y;

    //             const maxOffsetX = canvasWidth * (zoom - 1);
    //             const maxOffsetY = canvasHeight * (zoom - 1);

    //             if (newOffsetX > 0) newOffsetX = 0;
    //             if (newOffsetX < -maxOffsetX) newOffsetX = -maxOffsetX;

    //             if (newOffsetY > 0) newOffsetY = 0;
    //             if (newOffsetY < -maxOffsetY) newOffsetY = -maxOffsetY;

    //             setOffset({
    //                 x: newOffsetX,
    //                 y: newOffsetY,
    //             });
    //         }
    //     }

    //     Detectar si el mouse está sobre un vértice
    //     const canvas = canvasRef.current;
    //     if (canvas) {
    //         const canvasBounds = canvas.getBoundingClientRect();
    //         Obtener las coordenadas del mouse dentro del canvas teniendo en cuenta el zoom y el offset
    //         const mouseX = (event.clientX - canvasBounds.left - offset.x) / zoom;
    //         const mouseY = (event.clientY - canvasBounds.top - offset.y) / zoom;

    //         Verificar si el mouse está cerca de algún vértice
    //         const foundVertex = Object.values(graph).find(vertex =>
    //             Math.abs(vertex.x - mouseX) < 5 && Math.abs(vertex.y - mouseY) < 5
    //         );

    //         if (foundVertex) {
    //             setIsHoveringVertex(true);
    //         } else {
    //             setIsHoveringVertex(false);
    //         }
    //     }
    // };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            const canvas = canvasRef.current;
            if (canvas) {
                const canvasWidth = canvas.width || 1024;
                const canvasHeight = canvas.height || 720;

                let newOffsetX = event.clientX - dragStart.x;
                let newOffsetY = event.clientY - dragStart.y;

                const maxOffsetX = canvasWidth * (zoom - 1);
                const maxOffsetY = canvasHeight * (zoom - 1);

                if (newOffsetX > 0) newOffsetX = 0;
                if (newOffsetX < -maxOffsetX) newOffsetX = -maxOffsetX;

                if (newOffsetY > 0) newOffsetY = 0;
                if (newOffsetY < -maxOffsetY) newOffsetY = -maxOffsetY;

                setOffset({
                    x: newOffsetX,
                    y: newOffsetY,
                });
            }
        }

        const canvas = canvasRef.current;
        if (canvas) {
            const canvasBounds = canvas.getBoundingClientRect();
            const mouseX = (event.clientX - canvasBounds.left - offset.x) / zoom;
            const mouseY = (event.clientY - canvasBounds.top - offset.y) / zoom;

            const foundVertex = Object.values(graph).find(vertex =>
                Math.abs(vertex.x - mouseX) < 5 && Math.abs(vertex.y - mouseY) < 5
            );

            if (foundVertex) {
                setHoveredVertex(foundVertex);  // Guardar el vértice "hovered"
            } else {
                setHoveredVertex(null);  // No hay ningún vértice "hovered"
            }
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
                style={{ cursor: isDragging ? 'grabbing' : isHoveringVertex ? 'pointer' : 'grab' }}
            ></canvas>
        </div>
    );
};

export default CanvasComponent;
