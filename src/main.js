import "./style.scss";
import * as THREE from "three";
import { OrbitControls } from "./utils/OrbitControls.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import gsap from "gsap";

const sinkFans = [];
const acFan = [];
let currentHovered = null;
const giantBean = [];
let currentIntersects = [];
const raycasterObjects = [];
const hoverObjects = [];
const socialLinks = {
  github: "https://github.com/sipsjava",
  linkedin: "https://www.linkedin.com/in/britneyannbeall/",
};
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let isModalOpen = false;

// Scene
const canvas = document.querySelector("#experience-canvas");
const sizes = {
  height: window.innerHeight,
  width: window.innerWidth,
};

const modals = {
  github: document.querySelector(".modal.github"),
  about: document.querySelector(".modal.about"),
  email: document.querySelector(".modal.email"),
};

let touchHappened = false;
document.querySelectorAll(".modal-exit-button").forEach((button) => {
  button.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      touchHappened = true;
      const modal = e.target.closest(".modal");
      hideModal(modal);
    },
    { passive: false }
  );

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    if (touchHappened) {
      touchHappened = false;
      return;
    }
    const modal = e.target.closest(".modal");
    hideModal(modal);
  });
});

const showModal = (modal) => {
  isModalOpen = true;
  modal.style.display = "block";
  controls.enabled = false;
  if (currentHovered) {
    playHoverAnimation(currentHovered, false);
    currentHovered = null;
  }
  document.body.style.cursor = "default";
};

const hideModal = (modal) => {
  modal.style.display = "none";
  isModalOpen = false;
  controls.enabled = true;
};

window.addEventListener("mousemove", (e) => {
  touchHappened = false;
  pointer.x = (e.clientX / sizes.width) * 2 - 1;
  pointer.y = -(e.clientY / sizes.height) * 2 + 1;
});

window.addEventListener(
  "touchstart",
  (e) => {
    if (isModalOpen) return;
    e.preventDefault();
    pointer.x = (e.touches[0].clientX / sizes.width) * 2 - 1;
    pointer.y = -(e.touches[0].clientY / sizes.height) * 2 + 1;
  },
  { passive: false }
);

window.addEventListener(
  "touchend",
  (e) => {
    e.preventDefault();
    if (isModalOpen) return;
    handleRaycasterInteraction();
  },
  { passive: false }
);

function handleRaycasterInteraction() {
  if (currentIntersects.length > 0) {
    const object = currentIntersects[0].object;
    Object.entries(socialLinks).forEach(([key, url]) => {
      if (object.name.includes(key)) {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
        newWindow.target = "_blank";
        newWindow.rel = "noopener noreferrer";
      }
    });

    if (object.name.includes("email")) {
      showModal(modals.email);
    }
  }
}

window.addEventListener("click", handleRaycasterInteraction);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(-29.81365715721389, 7.860900199165037, -9.422209800727748);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(-3.552940186065884, 5.370265500250291, 2.413349325517568);
controls.minPolarAngle = Math.PI / 3;
controls.maxPolarAngle = Math.PI / 2;
controls.minAzimuthAngle = -10;
controls.minDistance = 30;
controls.maxDistance = 75;
controls.update();

// Loaders
const textureLoader = new THREE.TextureLoader();

// Model Loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const environmentMap = new THREE.CubeTextureLoader()
  .setPath("textures/skybox/night/")
  .load(["px.webp", "nx.webp", "py.webp", "ny.webp", "pz.webp", "nz.webp"]);

// Texture Map
const textureMap = {
  1: {
    day: "/textures/day/TextureSet1Day.webp",
    night: "/textures/night/TextureSet1Night.webp",
  },
  2: {
    day: "/textures/day/TextureSet2Day.webp",
    night: "/textures/night/TextureSet2Night.webp",
  },
  3: {
    day: "/textures/day/TextureSet3Day.webp",
    night: "/textures/night/TextureSet3Night.webp",
  },
};

