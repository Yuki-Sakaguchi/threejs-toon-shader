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

    this.materialParam = {
      useWireframe: false,
      globalColor: {
        r: 0.9,
        g: 0.5,
        b: 0.0,
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
    this.obj = null;

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
    }

    const material = new THREE.RawShaderMaterial({
      vertexShader: document.querySelector("#js-vertex-shader").textContent,
      fragmentShader: document.querySelector("#js-fragment-shader").textContent,
      wireframe: this.materialParam.useWireframe,
      transparent: true,
      uniforms: this.uniforms,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    new THREE.MTLLoader()
      .setPath('assets/model/')
      .load('blank.mtl', (materials) => {
        materials.preload();

        new THREE.OBJLoader()
          .setPath('assets/model/')
          .setMaterials(materials)
          .load('animal.obj', (object) => {
            this.mesh = object;

            // const objModel = object.clone();
            // objModel.traverse(function (child) {
            //   if (child instanceof THREE.Mesh) {
            //       child.material = material; 
            //   }
            // });
            // objModel.scale.set(1000, 1000, 1000);
            // objModel.position.set(0, 0, 0);
            // const obj = new THREE.Object3D();
            // obj.add(objModel);
            // this.mesh = obj;

            this.stage.scene.add(this.mesh);
      });
    });
  }

  _render() {
  }

  onResize() {
    this._setWindowSize();
  }

  onMouseMove(e) {
    this.uniforms.u_mouse.value.x = e.clientX;
    this.uniforms.u_mouse.value.y = e.clientY;
  }

  onRaf() {
    // this._render();
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
  gui.close();

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