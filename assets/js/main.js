/**
 * three.jsで作るステージ
 */
class Stage {
  constructor() {
    this.renderParam = {
      clearColor: 0xffffff,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.cameraParam = {
      fav: 45,
      near: 0.1,
      far: 10000,
      lookAt: new THREE.Vector3(0, 0, 0),
      x: 0,
      y: 1000,
      z: 2000,
    };

    this.scene = null;
    this.sceneEdge = null;
    this.camera = null;
    this.renderer = null;
    this.geometry = null;
    this.material = null;
    this.mesh = null;
    this.isInitialized = false;

    this.orbitcontrols = null;
  }

  init() {
    this._setScene();
    this._setRender();
    this._setCamera();
    this.orbitcontrols = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.orbitcontrols.autoRotate = true;
    this.isInitialized = true;
  }

  _setScene() {
    this.scene = new THREE.Scene();
    this.sceneEdge = new THREE.Scene();
  }

  _setRender() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    this.renderer.setClearColor(new THREE.Color(this.renderParam.clearColor));
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setSize(this.renderParam.width, this.renderParam.height);
    this.renderer.autoClear = false;
    const wrapper = document.querySelector('#webgl');
    wrapper.appendChild(this.renderer.domElement);
  }

  _setCamera() {
    const windowWidth = window.innerWidth;
    const widnowHeight = window.innerHeight;

    if (!this.isInitialized) {
      this.camera = new THREE.PerspectiveCamera(
        45,
        windowWidth / widnowHeight,
        this.cameraParam.near,
        this.cameraParam.far,
      );
      this.camera.position.set(this.cameraParam.x, this.cameraParam.y, this.cameraParam.z);
      this.camera.lookAt(this.cameraParam.lookAt);
    }

    this.camera.aspect = windowWidth / widnowHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(windowWidth, widnowHeight);
  }

  _render() {
    this.renderer.clear();
  }

  onResize() {
    this._setCamera();
  }

  onRaf() {
    this._render();
    this.orbitcontrols.update();
  }
}


/**
 * メッシュクラス
 */
class Mesh {
  constructor(stage) {
    this.isEdge = true;

    this.geometryParam = {
      radius: 400,
      tube: 160,
      radialSegments: 30,
      tubularSegment: 100,
    };

    // ドーナッツの色は 0.9, 0.5, 0.0
    this.materialParam = {
      useWireframe: false,
      globalColor: {
        r: 0.5,
        g: 1.0,
        b: 1.0,
      }
    };

    this.uniforms = {
      u_time: { type: 'f', value: 0.0 },
      u_resolution: { type: 'v3', value: new THREE.Vector2() },
      u_mouse: { type: 'v2', value: new THREE.Vector2() },
      u_lightDirection: { type: 'v3', value: new THREE.Vector3(1.0, 1.0, 1.0) },
      u_globalColor: { type: 'v3', value: new THREE.Vector3(this.materialParam.globalColor.r, this.materialParam.globalColor.g, this.materialParam.globalColor.b) },
      u_gradient: { type: 'f', value: 3.0 }, // グラデーション（解像度)
      u_inflate: { type: 'f', value: 10.0 }, // エッジラインの太さ
      u_isEdge: { type: 'i', value: true },
    };

    this.stage = stage;

    this.mesh = null;
    this.meshEdge = null;

    this.windowWidth = 0;
    this.windowHeight = 0;

    this.windowWidthHalf = 0;
    this.windowHeightHalf = 0;
  }

  init() {
    this._setWindowSize();
    this._setMesh();
  }

  _setWindowSize() {
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    this.uniforms.u_resolution.value.x = this.windowWidth;
    this.uniforms.u_resolution.value.y = this.windowHeight;

    this.windowWidthHalf = this.windowWidth * 0.5;
    this.windowHeightHalf = this.windowHeight * 0.5;
  }

