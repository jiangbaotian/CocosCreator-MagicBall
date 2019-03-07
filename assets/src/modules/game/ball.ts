
import { Group } from "../../model/config";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Ball extends cc.Component {

	// ///////////////////////////
	// ///属性检查器
	// /////////////////////////
	@property(cc.RigidBody)
	private rigidBody: cc.RigidBody = null;
	@property(cc.Collider)
	private collider: cc.Collider = null;
	// ///////////////////////////
	// ///成员变量
	// /////////////////////////
	private isTouchGround: Boolean = false;
	private recycleBallCallBack: any;
	// ///////////////////////////
	// ///cc.class 生命周期函数
	// /////////////////////////
	protected update(dt) {
		// 回收小球
		if (this.isTouchGround) {
			this.rigidBody.linearVelocity = cc.Vec2.ZERO;
			this.rigidBody.active = false;
			let points = [];
			points.push(this.node.position);
			points.push(cc.v2(333, -540));
			points.push(cc.v2(333, 545));
			points.push(cc.v2(0, 393));

			this.node.runAction(cc.sequence(
				cc.cardinalSplineTo(1, points, 0.9),
				cc.callFunc(() => {
					this.rigidBody.active = true;
					this.node.group = Group.BallInRecycle;
					this.recycleBallCallBack(1);
				})
			));
			this.isTouchGround = false;
		}
	}
	// ///////////////////////////
	// ///事件
	// /////////////////////////
	public onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
		//
		if (otherCollider.node.name === "sp_buttombg") {
			this.isTouchGround = true;
		}
	}
	// ///////////////////////////
	// ///业务逻辑
	// /////////////////////////
	public initialize(recycleBallCallBack: any) {
		this.recycleBallCallBack = recycleBallCallBack;
	}
}
