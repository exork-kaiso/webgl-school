import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';

// 描画時のタイムスタンプ
let timerPast = Date.now();
// 描画開始してからの経過時間
let timerNow = '';
// box生成のタイミング
const INTERVAL_TIME = 1000;
// 立方体のサイズ
let MULTIPLY_NUMBER = 10;

let BOX_COUNT = 1;
let BOX_TMP = 1;
let BOX_POS_X = 0.0;
let BOX_POS_Y = 0.0;
let BOX_POS_Z = 0.0;
let LIFECYCLE = true;

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

		const BOX_TRANSFORM_SCALE = 1.0;
		this.boxGeometry = new THREE.BoxGeometry(BOX_TRANSFORM_SCALE, BOX_TRANSFORM_SCALE, BOX_TRANSFORM_SCALE);
		this.boxArray = [];

		// for(let i = 0; i < MULTIPLY_NUMBER; i++){
		// 	BOX_POS_Z = i + (i/2);

		// 	for(let j = 0; j < MULTIPLY_NUMBER; j++){
		// 		BOX_POS_Y = j + (j/2);

		// 		for(let k = 0; k < MULTIPLY_NUMBER; k++){
		// 			BOX_POS_X = k + (k/2);

		// 			const box = new THREE.Mesh(this.boxGeometry, this.material);

		// 			box.position.x = BOX_POS_X;
		// 			box.position.y = BOX_POS_Y;
		// 			box.position.z = BOX_POS_Z;

		// 			BOX_COUNT++;
		// 			BOX_TMP++;

		// 			this.scene.add(box);
		// 			this.boxArray.push(box);

		// 			// console.log( "BOX_COUNT : " + BOX_COUNT + ", i: " + i + ", j: " + j + ", k: " + k );
		// 		}
		// 	}
		// }
		// BOX_COUNT--;

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		const axesBarLength = 5.0;
		this.axesHelper = new THREE.AxesHelper(axesBarLength);
		this.scene.add(this.axesHelper);
	}

	update() {
		// 経過時間を更新
		timerNow = Date.now();

		// 経過時間1秒ごとに出力
		if( (timerNow - timerPast) > INTERVAL_TIME ) {

			if( LIFECYCLE ) {
				console.log(
					// "LIFECYCLE : " + LIFECYCLE +
					"COUNT : " + BOX_COUNT
					// ", X : " + BOX_POS_X  +
					// ", Y : " + BOX_POS_Y +
					// ", Z : " + BOX_POS_Z
				);

				const box = new THREE.Mesh(this.boxGeometry, this.material);
				box.position.x = BOX_POS_X;
				box.position.y = BOX_POS_Y;
				box.position.z = BOX_POS_Z;

				BOX_POS_X = BOX_TMP + (BOX_TMP/2);

				if( (BOX_COUNT % MULTIPLY_NUMBER) === 0 ) {
					BOX_POS_X = 0.0;
					BOX_TMP = 0;
					BOX_POS_Y = BOX_POS_Y + 1.5;
				}

				if( (BOX_COUNT % (MULTIPLY_NUMBER * MULTIPLY_NUMBER)) === 0 ) {
					BOX_POS_X = 0.0;
					BOX_POS_Y = 0.0;
					BOX_TMP = 0;
					BOX_POS_Z = BOX_POS_Z + 1.5;
				}

				if( (BOX_COUNT % (MULTIPLY_NUMBER * MULTIPLY_NUMBER * MULTIPLY_NUMBER)) === 0 ) {
					LIFECYCLE = false;
				}

				BOX_COUNT++;
				BOX_TMP++;

				this.scene.add(box);
				this.boxArray.push(box);

			} else {
				console.log( BOX_COUNT );
				this.scene.remove( this.boxArray[BOX_COUNT] );
				--BOX_COUNT;
			}

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