  _setMesh() {
    if (this.mesh != null) {
      this.stage.scene.remove(this.mesh);
      this.mesh.material.dispose();
      this.mesh.geometry.dispose();
    }

    if (this.meshEdge != null) {
      this.stage.sceneEdge.remove(this.meshEdge);
      this.meshEdge.material.dispose();
      this.meshEdge.geometry.dispose();
    }

    const geometry = new THREE.TorusBufferGeometry(
      this.geometryParam.radius,
      this.geometryParam.tube,
      this.geometryParam.radialSegments,
      this.geometryParam.tubularSegment,
    );

    const material = new THREE.RawShaderMaterial({
      vertexShader: document.querySelector("#js-vertex-shader").textContent,
      fragmentShader: document.querySelector("#js-fragment-shader").textContent,
      wireframe: this.materialParam.useWireframe,
      transparent: true,
      uniforms: this.uniforms,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);

    if (this.isEdge) {
      this.meshEdge = new THREE.Mesh(geometry, material);
    }

    this.stage.scene.add(this.mesh);

    if (this.isEdge) {
      this.stage.sceneEdge.add(this.meshEdge);
    }
  }

  _render() {
    // カリング面を反転させる
    this.meshEdge.material.side = THREE.FrontSide;
    this.mesh.material.uniforms.u_isEdge.value = false;
    this.stage.renderer.render(this.stage.scene, this.stage.camera);

    // エッジライン
    this.meshEdge.material.side = THREE.BackSide;
    this.meshEdge.material.uniforms.u_isEdge.value = true;
    this.stage.renderer.render(this.stage.sceneEdge, this.stage.camera);
  }

  onResize() {
    this._setWindowSize();
  }

  onMouseMove(e) {
    this.uniforms.u_mouse.value.x = e.clientX;
    this.uniforms.u_mouse.value.y = e.clientY;
  }

  onRaf() {
    this._render();
  }
}


function init () {
  const stage = new Stage();
  stage.init();

  const mesh = new Mesh(stage);
  mesh.init();

  window.addEventListener('mousemove', (e) => mesh.onMouseMove(e));
  window.addEventListener('resize', () => {
    stage.onResize();
    mesh.onResize();
  });

  const raf = () => {
    window.requestAnimationFrame(() => {
      stage.onRaf();
      mesh.onRaf();
      raf();
    });
  }

  raf();

  // -------------------------------------------------------------

  const gui = new dat.GUI({ width: 300 });
  gui.open();

  let param = {
    "Edge": mesh.isEdge,
    "R": mesh.materialParam.globalColor.r,
    "G": mesh.materialParam.globalColor.g,
    "B": mesh.materialParam.globalColor.b,
  };

  gui.add(param, "Edge").onChange((val) => {
    mesh.isEdge = val;
    mesh._setMesh();
  });
  gui.add(param, "R").min(0.0).max(1.0).step(0.1).onChange((val) => {
    mesh.materialParam.globalColor.r = val;
    mesh.uniforms.u_globalColor =  { type: 'v3', value: new THREE.Vector3(mesh.materialParam.globalColor.r, mesh.materialParam.globalColor.g, mesh.materialParam.globalColor.b) }
    mesh._setMesh();
  });
  gui.add(param, "G").min(0.0).max(1.0).step(0.1).onChange((val) => {
    mesh.materialParam.globalColor.g = val;
    mesh.uniforms.u_globalColor =  { type: 'v3', value: new THREE.Vector3(mesh.materialParam.globalColor.r, mesh.materialParam.globalColor.g, mesh.materialParam.globalColor.b) }
    mesh._setMesh();
  });
  gui.add(param, "B").min(0.0).max(1.0).step(0.1).onChange((val) => {
    mesh.materialParam.globalColor.b = val;
    mesh.uniforms.u_globalColor =  { type: 'v3', value: new THREE.Vector3(mesh.materialParam.globalColor.r, mesh.materialParam.globalColor.g, mesh.materialParam.globalColor.b) }
    mesh._setMesh();
  });
}

window.addEventListener('load', init);