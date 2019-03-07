

export default class MagicBallModel {
	// ///////////////////////////
	// ///成员变量
	// /////////////////////////
	/** 单例 */
	private static _instance: MagicBallModel;
	/** 游戏状态: true: 可以进行游戏，false：等待结果 */
	private _gameStatus = true;
	/** 获得分数 */
	private _gameScore = 0;
	/** 发射器位置 */
	private _spEmitterPosition: cc.Vec2;
	// ///////////////////////////
	// ///存取器
	// /////////////////////////
	public set gameStatus(value: boolean) {
		this._gameStatus = value;
	}
	public get gameStatus(): boolean {
		return this._gameStatus;
	}
	public set gameScore(value: number) {
		this._gameScore = value;
	}
	public get gameScore(): number {
		return this._gameScore;
	}
	public set spEmitterPosition(value: cc.Vec2) {
		this._spEmitterPosition = value;
	}
	public get spEmitterPosition(): cc.Vec2 {
		return this._spEmitterPosition;
	}
	// ///////////////////////////
	// ///业务逻辑(control层)
	// /////////////////////////
	public static getInstance(): MagicBallModel {
		if (!this._instance) {
			this._instance = new MagicBallModel();
		}
		return this._instance;
	}
}
