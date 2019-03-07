import { GameConfig, GameEvent, Group } from "../../model/config";
import Ball from "./ball";
import Barrier from "./barrier";
import MagicBallModel from "../../model/magicBallModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Game extends cc.Component {

	// ///////////////////////////
	// ///属性检查器
	// /////////////////////////
	@property(cc.Label)
	private labScore: cc.Label = null;
	@property(cc.Label)
	private labBall: cc.Label = null;
	@property(cc.Animation)
	private aniHand: cc.Animation = null;
	@property([cc.Prefab])
	private prefabBarriers: [cc.Prefab] = [];
	@property(cc.Prefab)
	private prefabBall: cc.Prefab = null;
	@property(cc.Node)
	private nodeOverGame: cc.Node = null;
	// ///////////////////////////
	// ///成员变量
	// /////////////////////////
	/** 小球集合 */
	private balls: any = [];
	/** 分数 */
	private score = 0;
	/** 障碍物上限位置 */
	private upperLimitPosition: cc.Vec2;
	/** 障碍物下限位置 */
	private downLimitPosition: cc.Vec2;
	/** 每层Y轴间隔 */
	private spacing = -1;
	private recycleNumber = 0;

	// ///////////////////////////
	// ///cc.class 生命周期函数
	// /////////////////////////
	protected onLoad() {
		this.setPhysicsManager();
		this.initUI();
		this.registerEvent();
		this.addBarriers();
	}

	protected onDestroy() {
		this.unRegisterEvent();
	}

	// ///////////////////////////
	// ///事件
	// /////////////////////////
	private registerEvent() {
		this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStartEvent, this);
		// this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoveEvent, this);
		cc.director.on(GameEvent.ShootBalls, this.shootBalls, this);
		cc.director.on(GameEvent.GameOver, this.gameOver, this);
	}

	private unRegisterEvent() {
		this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStartEvent);
		// this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoveEvent);
		cc.director.off(GameEvent.ShootBalls, this.shootBalls);
		cc.director.off(GameEvent.GameOver, this.gameOver);
	}

	private onTouchStartEvent() {
		this.aniHand.stop("ani_hand");
		this.aniHand.node.parent.active = false;
	}

	// ///////////////////////////
	// ///业务逻辑(control层)
	// /////////////////////////
	/**
	 * @description 设置物理系统
	 */
	private setPhysicsManager() {
		let manager = cc.director.getPhysicsManager();
		// 开启物理系统
		manager.enabled = true;
		// 设置重力
		// manager.gravity = cc.v2();
		// 开启物理步长（刷新频率）
		// manager.enabledAccumulator = true;
		// 设置物理步长
		// manger.FIXED_TIME_STEP = 1 / 30;
	}

	/**
	 * @description 初始化UI
	 */
	private initUI() {
		this.labBall.string = 0;
		this.labScore.string = 1;
		this.aniHand.play("ani_hand");
		const position = cc.v2(-254, 535);
		this.addOneBall(position);
		this.upperLimitPosition = this.node.getChildByName("node_upperLimit").position;
		this.downLimitPosition = this.node.getChildByName("node_downLimit").position;
		this.spacing = (this.upperLimitPosition.x - this.downLimitPosition.x) / GameConfig.hierarchy;
	}

	/**
	 * @description 销毁障碍物
	 * @param {cc.Node} node
	 */
	private destroyBarrier(node: cc.Node) {
		node.destroy();
	}

	/**
	 * @description 增加分数
	 */
	private addOneScore() {
		MagicBallModel.getInstance().gameScore += 1;
		this.labScore.string = MagicBallModel.getInstance().gameScore.toString();
	}

	/**
	 * @description 增加一个小球
	 * @param {cc.Vec2} position
	 * @param {Group} group
	 */
	private addOneBall(position: cc.Vec2) {
		const ball = cc.instantiate(this.prefabBall);
		let ballCom = ball.getComponent(Ball);
		ballCom.initialize(this.recycleBalls.bind(this));
		this.node.addChild(ball);
		ball.position = position;
		// 没有作用
		// ball.group = Group.BallInRecycle;
		// ballCom.node.group = Group.BallInRecycle;
		this.balls.push(ball);
		this.labBall.string = this.balls.length.toString();
	}

	/**
	 * @description 发射小球
	 * @param direction
	 */
	private shootBalls(direction: cc.Vec2) {
		let delayTime = 0;
		for (let ball of this.balls) {
			this.scheduleOnce(() => {
				this.shootOneBall(ball, direction);
			}, delayTime);
			delayTime += 0.1;
		}
		MagicBallModel.getInstance().gameStatus = false;
	}

	/**
	 * @description 射出一个小球
	 * @param {cc.Node} ball
	 * @param {cc.Vec2} direction
	 */
	private shootOneBall(ball: cc.Node, direction: cc.Vec2) {
		const spEmitterPosition = MagicBallModel.getInstance().spEmitterPosition;
		let rigiBody = ball.getComponent(cc.RigidBody);
		rigiBody.active = false;
		const position = [];
		position.push(ball.position);
		// 放置在发射器的下方20个像素
		// 如果不这样子，由于碰撞原因，小球会被墙反弹
		position.push(cc.v2(spEmitterPosition.x, spEmitterPosition.y - 20));
		ball.group = Group.BallInGame;

		ball.runAction(cc.sequence(
			cc.cardinalSplineTo(0.8, position, 0.5),
			cc.callFunc(() => {
				rigiBody.active = true;
				rigiBody.linearVelocity = direction.mul(3);
			})
		));
	}

	/**
	 * @description 增加障碍物体
	 */
	private addBarriers() {
		let startPositionX = this.downLimitPosition.x;
		const startPositionY = this.downLimitPosition.y;
		const addBarriersNumber = 4;
		let barrierSize: cc.Size;
		let prefabBarrier: any;
		let index: number;
		let barrierX: number;
		let barrierY: number;
		let randomRotaion: number;

		let barrier: Barrier;
		const spacingH = (this.upperLimitPosition.x - this.downLimitPosition.x) / addBarriersNumber;
		for (let i = 1; i <= addBarriersNumber; i++) {
			index = Math.floor(this.prefabBarriers.length * Math.random());
			prefabBarrier = cc.instantiate(this.prefabBarriers[index]);
			barrier = prefabBarrier.getComponent(Barrier);
			barrier.initialize(2, this.addOneScore.bind(this), this.destroyBarrier.bind(this), this.addOneBall.bind(this), this.upperLimitPosition.y);
			barrierSize = prefabBarrier.getContentSize();
			barrierX = Math.floor(Math.random() * (spacingH - barrierSize.width / 2)) + barrierSize.width / 2 + startPositionX;
			barrierY = Math.floor(Math.random() * (this.spacing - barrierSize.height) + 1) + startPositionY + barrierSize.height / 2;
			prefabBarrier.position = cc.v2(barrierX, barrierY);
			startPositionX += spacingH;
			randomRotaion = prefabBarrier.name !== "prefab_addBall" ? Math.floor(Math.random() * 360) : 0;
			prefabBarrier.rotation = randomRotaion;
			this.node.addChild(prefabBarrier);
		}
	}

	private recycleBalls(num) {
		this.recycleNumber += num;
		if (this.recycleNumber === this.balls.length) {
			MagicBallModel.getInstance().gameStatus = true;
			this.recycleNumber = 0;
			cc.director.emit(GameEvent.MoveBarrierPosition, this.spacing);
		}
	}

	private gameOver() {
		console.log("游戏结束");
		this.nodeOverGame.active = true;
	}

	private onClickRestartBtnEvent(event) {
		cc.director.loadScene("mainGame");
	}
}
