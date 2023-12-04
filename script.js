const CANVAS_SIZE = 280;
const CANVAS_SCALE = 0.5;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clearButton = document.getElementById("clear-button");

let isMouseDown = false;
let hasIntroText = true;
let lastX = 0;
let lastY = 0;

// Load our model.
const sess = new onnx.InferenceSession();
const loadingModelPromise = sess.loadModel("./onnx_model.onnx");

// Add 'Draw a number here!' to the canvas.
ctx.lineWidth = 28;
ctx.lineJoin = "round";
ctx.font = "28px sans-serif";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillStyle = "#212121";
ctx.fillText("Loading...", CANVAS_SIZE / 2, CANVAS_SIZE / 2);

// Set the line color for the canvas.
ctx.strokeStyle = "#212121";

function clearCanvas() {
	ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	for (let i = 0; i < 10; i++) {
		const element = document.getElementById(`prediction-${i}`);
		element.className = "prediction-col";
		element.children[0].children[0].style.height = "0";
	}
}

function drawLine(fromX, fromY, toX, toY) {
	// Draws a line from (fromX, fromY) to (toX, toY).
	ctx.beginPath();
	ctx.moveTo(fromX, fromY);
	ctx.lineTo(toX, toY);
	ctx.closePath();
	ctx.stroke();
	updatePredictions();
}

async function updatePredictions() {
	// Get the predictions for the canvas data.
	const imgData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	const input = new onnx.Tensor(new Float32Array(imgData.data), "float32");

	const outputMap = await sess.run([input]);
	const outputTensor = outputMap.values().next().value;
	const predictions = outputTensor.data;
	const maxPrediction = Math.max(...predictions);

	for (let i = 0; i < predictions.length; i++) {
		const element = document.getElementById(`prediction-${i}`);
		element.children[0].children[0].style.height = `${predictions[i] * 100}%`;
		element.className =
			predictions[i] === maxPrediction
				? "prediction-col top-prediction"
				: "prediction-col";
	}
}

function canvasMouseDown(event) {
	isMouseDown = true;
	if (hasIntroText) {
		clearCanvas();
		hasIntroText = false;
	}
	const x = event.offsetX / CANVAS_SCALE;
	const y = event.offsetY / CANVAS_SCALE;

	// To draw a dot on the mouse down event, we set laxtX and lastY to be
	// slightly offset from x and y, and then we call `canvasMouseMove(event)`,
	// which draws a line from (laxtX, lastY) to (x, y) that shows up as a
	// dot because the difference between those points is so small. However,
	// if the points were the same, nothing would be drawn, which is why the
	// 0.001 offset is added.
	lastX = x + 0.001;
	lastY = y + 0.001;
	canvasMouseMove(event);
}

function canvasMouseMove(event) {
	const x = event.offsetX / CANVAS_SCALE;
	const y = event.offsetY / CANVAS_SCALE;
	if (isMouseDown) {
		drawLine(lastX, lastY, x, y);
	}
	lastX = x;
	lastY = y;
}

function bodyMouseUp() {
	isMouseDown = false;
}

function bodyMouseOut(event) {
	// We won't be able to detect a MouseUp event if the mouse has moved
	// ouside the window, so when the mouse leaves the window, we set
	// `isMouseDown` to false automatically. This prevents lines from
	// continuing to be drawn when the mouse returns to the canvas after
	// having been released outside the window.
	if (!event.relatedTarget || event.relatedTarget.nodeName === "HTML") {
		isMouseDown = false;
	}
}

function touchstart(event) {
	canvasMouseDown(event.touches[0]);
}
function touchmove(event) {
	canvasMouseMove(event.touches[0]);
	event.preventDefault();
}
function touchend() {
	bodyMouseUp();
}

loadingModelPromise.then(() => {
	canvas.addEventListener("touchstart", touchstart);
	canvas.addEventListener("touchmove", touchmove);
	canvas.addEventListener("touchend", touchend);
	canvas.addEventListener("mousedown", canvasMouseDown);
	canvas.addEventListener("mousemove", canvasMouseMove);

	// var canvas = document.getElementById("canvas");
	// var context = canvas.getContext("2d");
	// var isIdle = true;

	// function drawstart(event) {
	// 	context.beginPath();
	// 	context.moveTo(
	// 		event.pageX - canvas.offsetLeft,
	// 		event.pageY - canvas.offsetTop
	// 	);
	// 	isIdle = false;
	// }
	// function drawmove(event) {
	// 	if (isIdle) return;
	// 	context.lineTo(
	// 		event.pageX - canvas.offsetLeft,
	// 		event.pageY - canvas.offsetTop
	// 	);
	// 	context.stroke();
	// 	updatePredictions();
	// }
	// function drawend(event) {
	// 	if (isIdle) return;
	// 	drawmove(event);
	// 	isIdle = true;
	// }

	// canvas.addEventListener("mousedown", drawstart, false);
	// canvas.addEventListener("mousemove", drawmove, false);
	// canvas.addEventListener("mouseup", drawend, false);

	document.body.addEventListener("mouseup", bodyMouseUp);
	document.body.addEventListener("mouseout", bodyMouseOut);
	clearButton.addEventListener("mousedown", clearCanvas);

	ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	ctx.fillText("Draw a number here!", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
});

// window.addEventListener(
// 	"load",
// 	function () {
// 		// get the canvas element and its context
// 		var canvas = document.getElementById("sketchpad");
// 		var context = canvas.getContext("2d");
// 		var isIdle = true;

// 	},
// 	false
// );
