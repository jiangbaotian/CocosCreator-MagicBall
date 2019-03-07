
/// TODO: 绘制过程可以使用精灵图片代替（使用对象池）

import MagicBallModel from "../../model/magicBallModel";
import { GameEvent } from "../../model/config";
import game = cc.game;

const { ccclass, property } = cc._decorator;

@ccclass
export default class DrawLine extends cc.Component {

	// ///////////////////////////
	// ///属性检查器
	// /////////////////////////
	/** 画线发射器 */
	@property(cc.Node)
	private spEmitter: cc.Node = null;
	/** 画线 */
	@property(cc.Graphics)
	private graphics: cc.Graphics = null;
	// ///////////////////////////
	// ///成员变量
	// /////////////////////////
	private spEmitterPosition: cc.Vec2;
	private direction: cc.Vec2;
	// ///////////////////////////
	// ///cc.class 生命周期函数
	// /////////////////////////
	protected onLoad() {
		this.spEmitterPosition = this.spEmitter.getPosition();
		this.registerEvent();
		this.setGraphics();
		MagicBallModel.getInstance().spEmitterPosition = this.spEmitterPosition;
	}
	protected onDestroy() {
		this.unRegisterEvent();
	}
	// ///////////////////////////
	// ///事件
	// /////////////////////////
	private registerEvent(): void {
		this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoveEvent, this);
		this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEndEvent, this);
	}
	private unRegisterEvent(): void {
		this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoveEvent, this);
		this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEndEvent, this);
	}
	private onTouchMoveEvent(touch: cc.Touch) {
		if (!MagicBallModel.getInstance().gameStatus) return;
		const touchWorldPosition = touch.getLocation();
		const touchLocalPosition = this.node.convertToNodeSpaceAR(touchWorldPosition);
		if (touchLocalPosition.y > this.spEmitterPosition.y) {
			return;
		}
		this.graphics.clear();
		this.drawSubline(this.spEmitterPosition, touchLocalPosition, this.graphics);
		// 旋转发射器
		this.setEmitterRotation(this.spEmitterPosition, touchLocalPosition, this.spEmitter);
		this.direction = touchLocalPosition.sub(cc.v2(this.spEmitterPosition.x, this.spEmitterPosition.y - 20));
	}

	private onTouchEndEvent(touch: cc.Touch) {
		const gameStatus = MagicBallModel.getInstance().gameStatus;
		if (!gameStatus) return;
		this.graphics.clear();
		this.spEmitter.runAction(cc.rotateTo(0.2, 0));
		cc.director.emit(GameEvent.ShootBalls, this.direction);
	}
	// ///////////////////////////
	// ///业务逻辑(control层)
	// /////////////////////////
	private setGraphics(): void {
		this.graphics.lineWidth = 2;
		this.graphics.fillColor.fromHEX("#ffffff");
		// this.graphics.strokeColor = cc.Color.BLACK;
	}

	/**
	 * @description 绘制发射小球的辅助线
	 * @param {cc.Vec2} start
	 * @param {cc.Vec2} end
	 * @param {cc.Graphics} graphics
	 * @param {number} imaginaryLinelength
	 */
	private drawSubline(start: cc.Vec2, end: cc.Vec2, graphics: cc.Graphics, imaginaryLinelength?: number): void {
		const length: number = imaginaryLinelength || 20;
		// start指向end的向量
		let line = end.sub(start);
		// 模长
		let lineLength = line.mag();
		// 虚线长度
		const increment: cc.Vec2 = line.normalize().mul(length);
		// 开始位置变量
		let position: cc.Vec2 = new cc.Vec2(start.x, start.y);
		let isDrawLine: Boolean = true;
		// 不绘制
		position.addSelf(increment);
		position.addSelf(increment);

		while (lineLength > length) {
			// 小圆点
			graphics.circle(position.x, position.y, 4);
			graphics.fill();
			position.addSelf(increment);
			lineLength -= length;
			// 虚线
			// if (isDrawLine) {
			// 	graphics.moveTo(position.x, position.y);
			// 	position.addSelf(increment);
			// 	graphics.lineTo(position.x, position.y);
			// 	graphics.stroke();
			// } else {
			// 	position.addSelf(increment);
			// }
			// isDrawLine = !isDrawLine;
			// lineLength -= length;
		}
	}

	/**
	 * @description 设置发射器的旋转角度
	 * @param {cc.Vec2} start
	 * @param {cc.Vec2} end
	 * @param {cc.Node} node
	 */
	private setEmitterRotation(start: cc.Vec2, end: cc.Vec2, node: cc.Node): void {
		// 从start指向end的方向
		const line = start.sub(end);
		const angle = line.signAngle(start) * (180 / Math.PI);
		node.setRotation(angle);
	}
}
