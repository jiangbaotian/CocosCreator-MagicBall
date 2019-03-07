import { GameEvent } from "../../model/config";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Barrier extends cc.Component {

	// ///////////////////////////
	// ///属性检查器
	// /////////////////////////
	@property(cc.Label)
	private labNumber: cc.Label = null;
	// ///////////////////////////
	// ///成员变量
	// /////////////////////////
	private lifeNumber = -1;

	/** 销毁障碍物回调函数 */
	private destroyBarrierCallBack: any = null;
	/** 增加分数 */
	private addOneScoreCallBack: any = null;
	/** 增加一个球 */
	private addOneBallCallBack: any = null;

	private endGamePositoinY: number;
	// ///////////////////////////
	// ///cc.class生命回调函数
	// /////////////////////////
	protected onLoad() {
		cc.director.on(GameEvent.MoveBarrierPosition, this.movePosition, this);
	}

	protected onDestroy() {
		this.node.removeFromParent();
		this.node.destroy();
		cc.director.off(GameEvent.MoveBarrierPosition, this.movePosition, this);
		// 直接销毁
		this.destroy();
	}

	// ///////////////////////////
	// ///事件
	// /////////////////////////
	public onBeginContact(contact: cc.PhysicsContact, selfCollider: cc.PhysicsCollider, otherCollider: cc.PhysicsCollider) {
		if (otherCollider.node.name !== "prefab_ball") {
			return;
		}
		// 新增一个小球
		if (selfCollider.node.name === "prefab_addBall" && this.addOneBallCallBack) {
			this.addOneBallCallBack(this.node.position);
			this.onDestroy();
			return;
		}

		if (1 === this.lifeNumber) {
			this.onDestroy();
		} else if (1 < this.lifeNumber) {
			// 生命值减1
			this.lifeNumber -= 1;
			this.setBarrierLife(this.lifeNumber);
			this.addOneScoreCallBack();
			console.log("=========================>" + this.node.name + ":命值减1");
		}
	}

	// ///////////////////////////
	// ///业务逻辑(control层)
	// //////////////////////////
	public initialize(lifeNumber: number, addOneScoreCallBack: any, destroyBarrierCallBack: any, addOneBallCallBack: any, positionY: number): void {
		this.lifeNumber = lifeNumber;
		this.addOneBallCallBack = addOneBallCallBack;
		this.addOneScoreCallBack = addOneScoreCallBack;
		this.destroyBarrierCallBack = destroyBarrierCallBack;
		this.endGamePositoinY = positionY;
		this.setBarrierLife(this.lifeNumber);
	}

	public setBarrierLife(lifeNumber: number) {
		if (this.labNumber) {
			this.labNumber.string = lifeNumber.toString();
		}
	}

	private movePosition(spacing: number) {
		this.node.runAction(cc.sequence(
			cc.moveBy(0.5, cc.v2(0, 100)),
			cc.callFunc(() => {
				if (this.node.position.y > 0) {
					this.shakeEffect(this.node, 0.2);
				}
				if (this.node.position.y > this.endGamePositoinY) {
					cc.director.emit(GameEvent.GameOver);
				}
			})
		));
	}

	// 震屏效果
	// 参数：duration 震屏时间
	private shakeEffect(node: cc.Node, duration: number) {
		const position = node.position;
		node.runAction(
			cc.repeatForever(
				cc.sequence(
					cc.moveTo(0.02, cc.v2(position.x + 2, position.y + 4)),
					cc.moveTo(0.02, cc.v2(position.x - 3, position.y + 4)),
					cc.moveTo(0.02, cc.v2(position.x - 9, position.y + 1)),
					cc.moveTo(0.02, cc.v2(position.x + 3, position.y + 6)),
					cc.moveTo(0.02, cc.v2(position.x - 5, position.y + 5)),
					cc.moveTo(0.02, cc.v2(position.x + 2, position.y + 8)),
					cc.moveTo(0.02, cc.v2(position.x - 6, position.y + 3)),
					cc.moveTo(0.02, cc.v2(position.x + 3, position.y + 6)),
					cc.moveTo(0.02, cc.v2(position.x, position.y))
				)
			)
		);

		setTimeout(() => {
			node.stopAllActions();
			node.setPosition(position);
		}, duration * 1000);
	}
}
