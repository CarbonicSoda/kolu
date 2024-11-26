import { KoluCanvas } from "./canvas";
import { Mat } from "../maths/matrix";
import { Scene } from "./scene";
import { Vec } from "../maths/vector";

//MO DEV test in wireframe first
export function render(koluCanvas: KoluCanvas, scene: Scene) {
	const canvas = koluCanvas.canvas;
	const context = koluCanvas.context;

	const width = canvas.width;
	const height = canvas.height;
	const camera = scene.camera;

	const translate = Mat.id(3).homo(camera.pos.mul(-1), [0, 0, 0, 1]);

	const [sA, sB, sC] = camera.rot.map((angle) => -Math.sin(angle));
	const [cA, cB, cC] = camera.rot.map((angle) => Math.cos(angle));
	const yaw = new Mat([cA, -sA, 0], [sA, cA, 0], [0, 0, 1]);
	const pitch = new Mat([cB, 0, sB], [0, 1, 0], [-sB, 0, cB]);
	const roll = new Mat([1, 0, 0], [0, cC, -sC], [0, sC, cC]);
	const rotate = Mat.mul(yaw, Mat.mul(pitch, roll));

	const frameAlign = Mat.mul(rotate, translate);

	const dist = height / (2 * Math.tan(0.5 * camera.fov));
	const project = new Mat([dist, 0, 0, 0], [0, dist, 0, 0], [0, 0, 1, 0]);

	const transform = Mat.mul(project, frameAlign);

	const perspTris = [];
	const zBuffer: number[] = [];
	//MO TODO curr triangles is only primitive
	for (const triangle of scene.triangles) {
		if (triangle === null) continue;

		const projVertices = triangle.vertices.map((vertex) =>
			transform.apply(vertex.homo()),
		);

		//MO TODO culling

		// if (
		// 	projVertices.some((vertex) =>
		// 		vertex.some((c) => Math.abs(c) > 1),
		// 	)
		// )
		// 	continue;

		perspTris.push({
			zBi: zBuffer.length,
			vertices: projVertices.map((vertex) => vertex.unhomo()),
			fill: triangle.fill,
		});
		zBuffer.push(
			Math.min(...projVertices.map((vertex) => vertex[2])),
		);
	}

	context.clearRect(0, 0, width, height);
	for (const { vertices, fill } of perspTris.sort(
		({ zBi: zBi1 }, { zBi: zBi2 }) => zBuffer[zBi2] - zBuffer[zBi1],
	)) {
		//MO TODO optimize
		const [[x1, y1], [x2, y2], [x3, y3]] = vertices;
		context.fillStyle = fill;
		context.beginPath();
		context.moveTo(0.5 * width + x1, 0.5 * height - y1);
		context.lineTo(0.5 * width + x2, 0.5 * height - y2);
		context.lineTo(0.5 * width + x3, 0.5 * height - y3);
		context.lineTo(0.5 * width + x1, 0.5 * height - y1);
		// context.fill();
		//MO DEV wireframe for testing
		context.stroke();
	}
}