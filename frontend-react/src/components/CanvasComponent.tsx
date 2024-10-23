import { useEffect, useRef, useState } from 'react';
import json from '../utils/Potosi.json';
import getCanvas from '../utils/canvas/canvas';
import Vertex from '../utils/graphs/Vertex';
import { calculateDistance, drawCircle, getVertex } from '../utils/utils';

import { dijkstra } from '../utils/algorithms/dijkstra';

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
    const [selectedVertex, setSelectedVertex] = useState<Vertex | null>(null);
    const [hoveredVertex, setHoveredVertex] = useState<Vertex | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number, y: number, vertex: Vertex | null } | null>(null);
    const graph: Record<string, Vertex> = {};

    // apartado de funcionalidad con dijkstra ----------------------------------------------------------------
    const [startVertex, setStartVertex] = useState<Vertex | null>(null);
    const [endVertex, setEndVertex] = useState<Vertex | null>(null);
    const [shortestPath, setShortestPath] = useState<Vertex[]>([]);

    const handleFindShortestPath = () => {
        if (startVertex && endVertex) {
            const { path } = dijkstra(graph, startVertex, endVertex);
            setShortestPath(path);
        }
    };

    const handleSelectStart = (vertex: Vertex) => setStartVertex(vertex);
    const handleSelectEnd = (vertex: Vertex) => setEndVertex(vertex);
    // apartado de funcionalidad con dijkstra ----------------------------------------------------------------


    // Función para dibujar el canvas
    const drawCanvas = () => {
        
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
                ctx.strokeStyle = '#00f';
                ctx.lineWidth = 0.4;

                // Vinculamos las propiedades del JSON a los vértices
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
                            // Cambiar el color según el estado
                            const vertex = getVertex(graph, x, y);
                            if (vertex === hoveredVertex) {
                                ctx.fillStyle = 'green';  // Vértice hovered
                            } else if (vertex === selectedVertex) {
                                ctx.fillStyle = 'red';  // Vértice seleccionado
                            } else {
                                ctx.fillStyle = 'blue';  // Vértice normal
                            }
                            drawCircle(x, y, 1);

                            // Asignamos las propiedades del JSON al vértice
                            vertex?.setProperties(feature.properties);

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

                // Dibujar la ruta más corta
                if (shortestPath.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = 'green';
                    ctx.lineWidth = 2;
                    shortestPath.forEach((vertex, index) => {
                        const { x, y } = transFormPoint(vertex.getX(), vertex.getY());
                        if (index === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    });
                    ctx.stroke();
                }

                ctx.restore();
            }
        }
    };

    useEffect(() => {
        drawCanvas();
    }, [zoom, offset, hoveredVertex, selectedVertex]);

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
            let newOffsetX = event.clientX - dragStart.x;
            let newOffsetY = event.clientY - dragStart.y;

            // Aplicar límites en las 4 direcciones
            newOffsetX = Math.min(Math.max(newOffsetX, -1000), 1000);  // Limite horizontal
            newOffsetY = Math.min(Math.max(newOffsetY, -1000), 1000);  // Limite vertical

            setOffset({ x: newOffsetX, y: newOffsetY });
        }

        // Detectar si el mouse está sobre un vértice
        const canvas = canvasRef.current;
        if (canvas) {
            const canvasBounds = canvas.getBoundingClientRect();
            const mouseX = (event.clientX - canvasBounds.left - offset.x) / zoom;
            const mouseY = (event.clientY - canvasBounds.top - offset.y) / zoom;

            const foundVertex = Object.values(graph).find(vertex =>
                Math.abs(vertex.getX() - mouseX) < 5 && Math.abs(vertex.getY() - mouseY) < 5
            );

            if (foundVertex) {
                setHoveredVertex(foundVertex);  // Guardar el vértice hovered
                setTooltip({ x: event.clientX, y: event.clientY, vertex: foundVertex });  // Mostrar tooltip con datos del vértice
            } else {
                setHoveredVertex(null);
                setTooltip(null);
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleVertexClick = (vertex: Vertex) => {
        setSelectedVertex(vertex);
    };

    return (
        <div className="canvas">
            {/* Menú para seleccionar nodos */}
            <div>
                <label>Start Node: </label>
                <select onChange={(e) => handleSelectStart(graph[e.target.value])}>
                    <option value="">Select Start Node</option>
                    {Object.values(graph).map((vertex) => (
                        <option key={vertex.label} value={vertex.label}>
                            {vertex.label}
                        </option>
                    ))}
                </select>
                <label>End Node: </label>
                <select onChange={(e) => handleSelectEnd(graph[e.target.value])}>
                    <option value="">Select End Node</option>
                    {Object.values(graph).map((vertex) => (
                        <option key={vertex.label} value={vertex.label}>
                            {vertex.label}
                        </option>
                    ))}
                </select>
                <button onClick={handleFindShortestPath}>Find Shortest Path</button>
            </div>

            {/* Visualizar la ruta más corta */}
            <canvas ref={canvasRef} id="app" width={1024} height={720} /* otros eventos aquí */>
                {/* Dibujar el canvas */}
            </canvas>
        </div>
    );
};

export default CanvasComponent;
