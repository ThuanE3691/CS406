const CANVAS_SIZE = 280;
const CANVAS_SCALE = 0.5;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clearButton = document.getElementById("clear-button");

let isDrawing = false;
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

function clearCanvas() {
	ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	for (let i = 0; i < 10; i++) {
		const element = document.getElementById(`prediction-${i}`);
		element.className = "prediction-col";
		element.children[0].children[0].style.height = "0";
	}
}

function drawLine(fromX, fromY, toX, toY) {
	ctx.beginPath();
	ctx.moveTo(fromX, fromY);
	ctx.lineTo(toX, toY);
	ctx.closePath();
	ctx.stroke();
	updatePredictions();
}

function canvasMouseDown(event) {
	isDrawing = true;
	if (hasIntroText) {
		clearCanvas();
		hasIntroText = false;
	}
	const x = event.offsetX / CANVAS_SCALE;
	const y = event.offsetY / CANVAS_SCALE;

	lastX = x + 0.001;
	lastY = y + 0.001;
	canvasMouseMove(event);
}

function canvasMouseMove(event) {
	const x = event.offsetX / CANVAS_SCALE;
	const y = event.offsetY / CANVAS_SCALE;
	if (isDrawing) {
		drawLine(lastX, lastY, x, y);
	}
	lastX = x;
	lastY = y;
}

function bodyMouseUp() {
	isDrawing = false;
}

function bodyMouseOut(event) {
	if (!event.relatedTarget || event.relatedTarget.nodeName === "HTML") {
		isDrawing = false;
	}
}

loadingModelPromise.then(() => {
	canvas.addEventListener("touchstart", handleStart);
	canvas.addEventListener("touchend", handleEnd);
	canvas.addEventListener("touchcancel", handleCancel);
	canvas.addEventListener("touchmove", handleMove);

	canvas.addEventListener("mousedown", canvasMouseDown);
	canvas.addEventListener("mousemove", canvasMouseMove);

	document.body.addEventListener("mouseup", bodyMouseUp);
	document.body.addEventListener("mouseout", bodyMouseOut);
	clearButton.addEventListener("mousedown", clearCanvas);

	ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	ctx.fillText("Draw a number here!", CANVAS_SIZE / 2, CANVAS_SIZE / 2);
});

const ongoingTouches = [];

function handleStart(evt) {
	evt.preventDefault();
	const touches = evt.changedTouches;
	offsetX = canvas.getBoundingClientRect().left;
	offsetY = canvas.getBoundingClientRect().top;
	for (let i = 0; i < touches.length; i++) {
		ongoingTouches.push(copyTouch(touches[i]));
	}
}

function handleMove(evt) {
	evt.preventDefault();
	const touches = evt.changedTouches;
	for (let i = 0; i < touches.length; i++) {
		const idx = ongoingTouchIndexById(touches[i].identifier);
		if (idx >= 0) {
			ctx.beginPath();
			ctx.moveTo(
				ongoingTouches[idx].clientX - offsetX,
				ongoingTouches[idx].clientY - offsetY
			);
			ctx.lineTo(touches[i].clientX - offsetX, touches[i].clientY - offsetY);
			ctx.closePath();
			ctx.stroke();
			ongoingTouches.splice(idx, 1, copyTouch(touches[i])); // swap in the new touch record

			updatePredictions();
		}
	}
}

function handleEnd(evt) {
	evt.preventDefault();
	const touches = evt.changedTouches;
	for (let i = 0; i < touches.length; i++) {
		let idx = ongoingTouchIndexById(touches[i].identifier);
		if (idx >= 0) {
			ongoingTouches.splice(idx, 1); // remove it; we're done
		}
	}
}

function handleCancel(evt) {
	evt.preventDefault();
	const touches = evt.changedTouches;
	for (let i = 0; i < touches.length; i++) {
		let idx = ongoingTouchIndexById(touches[i].identifier);
		ongoingTouches.splice(idx, 1); // remove it; we're done
	}
}

function copyTouch({ identifier, clientX, clientY }) {
	return { identifier, clientX, clientY };
}

function ongoingTouchIndexById(idToFind) {
	for (let i = 0; i < ongoingTouches.length; i++) {
		const id = ongoingTouches[i].identifier;
		if (id === idToFind) {
			return i;
		}
	}
	return -1; // not found
}