const loadedTextures = {
  day: {},
  night: {},
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
const screen = textureLoader.load("/textures/screen/laptop_screen.webp");
screen.colorSpace = THREE.SRGBColorSpace;
screen.flipY = false;

// Load model
loader.load("/models/coffee_shop_devfolio.glb", (glb) => {
  glb.scene.traverse((child) => {
    if (child.isMesh) {
      Object.keys(textureMap).forEach((key) => {
        if (child.name.includes(key)) {
          const material = new THREE.MeshBasicMaterial({
            map: loadedTextures.night[key],
          });
          child.material = material;
        }
      });
      if (child.name.includes("target")) {
        raycasterObjects.push(child);
      }
      if (child.name.includes("hover")) {
        child.userData.initialScale = new THREE.Vector3().copy(child.scale);
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position
        );
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation);
        child.userData.isAnimating = false;
        hoverObjects.push(child);
        hoverObjects.forEach((obj) => {
          //console.log(obj.name);
        });
      }
      if (child.name.includes("fan")) {
        if (child.name.includes("ac")) {
          acFan.push(child);
        } else {
          sinkFans.push(child);
        }
      }
      if (child.name.includes("bean")) {
        giantBean.push(child);
      }

      if (child.name.includes("glass")) {
        child.material = glassMaterial;
      }
      if (child.name.includes("screen")) {
        child.material = new THREE.MeshBasicMaterial({ map: screen });
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

// TODO: refactor play hover animation function

function playHoverAnimation(object, isHovering) {
  gsap.killTweensOf(object.scale);
  gsap.killTweensOf(object.rotation);
  gsap.killTweensOf(object.position);

  if (object.name.includes("umb")) {
    if (isHovering) {
      gsap.to(object.rotation, {
        y: 1.5,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    } else {
      gsap.to(object.rotation, {
        y: object.userData.initialRotation.y,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    }
  }

  if (object.name.includes("front")) {
    let glass = null;
    hoverObjects.forEach((obj) => {
      if (obj.name.includes("front_door_window")) {
        glass = obj;
      }
    });
    if (isHovering) {
      gsap.to(object.rotation, {
        y: -1.5,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
      gsap.to(glass.rotation, {
        y: 1.5,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    } else {
      gsap.to(object.rotation, {
        y: glass.userData.initialRotation.y,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
      gsap.to(glass.rotation, {
        y: glass.userData.initialRotation.y,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    }
  }

  if (object.name.includes("patio_door_glass")) {
    let knob = null;
    hoverObjects.forEach((obj) => {
      if (obj.name.includes("knob")) {
        knob = obj;
      }
    });
    if (isHovering) {
      gsap.to(object.rotation, {
        y: -0.5,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
      gsap.to(knob.rotation, {
        y: -0.5,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    } else {
      gsap.to(object.rotation, {
        y: knob.userData.initialRotation.y,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
      gsap.to(knob.rotation, {
        y: knob.userData.initialRotation.y,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    }
  }
  if (object.name.includes("back_door_hover")) {
    let glass = null;
    hoverObjects.forEach((obj) => {
      if (obj.name.includes("back_door_window")) {
        glass = obj;
      }
    });
    if (isHovering) {
      gsap.to(object.rotation, {
        y: 1.5,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
      gsap.to(glass.rotation, {
        y: 1.5,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    } else {
      gsap.to(object.rotation, {
        y: glass.userData.initialRotation.y,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
      gsap.to(glass.rotation, {
        y: glass.userData.initialRotation.y,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    }
  }

  if (object.name.includes("dumpster")) {
    if (isHovering) {
      gsap.to(object.rotation, {
        z: 1,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    } else {
      gsap.to(object.rotation, {
        z: object.userData.initialRotation.z,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    }
  }

  if (object.name.includes("breaker")) {
    if (isHovering) {
      gsap.to(object.rotation, {
        y: -2,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    } else {
      gsap.to(object.rotation, {
        y: object.userData.initialRotation.y,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    }
  }

  if (object.name.includes("sign")) {
    if (isHovering) {
      gsap.to(object.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    } else {
      gsap.to(object.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      });
    }
  }
}

const render = () => {
  // Animate Fans
  acFan.forEach((acfan) => {
    acfan.rotation.y += 0.15;
  });

  sinkFans.forEach((sinkfan) => {
    sinkfan.rotation.x += 0.1;
  });

  giantBean.forEach((bean) => {
    bean.rotation.z += 0.007;
  });

  if (!isModalOpen) {
    raycaster.setFromCamera(pointer, camera);
    currentIntersects = raycaster.intersectObjects(raycasterObjects);
    const hoverIntersects = raycaster.intersectObjects(hoverObjects);

    // Handle hover animations
    if (hoverIntersects.length > 0) {
      const currentIntersectObject = currentIntersects[0].object;
      if (currentIntersectObject.name.includes("hover")) {
        if (currentIntersectObject !== currentHovered) {
          if (currentHovered) {
            playHoverAnimation(currentHovered, false);
          }
          playHoverAnimation(currentIntersectObject, true);
          currentHovered = currentIntersectObject;
        }
      }
    }

    if (currentIntersects.length > 0) {
      const currentIntersectsObject = currentIntersects[0].object;
      if (currentIntersectsObject.name.includes("hover")) {
        document.body.style.cursor = "pointer";
      }
    } else {
      if (currentHovered) {
        playHoverAnimation(currentHovered, false);
        currentHovered = null;
      }
      document.body.style.cursor = "default";
    }
  }
  controls.update();
  window.requestAnimationFrame(render);
  renderer.render(scene, camera);
};

showModal(modals.email);

render();
