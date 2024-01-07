

// Canvas
const canvas = document.querySelector("#canvas-wrapper");



// Scene
const scene = new THREE.Scene();

// Settings 
const fov = 95;
const nearDist = 0.1;
const farDist = 30000;
const sizes = {
	w: window.innerWidth,
	h: window.innerHeight
};

// Camera
const camera = new THREE.PerspectiveCamera(
	fov,
	sizes.w / sizes.h,
	nearDist,
	farDist
);
camera.position.set(0, 0, Math.round(farDist / 16));
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor("black");
renderer.setSize(sizes.w, sizes.h);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
canvas.appendChild(renderer.domElement);

// Custom shader
const uniforms = {
	u_time: { type: "f", value: 1.0 },
	u_resolution: { type: "v2", value: new THREE.Vector2() }
};
const vertexShader = document.querySelector("#vertex").textContent;
const fragmentShader = document.querySelector("#fragment").textContent;
const shaderMaterial = new THREE.ShaderMaterial({
	uniforms,
	vertexShader,
	fragmentShader,
	transparent: true
});

function updateUniforms() {
	uniforms.u_resolution.value.x = renderer.domElement.width;
	uniforms.u_resolution.value.y = renderer.domElement.height;
}
updateUniforms();


// Resizing
window.addEventListener("resize", () => {
	// Update sizes
	sizes.w = window.innerWidth;
	sizes.h = window.innerHeight;

	// Update camera
	camera.aspect = sizes.w / sizes.h;
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.w, sizes.h);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	
	updateUniforms();
});

// Particles
const count = 8000;
const particlesPosition = []; // Position in 3d world (x, y, z)

for (let i = 0; i < count; i++) {
	const dist = count * 0.4;

	const x = dist * 2 * Math.random() - dist;
	const y = dist * 2 * Math.random() - dist;
	const z = dist * 2 * Math.random() - dist;

	particlesPosition.push(x, y, z);
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute(
	"position",
	new THREE.Float32BufferAttribute(particlesPosition, 3)
);

const particlesTexture = new THREE.TextureLoader().load(
	"https://threejs.org/examples/textures/sprites/disc.png"
);
const particlesMaterial = new THREE.PointsMaterial({
	color: "hotpink",
	size: 20,
	sizeAttenuation: true,
	map: particlesTexture,
	// Have the particles without texture outline
	depthTest: false,
	blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// Typograpghy
const typoGroup = new THREE.Group();
const typoLoader = new THREE.FontLoader();
const typoSize = Math.max(
	sizes.w < 800 ? 1000 : 1200, 
	Math.round(sizes.w * 0.69)
);
const createTypo = (font) => {
	const word = '.';
	const typoProperties = {
		font: font,
		size: typoSize,
		height: 170
	};
	const textMesh = new THREE.Mesh();
	textMesh.geometry = new THREE.TextBufferGeometry(word, typoProperties);
	textMesh.geometry.center();
	textMesh.material = shaderMaterial;
	
	typoGroup.add(textMesh);
};
typoLoader.load(
	"https://threejs.org/examples/fonts/helvetiker_bold.typeface.json",
	createTypo
);
scene.add(typoGroup);

// Mouse over/touch effects
let mouseX = 0;
let mouseY = 0;
const mouseFX = {
	moveTypo(cX, cY) {
		mouseX = (cX / sizes.w) * 2 - 1;
		mouseY = -(cY / sizes.h) * 2 + 1;

		const c = 3;
		typoGroup.rotation.x = mouseY * c;
		typoGroup.rotation.y = mouseX * c;
		
		// Respond to these mouse movements and remove initial animation
		typoGroup.matrixAutoUpdate = false;
		typoGroup.updateMatrix();
	},
	moveParticles(cX, cY) {
		const c = 2;
		mouseX = (cX - sizes.w * 0.5) * c;
		mouseY = (cY - sizes.h * 0.5) * c;
	},
	onMouseMove(e) {
		mouseFX.moveTypo(e.clientX, e.clientY);
		mouseFX.moveParticles(e.clientX, e.clientY);
	},
	onTouchMove(e) {
		const touchX = e.changedTouches[0].clientX;
		const touchY = e.changedTouches[0].clientY;
		mouseFX.moveTypo(touchX, touchY);
		mouseFX.moveParticles(touchX, touchY);
	}
};
document.addEventListener("mousemove", mouseFX.onMouseMove);
document.addEventListener("touchmove", mouseFX.onTouchMove);

// Animate & Render
const clock = new THREE.Clock();

const tick = () => {
	const elapsedTime = clock.getElapsedTime();

	// Time the shader animation
	uniforms.u_time.value = elapsedTime;

	// Animate the particles + typo
	const rotX = Math.sin(elapsedTime * 0.02);
	const rotY = Math.sin(elapsedTime * 0.05);
	particles.rotation.x = rotX;
	particles.rotation.y = rotY;
	// Animate only on start
	typoGroup.rotation.x = rotX;
	typoGroup.rotation.y = rotY;

	// Animate the color
	const cAnim = Math.sin(elapsedTime * 0.25);
	// Based on rgb(49%, 30%, 88%)
	particlesMaterial.color.setRGB(0.29 + cAnim, 0.5 - cAnim, 0.68 + cAnim);

	// Animate camera movements
	const ease = 0.03;
	camera.position.x += (mouseX - camera.position.x) * ease;
	camera.position.y += (mouseY * -1 - camera.position.y) * ease;
	camera.lookAt(scene.position);
	
	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	requestAnimationFrame(tick);
};
tick();
