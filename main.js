import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import gsap from "gsap";
import * as dat from "dat.gui";
// const gui = new dat.GUI();
// var sLightGUI = gui.addFolder("Sport Light");

//===================================================== SHADERS
const vertexShader = `
varying vec2 vUv;
varying float vDistance;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vDistance = -mvPosition.z; 
  }
`;

const fragmentShader = `
  uniform sampler2D cityTexture;
  varying vec2 vUv;
  uniform float opacity;
  varying float vDistance;

  void main() {
    float opacityT = clamp(5.4 - (vDistance / 2.0), 0.0, 1.0);
    vec4 color = texture2D(cityTexture, vUv);
    color.a *= opacityT*opacity;

    gl_FragColor = color; // Adjust the color as needed
  }
`;

//===================================================== Variables
let canvas,
  gltfloader = new GLTFLoader(),
  WIDTH = document.body.clientWidth,
  GlobalModel,
  HEIGHT = window.innerHeight;

canvas = document.querySelector(".canvas");
gltfloader = new GLTFLoader();

//===================================================== Create a WebGL renderer
var renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  powerPreference: "high-performance",
  alpha: true,
  antialias: true,
  stencil: false,
  depth: true,
});
renderer.setSize(document.body.clientWidth, window.innerHeight);
//===================================================== Create an empty scene
var scene = new THREE.Scene();
// scene.background=new THREE.TextureLoader().load("/city_bg.jpg");
//===================================================== Create a perpsective camera
var camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.001, 1000);
camera.position.z = 0.5;

//===================================================== Orbit Controls
// const orbitControls = new OrbitControls(camera, canvas);
// orbitControls.enableDamping = true;
//===================================================== Resize
window.addEventListener("resize", function () {
  renderer.setSize(document.body.clientWidth, window.innerHeight);
  camera.aspect = document.body.clientWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

//===================================================== Create a mesh
// const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
// const boxMaterial = new THREE.MeshBasicMaterial({ color: "red" });
// const box = new THREE.Mesh(boxGeometry, boxMaterial);
// scene.add(box);

gltfloader.load("src/GLTF/SamadLogo/model.gltf", (gltf) => {
  const model = gltf.scene;
  GlobalModel= gltf.scene;
  model.scale.set(1.8, 1.8, 1.8)
  const colorTexture = new THREE.TextureLoader().load(
    "src/GLTF/SamadLogo/texture.jpg"
  );
  model.traverse((child) => {
    if (child.isMesh) {
      // child.material.map = colorTexture;
      child.material.metalness = 0;
      child.material.roughness = 1.5;
    }
  });
  const boundingBox = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  model.position.sub(center);
  model.rotation.x=0.36;
  scene.add(model);
  tl.to(GlobalModel.position,{z:-0.15, duration:1},'-=4')
  tl.to(GlobalModel.rotation,{y:-0.15, duration:1},'-=4')
});

//===================================================== Create a point light in our scene
var sportLightObj = {
  intensity: 12,
  distance: 1.5,
  angle:0.33,
  penumbra:0.0,
  decay:1
};
// sLightGUI.add(sportLightObj, "intensity", 0, 100).onChange((e)=>{sportLightObj.intensity=e});
// sLightGUI.add(sportLightObj, "distance", 0, 10).onChange((e)=>{sportLightObj.distance=e});
// sLightGUI.add(sportLightObj, "angle", 0, Math.PI / 8).onChange((e)=>{sportLightObj.angle=e});
// sLightGUI.add(sportLightObj, "penumbra", 0.0, 1.0).onChange((e)=>{sportLightObj.penumbra=e});
// sLightGUI.add(sportLightObj, "decay", 1.0, 3).onChange((e)=>{sportLightObj.decay=e});
var sportLight = new THREE.SpotLight(
  new THREE.Color("white"),
  sportLightObj.intensity,
  sportLightObj.distance,
  sportLightObj.angle,
  sportLightObj.penumbra,
  sportLightObj.decay
);
var lightHelper = new THREE.SpotLightHelper(sportLight);
sportLight.position.set(0, 1.5, 0.85 );
sportLight.rotation.x = 1.06;
scene.add(sportLight);
let tl = gsap.timeline({paused:true})
tl.to(sportLight.position,{y:0.65, duration:5});

//===================================================== Animate

const clock = new THREE.Clock();

function Animation() {
  const elapsedTime = clock.getElapsedTime();
  updateLight();
  renderer.render(scene, camera);
  requestAnimationFrame(Animation);
}

Animation();
//===================================================== TransformControls

function TControl(name, type = "P", group = true) {
  let tControl = new TransformControls(camera, renderer.domElement);
  tControl.addEventListener("dragging-changed", (event) => {
    orbitControls.enabled = !event.value;
  });
  tControl.attach(name);
  scene.add(tControl);

  tControl.addEventListener("change", () => {
    // The object's position has changed
    const newPosition = name.position;
    const newRotate = name.rotation;
    const newScale = name.scale;
    type == "R"
      ? (console.log("New Rotation:", {
          x: parseFloat(newRotate.x.toFixed(2)),
          y: parseFloat(newRotate.y.toFixed(2)),
          z: parseFloat(newRotate.z.toFixed(2)),
        }),
        tControl.setMode("rotate"))
      : type == "S"
      ? (console.log("New Scale:", {
          x: parseFloat(newScale.x.toFixed(2)),
          y: parseFloat(newScale.y.toFixed(2)),
          z: parseFloat(newScale.z.toFixed(2)),
        }),
        tControl.setMode("scale"))
      : (console.log("New Position:", {
          x: parseFloat(newPosition.x.toFixed(2)),
          y: parseFloat(newPosition.y.toFixed(2)),
          z: parseFloat(newPosition.z.toFixed(2)),
        }),
        tControl.setMode("translate"));
  });
}
//===================================================== Debugger

const axesHelper = new THREE.AxesHelper(1000); // Adjust the size as needed
const gridHelper = new THREE.GridHelper(10, 10); // Parameters: size, divisions

// scene.add(axesHelper, gridHelper);

//===================================================== Other function
function updateLight() {
  sportLight.intensity = sportLightObj.intensity;
  sportLight.distance = sportLightObj.distance;
  sportLight.angle = sportLightObj.angle;
  sportLight.penumbra = sportLightObj.penumbra;
  sportLight.decay = sportLightObj.decay;
}
const track = document.querySelector(".canvasParent")
window.addEventListener("scroll", function (event) {
  const trackHeight = track.offsetHeight;
  const windowHeight = window.innerHeight;
  const progress =
    (window.pageYOffset - track.offsetTop) / (trackHeight - windowHeight);
  console.log("progress:",progress);
  tl.progress(progress);
});