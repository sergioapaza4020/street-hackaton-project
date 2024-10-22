import getCanvas from './canvas/canvas';
import Vertex from './graphs/Vertex';

export function delay(ms: any) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export interface IPoint {
    x: number;
    y: number;
}

export function calculateDistance(point1: IPoint, point2: IPoint) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

export function drawCircle(x: number, y: number, radius: number) {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Failed to get 2D context');
    }
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.moveTo(x, y);
    ctx.fill();

}
export function getVertex(graph: Record<string, Vertex>, x: number, y: number) {
    let vertex = null;
    if (graph[`${x}_${y}`] == null) {
        graph[`${x}_${y}`] = new Vertex(`${x}_${y}`);
    } else {
        vertex = graph[`${x}_${y}`];
    }
    graph[`${x}_${y}`].setX(x);
    graph[`${x}_${y}`].setY(y);
    return graph[`${x}_${y}`];
}