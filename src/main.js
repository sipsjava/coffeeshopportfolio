import './style.scss'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Scene
const canvas = document.querySelector("#experience-canvas");
const sizes = {
    height: window.innerHeight,
    width: window.innerWidth
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, .1, 1000);
camera.position.set(-29.81365715721389, 7.860900199165037, -9.422209800727748);

const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: true 
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(-3.552940186065884, 5.370265500250291, 2.413349325517568);
controls.update();

// Loaders
const textureLoader = new THREE.TextureLoader();

// Model Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
.setPath('textures/skybox/night/')
.load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

// Texture Map
const textureMap = {
    1: {
        day: "/textures/day/TextureSet1Day.webp",
        night: "/textures/night/TextureSet1Night.webp"
    }, 
    2: {
        day: "/textures/day/TextureSet2Day.webp",
        night: "/textures/night/TextureSet2Night.webp"
    }, 
    3: {
        day: "/textures/day/TextureSet3Day.webp",
        night: "/textures/night/TextureSet3Night.webp"
    }, 
};

const loadedTextures = {
    day: {}, 
    night: {}
};

// Load day textures
Object.entries(textureMap).forEach(([key, paths]) => {
    const dayTexture = textureLoader.load(paths.day);
    dayTexture.flipY = false;
    dayTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTextures.day[key] = dayTexture;
});

// Load night textures
Object.entries(textureMap).forEach(([key, paths]) => {
    const nightTexture = textureLoader.load(paths.night);
    nightTexture.flipY = false;
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    loadedTextures.night[key] = nightTexture;
});

// Reusable textures 
const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1,
  opacity: 1,
  color: 0xfbfbfb,
  metalness: 0,
  roughness: 0,
  ior: 3,
  thickness: 0.01,
  specularIntensity: 1,
  envMap: environmentMap,
  envMapIntensity: 1,
  depthWrite: false,
  specularColor: 0xfbfbfb,
});

const imageLoader = new THREE.TextureLoader();
const screen = textureLoader.load('/textures/screen/laptop_screen.webp');
screen.colorSpace = THREE.SRGBColorSpace;
screen.flipY = false;

// Load model
loader.load("/models/coffee_shop_devfolio.glb", (glb) => {
    glb.scene.traverse((child) => {
        if(child.isMesh){
            Object.keys(textureMap).forEach((key) => {
                if(child.name.includes(key)){
                    const material = new THREE.MeshBasicMaterial({
                        map: loadedTextures.day[key]
                    });
                    child.material = material;
                }
            });

            if(child.name.includes("glass")){
                child.material = glassMaterial;
            }
            if(child.name.includes("screen")){
                child.material = new THREE.MeshBasicMaterial({map: screen});
            }
            if(child.name.includes("hitbox")){
                child.material = new THREE.MeshBasicMaterial({
                    visible: false                
                });            
            }
        }
    });
    scene.add(glb.scene);
});  

// Event Listeners
window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const render = () => {
    controls.update();

    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
};

render();