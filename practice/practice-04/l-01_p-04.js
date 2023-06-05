import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

// 描画時のタイムスタンプ
let timerPast = Date.now();
// 描画開始してからの経過時間
let timerNow = '';

window.addEventListener('DOMContentLoaded', () => {
	const app = new App3();
	app.init();
	app.render();
}, false);

// window.addEventListener('load', ()=> {});

class App3 {
	static get CAMERA_PARAM() {
		return {
			fovy: 60,
			aspect: window.innerWidth / window.innerHeight,
			near: 0.1,
			far: 1000.0,
			x: 0.0,
			y: 2.0,
			z: 5.0,
			lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
		};
	}

	static get RENDERER_PARAM() {
		return {
			clearColor: 0x666666,
			width: window.innerWidth,
			height: window.innerHeight,
		};
	}

	static get DIRECTIONAL_LIGHT_PARAM() {
		return {
			color: 0xffffff, // 光の色
			intensity: 1.0,  // 光の強度
			x: 1.0,          // 光の向きを表すベクトルの X 要素
			y: 1.0,          // 光の向きを表すベクトルの Y 要素
			z: 1.0           // 光の向きを表すベクトルの Z 要素
		};
	}

	static get AMBIENT_LIGHT_PARAM() {
		return {
			color: 0xffffff, // 光の色
			intensity: 0.2,  // 光の強度
		};
	}

	static get MATERIAL_PARAM() {
		return {
			color: 0x3399ff,
		};
	}

	/**
	* コンストラクタ
	* @constructor
	*/
	constructor() {
		this.renderer;			// レンダラ
		this.scene;				// シーン
		this.camera; 			// カメラ
		this.directionalLight;	// 平行光源（ディレクショナルライト） @@@
		this.ambientLight;		// アンビエントライト @@@
		this.geometry;			// ジオメトリ
		this.material;			// マテリアル
		this.box;				// ボックスメッシュ
		this.sphereGeometry;	// スフィアジオメトリ @@@
		this.sphere;           // スフィアメッシュ @@@
		this.torusGeometry;    // トーラスジオメトリ @@@
		this.torus;            // トーラスメッシュ @@@
		this.torusArray;       // トーラスメッシュの配列 @@@
		this.coneGeometry;     // コーンジオメトリ @@@
		this.cone;             // コーンメッシュ @@@
		this.controls; // オービットコントロール @@@
		this.axesHelper; // 軸ヘルパー @@@
		this.isDown = false; // キーの押下状態を保持するフラグ @@@
		this.render = this.render.bind(this);

		// キーの押下や離す操作を検出できるようにする @@@
		window.addEventListener('keydown', (keyEvent) => {
			switch (keyEvent.key) {
				case ' ':
				this.isDown = true;
				break;
				default:
			}
		}, false);

		window.addEventListener('keyup', (keyEvent) => {
			this.isDown = false;
		}, false);

		window.addEventListener('resize', () => {
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
		}, false);
	}

	init() {
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));
		this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
		const wrapper = document.querySelector('#webgl');
		wrapper.appendChild(this.renderer.domElement);

		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(
			App3.CAMERA_PARAM.fovy,
			App3.CAMERA_PARAM.aspect,
			App3.CAMERA_PARAM.near,
			App3.CAMERA_PARAM.far,
		);
		this.camera.position.set(
			App3.CAMERA_PARAM.x,
			App3.CAMERA_PARAM.y,
			App3.CAMERA_PARAM.z,
		);
		this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

		this.directionalLight = new THREE.DirectionalLight(
			App3.DIRECTIONAL_LIGHT_PARAM.color,
			App3.DIRECTIONAL_LIGHT_PARAM.intensity
		);
		this.directionalLight.position.set(
			App3.DIRECTIONAL_LIGHT_PARAM.x,
			App3.DIRECTIONAL_LIGHT_PARAM.y,
			App3.DIRECTIONAL_LIGHT_PARAM.z,
		);

		this.scene.add(this.directionalLight);

		this.ambientLight = new THREE.AmbientLight(
			App3.AMBIENT_LIGHT_PARAM.color,
			App3.AMBIENT_LIGHT_PARAM.intensity,
		);
		this.scene.add(this.ambientLight);
		this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);

		const BOX_COUNT = 10;
		const BOX_TRANSFORM_SCALE = 1.0;
		const BOX_TRANSFORM_OFFSET = 1.0;
		this.boxGeometry = new THREE.BoxGeometry(BOX_TRANSFORM_SCALE, BOX_TRANSFORM_SCALE, BOX_TRANSFORM_SCALE);
		this.boxArray = [];

		let BOX_X = -((BOX_TRANSFORM_SCALE * 4) + (BOX_TRANSFORM_OFFSET * 5));

		for( let i = 0; i < BOX_COUNT; ++i){
			const box = new THREE.Mesh(this.boxGeometry, this.material);
			box.position.x = BOX_X;
			box.position.y = 0.0;
			box.position.z = 0.0;

			this.scene.add(box);
			this.boxArray.push(box);
			BOX_X += BOX_TRANSFORM_SCALE + BOX_TRANSFORM_OFFSET;
		}

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		const axesBarLength = 5.0;
		this.axesHelper = new THREE.AxesHelper(axesBarLength);
		this.scene.add(this.axesHelper);
	}

	update() {
		// 経過時間を更新
		timerNow = Date.now();

		// 経過時間1秒ごとに出力
		if(timerNow - timerPast > 1000) {
			console.log( timerNow );
			timerPast = Date.now();
		}
	}

	render() {
		requestAnimationFrame(this.render);
		this.controls.update();

		this.update();

		if (this.isDown === true) {
			this.boxArray.forEach((box) => {
				box.rotation.y += 0.05;
			});
		}

		this.renderer.render(this.scene, this.camera);
	}
}
