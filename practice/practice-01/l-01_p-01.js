
// = 001 ======================================================================
// three.js サンプルの雛形。
// これは基本となる雛形サンプルなので他のサンプルよりもコメント多めになってます。
// ============================================================================

// - JavaScript にあまり詳しくない方向けの解説 --------------------------------
// JavaScript がブラウザ上で動作するとき、変数などのスコープのうち、最も広い範囲
// で有効となるグローバルスコープは「ウィンドウの名前空間」です。ちょっと別の言
// い方をすると、関数内部などではない場所（たとえばファイルの冒頭など）で唐突に
// var variable = null; のように書くと window.variable = null; と同義になります。
// ※ただし module として読み込まれている場合はモジュールレベルに閉じる
//
// JavaScript では関数のような {} を使って記述する構文で、変数のスコープが閉じら
// れます。if 文や、for 文などでも同様です。これらのことを踏まえてスクールのサン
// プルは原則として以下のようなルールで記述されています。
//
// 1. 原則としてモジュール形式で記述する
// 2. 可能な限り変数の宣言には const を使う（再代入できない変数の宣言）
// 3. 大文字のみで構成される変数・プロパティは定数的に利用する
// ----------------------------------------------------------------------------

// 必要なモジュールを読み込み
import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js'; // @@@

// DOM がパースされたことを検出するイベントを設定
window.addEventListener('DOMContentLoaded', () => {
	// 制御クラスのインスタンスを生成
	const app = new App3();

	// 初期化
	app.init();

	// 描画
	app.render();
}, false);

/**
* three.js を効率よく扱うために自家製の制御クラスを定義
*/
class App3 {
	/**
	* カメラ定義のための定数
	*/
	static get CAMERA_PARAM() {
		return {
		fovy: 60,
		aspect: window.innerWidth / window.innerHeight,
		near: 0.1,
		far: 10.0,
		x: 0.0,
		y: 2.0,
		z: 5.0,
		lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
		};
	}
	/**
	* レンダラー定義のための定数
	*/
	static get RENDERER_PARAM() {
		return {
		clearColor: 0x666666,
		width: window.innerWidth,
		height: window.innerHeight,
		};
	}
	/**
	* 平行光源定義のための定数 @@@
	*/
	static get DIRECTIONAL_LIGHT_PARAM() {
		return {
		color: 0xffffff, // 光の色
		intensity: 1.0,  // 光の強度
		x: 1.0,          // 光の向きを表すベクトルの X 要素
		y: 1.0,          // 光の向きを表すベクトルの Y 要素
		z: 1.0           // 光の向きを表すベクトルの Z 要素
		};
	}
	/**
	* アンビエントライト定義のための定数 @@@
	*/
	static get AMBIENT_LIGHT_PARAM() {
		return {
			color: 0xffffff, // 光の色
			intensity: 0.2,  // 光の強度
		};
	}
	/**
	* マテリアル定義のための定数
	*/
	static get MATERIAL_PARAM() {
		return {
		color: 0x3399ff, // マテリアルの基本色
		};
	}

