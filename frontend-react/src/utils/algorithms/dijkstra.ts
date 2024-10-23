import Vertex from '../graphs/Vertex';

interface Result {
    distance: number;
    path: Vertex[];
}

export function dijkstra(graph: Record<string, Vertex>, start: Vertex, end: Vertex): Result {
    const distances: Record<string, number> = {};
    const previous: Record<string, Vertex | null> = {};
    const queue: Vertex[] = [];

    // Inicializar las distancias y la cola
    for (const vertexLabel in graph) {
        distances[vertexLabel] = Infinity;
        previous[vertexLabel] = null;
    }
    distances[start.label] = 0;
    queue.push(start);

    while (queue.length > 0) {
        // Obtener el nodo con la distancia más pequeña
        const current = queue.sort((a, b) => distances[a.label] - distances[b.label])[0];
        queue.splice(queue.indexOf(current), 1);

        // Si llegamos al nodo destino, detenemos la búsqueda
        if (current === end) {
            const path: Vertex[] = [];
            let vertex: Vertex | null = end;
            while (vertex) {
                path.unshift(vertex);
                vertex = previous[vertex.label];
            }
            return { distance: distances[end.label], path };
        }

        // Explorar los vecinos
        current.getNeighbors().forEach(edge => {
            const neighbor = edge.destination!;
            const alt = distances[current.label] + (edge.weight as number);

            if (alt < distances[neighbor.label]) {
                distances[neighbor.label] = alt;
                previous[neighbor.label] = current;
                queue.push(neighbor);
            }
        });
    }

    return { distance: Infinity, path: [] };
}
