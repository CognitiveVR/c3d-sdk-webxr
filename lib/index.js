'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _network = require('./network');

var _network2 = _interopRequireDefault(_network);

var _scenedata = require('./scenedata');

var _scenedata2 = _interopRequireDefault(_scenedata);

var _gazetracker = require('./gazetracker');

var _gazetracker2 = _interopRequireDefault(_gazetracker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//need another class ?
var CognitiveVRAnalyticsCore = function () {
	function CognitiveVRAnalyticsCore(settings) {
		_classCallCheck(this, CognitiveVRAnalyticsCore);

		this.config = new _config2.default();
		this.isSessionActive = false;
		this.sceneData = _scenedata2.default;
		this.userId = '';
		this.deviceId = '';
		this.sessionId = '';
		this.sessionTimestamp = '';
		this.sceneName = '';
		// let core = {
		// 	isSessionActive:this.isSessionActive1,
		// 	userId:this.userId,
		// 	deviceId:this.deviceId,
		// 	sessionId:this.sessionId,
		// 	sessionTimestamp:this.sessionTimestamp,
		// 	sceneName:this.sceneName
		// }
		if (settings) {
			this.config.settings = settings.config;
		}
		this.c3d = { config: this.config };
		this.network = new _network2.default(this.config);
		this.gaze = new _gazetracker2.default(this.c3d, this.network, this.isSessionActive);
		// this.customEvent = new CustomEvent();
		// gaze = new Gaze();
		// sensor = new Sensor();
		// dynamicobject = new DynamicObject();
		// exitpoll = new Exitpoll();
	}

	_createClass(CognitiveVRAnalyticsCore, [{
		key: 'removeSettings',
		value: function removeSettings() {}
	}, {
		key: 'getSessionTimestamp',
		value: function getSessionTimestamp() {
			if (!this.sessionTimestamp) {
				this.sessionTimestamp = this.getTimestamp();
			}
			return this.sessionTimestamp;
		}
	}, {
		key: 'getTimestamp',
		value: function getTimestamp() {
			return Date.now();
		}
	}, {
		key: 'isSessionActive1',
		value: function isSessionActive1() {
			return this.isSessionActive;
		}
	}, {
		key: 'startSession',
		value: function startSession() {
			this.isSessionActive = true;
			var ts = this.getSessionTimestamp();
			this.getSessionId();
		}
	}, {
		key: 'getSessionId',
		value: function getSessionId() {
			if (!this.sessionId) {
				if (!this.userId) {
					this.sessionId = this.getSessionTimestamp() + '_' + this.deviceId;
				} else {
					this.sessionId = this.getSessionTimestamp() + '_' + this.userId;
				}
			}
			return this.sessionId;
		}
	}, {
		key: 'setUserId',
		set: function set(userId) {
			this.userId = userId;
		}
	}, {
		key: 'setDeviceId',
		set: function set(deviceId) {
			this.deviceId = deviceId;
		}
	}, {
		key: 'setScene',
		set: function set(sceneName) {
			this.sceneName = sceneName;
		}
	}]);

	return CognitiveVRAnalyticsCore;
}();

exports.default = { CognitiveVRAnalyticsCore: CognitiveVRAnalyticsCore };