	/**
	* コンストラクタ
	* @constructor
	*/
	constructor() {
		this.renderer; // レンダラ
		this.scene;    // シーン
		this.camera;   // カメラ
		this.directionalLight; // 平行光源（ディレクショナルライト） @@@
		this.ambientLight;     // アンビエントライト @@@
		this.geometry; // ジオメトリ
		this.material; // マテリアル
		this.box;      // ボックスメッシュ
		this.sphereGeometry;   // スフィアジオメトリ @@@
		this.sphere;           // スフィアメッシュ @@@
		this.torusGeometry;    // トーラスジオメトリ @@@
		this.torus;            // トーラスメッシュ @@@
		this.torusArray;       // トーラスメッシュの配列 @@@
		this.coneGeometry;     // コーンジオメトリ @@@
		this.cone;             // コーンメッシュ @@@
		this.controls; // オービットコントロール @@@
		this.axesHelper; // 軸ヘルパー @@@

		this.isDown = false; // キーの押下状態を保持するフラグ @@@

		// render メソッドはブラウザ制御で再帰的に呼び出されるので this を固定する @@@
		// - JavaScript における this ---------------------------------------------
		// 初心者向けのドキュメントなどで、よく JavaScript の this は紛らわしいもの
		// として紹介されます。実際、JavaScript では this が原因で不具合が混入してし
		// まうことはよく起こります。
		// 以下の一文も、そんな不具合を解消するためのコードでこれを削除してしまうと
		// 正しく動作しなくなってしまいます。
		// ここでは「JavaScript の this は呼び出し元によって動的に変化する」という特
		// 性を踏まえ、あらかじめ this を固定するということを行っています。
		// ------------------------------------------------------------------------
		this.render = this.render.bind(this);

		// キーの押下や離す操作を検出できるようにする @@@
		window.addEventListener('keydown', (keyEvent) => {
			// スペースキーが押されている場合はフラグを立てる
			switch (keyEvent.key) {
				case ' ':
				this.isDown = true;
				break;
				default:
			}
		}, false);
		window.addEventListener('keyup', (keyEvent) => {
			// なんらかのキーが離された操作で無条件にフラグを下ろす
			this.isDown = false;
		}, false);

		// リサイズイベント @@@
		// - ウィンドウサイズの変更に対応 -----------------------------------------
		// JavaScript ではブラウザウィンドウの大きさが変わったときに resize イベント
		// が発生します。three.js や WebGL のプログラムを書く際はウィンドウや canvas
		// の大きさが変化したときは、カメラやレンダラーなどの各種オブジェクトに対し
		// てもこの変更内容を反映してやる必要があります。
		// three.js の場合であれば、レンダラーとカメラに対し、以下のように設定してや
		// ればよいでしょう。
		// ------------------------------------------------------------------------
		window.addEventListener('resize', () => {
		// レンダラの大きさを設定
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		// カメラが撮影する視錐台のアスペクト比を再設定
		this.camera.aspect = window.innerWidth / window.innerHeight;
		// カメラのパラメータが変更されたときは行列を更新する
		// ※なぜ行列の更新が必要なのかについては、
		//   ネイティブな WebGL で実装する際などにもう少し詳しく解説します
		this.camera.updateProjectionMatrix();
		}, false);
	}

	/**
	* 初期化処理
	*/
	init() {
		// - レンダラの初期化 -----------------------------------------------------
		// レンダラ、という言葉はフロントエンドではあまり見聞きしない言葉です。わか
		// りやすく言うなら、レンダラとは「現像する人」です。カメラが撮影したフィル
		// ムを、現像してスクリーンに映してくれる役割を担います。
		// ------------------------------------------------------------------------
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(new THREE.Color(App3.RENDERER_PARAM.clearColor));
		this.renderer.setSize(App3.RENDERER_PARAM.width, App3.RENDERER_PARAM.height);
		const wrapper = document.querySelector('#webgl');
		wrapper.appendChild(this.renderer.domElement);

		// - シーンの初期化 -------------------------------------------------------
		// Scene とは、その名のとおり 3D シーンを管理するためのものです。
		// たとえばこのシーンにはどんなオブジェクトを使うのか、あるいはどんなカメラ
		// を使って撮影を行うのかなど、描画する 3D 空間全体の情報をまとめて持ってい
		// るのが Scene オブジェクトです。
		// 3D の専門用語では、いわゆるシーングラフ（Scene Graph）と呼ばれているもの
		// で、three.js ではこれを Scene オブジェクトによって実現します。
		// ------------------------------------------------------------------------
		this.scene = new THREE.Scene();

		// - カメラの初期化 -------------------------------------------------------
		// three.js におけるカメラは、現実世界のカメラと同じように空間を撮影するため
		// に使います。
		// 現実のカメラがそうであるように、カメラの性能や、あるいは性質によって最終
		// 的に描かれる世界はまったく違ったものになります。
		// ------------------------------------------------------------------------
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

		// ライト（平行光源） @@@
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

		// アンビエントライト（環境光） @@@
		this.ambientLight = new THREE.AmbientLight(
			App3.AMBIENT_LIGHT_PARAM.color,
			App3.AMBIENT_LIGHT_PARAM.intensity,
		);
		this.scene.add(this.ambientLight);

		// - ジオメトリとマテリアルの初期化 ---------------------------------------
		// ジオメトリとは、3D シーン上にオブジェクトを描くために使う「頂点」の集合体
		// です。もっと言うと、ジオメトリとは「単なる形状を定義したもの」であり、言
		// うなれば設計図、あるいは骨組みのようなものです。
		// ジオメトリはあくまでも設計図にすぎないので、これをどのように 3D 空間に配
		// 置するのかや、どのような色を塗るのかは、別の概念によって決まります。
		// three.js では、どのような色を塗るのかなど質感に関する設定はマテリアルとい
		// うオブジェクトがそれを保持するようになっています。
		// ------------------------------------------------------------------------

		// マテリアル @@@
		// - ライトを有効にするためにマテリアルを変更する -------------------------
		// ライトというと照らす側の光源のことばかり考えてしまいがちですが、その光を
		// 受け取る側の準備も必要です。
		// 具体的には、メッシュに適用するマテリアルをライトを受けることができるタイ
		// プに変更します。いくつかある対応するマテリアルのうち、今回はまずランバー
		// トマテリアルを選択します。
		// three.js には、ライトの影響を受けるマテリアルと、そうでないマテリアルがあ
		// ります。以前までのサンプルで利用していた MeshBasicMaterial は、ライトの影
		// 響を受けないマテリアルです。（基本的にベタ塗りになる）
		// ------------------------------------------------------------------------

		// this.geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
		// this.material = new THREE.MeshBasicMaterial(App3.MATERIAL_PARAM);
		// this.material = new THREE.MeshLambertMaterial(App3.MATERIAL_PARAM);
		// マテリアル
		this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);

		// 共通のジオメトリ、マテリアルから、複数のメッシュインスタンスを作成する @@@
		const TORUS_COUNT = 10;
		const TRANSFORM_SCALE = 5.0;
		this.torusGeometry = new THREE.TorusGeometry(0.5, 0.2, 8, 16);
		this.torusArray = [];
		for (let i = 0; i < TORUS_COUNT; ++i) {
			// トーラスメッシュのインスタンスを生成
			const torus = new THREE.Mesh(this.torusGeometry, this.material);
			// 座標をランダムに散らす
			torus.position.x = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
			torus.position.y = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
			torus.position.z = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
			// シーンに追加する
			this.scene.add(torus);
			// 配列に入れておく
			this.torusArray.push(torus);
		}

		// - メッシュの初期化 -----------------------------------------------------
		// three.js では、ジオメトリとマテリアルを別々に生成し組み合わせることで 3D
		// 空間に配置することができるメッシュを定義できます。
		// 定義したメッシュは、シーンに追加することではじめて描画の対象になります。
		// ------------------------------------------------------------------------
		// this.box = new THREE.Mesh(this.geometry, this.material);
		// this.scene.add(this.box);

		// 各種ジオメトリからメッシュを生成する @@@
		this.boxGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
		this.box = new THREE.Mesh(this.boxGeometry, this.material);
		this.scene.add(this.box);
		this.sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
		this.sphere = new THREE.Mesh(this.sphereGeometry, this.material);
		this.scene.add(this.sphere);
		this.torusGeometry = new THREE.TorusGeometry(0.5, 0.2, 8, 16);
		this.torus = new THREE.Mesh(this.torusGeometry, this.material);
		this.scene.add(this.torus);
		this.coneGeometry = new THREE.ConeGeometry(0.5, 1.0, 16);
		this.cone = new THREE.Mesh(this.coneGeometry, this.material);
		this.scene.add(this.cone);

		// 各種メッシュは少しずつ動かしておく @@@
		this.box.position.set(-1.0, 1.0, 0.0);
		this.sphere.position.set(1.0, 1.0, 0.0);
		this.torus.position.set(-1.0, -1.0, 0.0);
		this.cone.position.set(1.0, -1.0, 0.0);

		// コントロール @@@
		// - OrbitControls --------------------------------------------------------
		// オービット、とはいわゆる衛星などの軌道のことです。
		// 地球を中心にその周囲を飛び回る衛星と同じように、三次元空間のある一点を凝
		// 視しながらその周囲を回転するカメラコントロールを可能にします。
		// ------------------------------------------------------------------------
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		// ヘルパー @@@
		const axesBarLength = 5.0;
		this.axesHelper = new THREE.AxesHelper(axesBarLength);
		this.scene.add(this.axesHelper);
	}

	/**
	* 描画処理
	*/
	render() {

		// 恒常ループの設定 @@@
		requestAnimationFrame(this.render);

		// コントロールを更新 @@@
		this.controls.update();

		// フラグに応じてオブジェクトの状態を変化させる @@@
		if (this.isDown === true) {
			// rotation プロパティは Euler クラスのインスタンス
			// XYZ の各軸に対する回転をラジアンで指定する
			// Y 軸回転 @@@
			this.box.rotation.y += 0.05;
			this.sphere.rotation.y += 0.05;
			this.torus.rotation.y += 0.05;
			this.cone.rotation.y += 0.05;

			// Y 軸回転 @@@
			this.torusArray.forEach((torus) => {
				torus.rotation.y += 0.05;
			});
		}

		// - 描画フェーズ ---------------------------------------------------------
		// シーンに必要なオブジェクトを追加できたら、いよいよ描画です。
		// 描画を行うためには対象のシーンをレンダラでスクリーンに描画します。このと
		// き、どのカメラで描画するかを同時に指定します。
		// ------------------------------------------------------------------------
		this.renderer.render(this.scene, this.camera);
	}
}
