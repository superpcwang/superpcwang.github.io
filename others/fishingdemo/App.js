var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var App;
(function (App) {
    var Game = /** @class */ (function () {
        function Game(canvans) {
            this.m_canvas = canvans;
            Lib.Utilities.init(canvans, 0, 0);
        }
        /* Start this game. */
        Game.prototype.start = function () {
            //Subscribe mouse behavior
            Lib.Message.subscribe("MOUSE_UP", this);
            //Load material
            Lib.MaterialManager.registerMaterial(new Lib.Material("bg01", "asset/BG_01.png", new Lib.Color(255, 225, 225, 255)));
            Lib.MaterialManager.registerMaterial(new Lib.Material("fish02", "asset/fish02.png", new Lib.Color(255, 225, 225, 255)));
            //Load Sound
            //Lib.AudioManager.loadSoundFile("swoosh", "asset/SWOOSH.mp3", false);
            //Load Zone
            //let zoneID = Lib.ZoneManager.createZone("TestZone", "A test for zone.");
            Lib.ZoneManager.changeZone(0);
            this.loop();
        };
        Game.prototype.resize = function () {
            Lib.Utilities.resize();
        };
        /* Object update. */
        Game.prototype.update = function (time) {
            Lib.Utilities.update(time);
        };
        /* Frame render. */
        Game.prototype.render = function () {
            Lib.Utilities.render();
        };
        /* Game main loop
         * Execute once each frame.
         * */
        Game.prototype.loop = function () {
            var delta = performance.now() - this.m_previousTime;
            this.update(delta);
            this.m_previousTime = performance.now();
            this.render();
            requestAnimationFrame(this.loop.bind(this));
        };
        Game.prototype.onMessage = function (message) {
            if (message.code === "MOUSE_UP") {
                var context = message.context;
                document.title = "Pos: [" + context.position.x + ", " + context.position.y + "]";
                //Lib.AudioManager.playSound("swoosh");
            }
        };
        return Game;
    }());
    App.Game = Game;
})(App || (App = {}));
var g_appCanvas;
var g_appGame;
/**
 * Program always start here.
 * */
window.onload = function () {
    g_appCanvas = document.getElementById("App");
    g_appCanvas.width = window.innerWidth;
    g_appCanvas.height = window.innerHeight;
    g_appGame = new App.Game(g_appCanvas);
    g_appGame.start();
};
window.onresize = function () {
    g_appCanvas.width = window.innerWidth;
    g_appCanvas.height = window.innerHeight;
    g_appGame.resize();
    console.info("W:" + g_appCanvas.width + ", H:" + g_appCanvas.height);
};
var Lib;
(function (Lib) {
    var BaseBehavior = /** @class */ (function () {
        function BaseBehavior(data) {
            this.m_data = data;
            this.name = this.m_data.name;
        }
        BaseBehavior.prototype.setOwner = function (owner) {
            this.m_owner = owner;
        };
        BaseBehavior.prototype.update = function (time) {
        };
        BaseBehavior.prototype.load = function () {
        };
        return BaseBehavior;
    }());
    Lib.BaseBehavior = BaseBehavior;
    var BehaviorManager = /** @class */ (function () {
        function BehaviorManager() {
        }
        BehaviorManager.registerBuilder = function (builder) {
            BehaviorManager.m_registeredBuilders[builder.type] = builder;
            console.log("Register behavior builder:" + builder.type);
        };
        //Set component from json file
        BehaviorManager.extractComponent = function (json) {
            if (json.type !== undefined) {
                if (BehaviorManager.m_registeredBuilders[json.type] !== undefined) {
                    return BehaviorManager.m_registeredBuilders[String(json.type)].buildFromJson(json);
                }
                throw new Error("Behavior manager error: builder \"" + json.type + "\" is not registered.");
            }
            throw new Error("Behavior manager error: type is undefined.");
        };
        BehaviorManager.m_registeredBuilders = {};
        return BehaviorManager;
    }());
    Lib.BehaviorManager = BehaviorManager;
})(Lib || (Lib = {}));
/// <reference path="../lib/behavior/behavior.ts" />
var App;
(function (App) {
    var BulletBehaviorData = /** @class */ (function () {
        function BulletBehaviorData() {
            this.bulletSpriteData = new Lib.SpriteComponentData();
            this.bulletCollisionData = new Lib.CollisionComponentData();
            this.bulletExplosionData = new Lib.AnimatedSpriteComponentData();
        }
        BulletBehaviorData.prototype.setFromJson = function (json) {
            if (json.name === undefined) {
                throw new Error("Name must be defined in fishBehavior.");
            }
            this.name = String(json.name);
            if (json.bulletSprite !== undefined) {
                this.bulletSpriteData.setFromJson(json.bulletSprite);
            }
            if (json.bulletCollision !== undefined) {
                this.bulletCollisionData.setFromJson(json.bulletCollision);
            }
            if (json.bulletExplosion !== undefined) {
                this.bulletExplosionData.setFromJson(json.bulletExplosion);
            }
        };
        return BulletBehaviorData;
    }());
    App.BulletBehaviorData = BulletBehaviorData;
    var BulletBehaviorBuilder = /** @class */ (function () {
        function BulletBehaviorBuilder() {
        }
        Object.defineProperty(BulletBehaviorBuilder.prototype, "type", {
            get: function () {
                return "bulletBehavior";
            },
            enumerable: true,
            configurable: true
        });
        BulletBehaviorBuilder.prototype.buildFromJson = function (json) {
            var data = new BulletBehaviorData();
            data.setFromJson(json);
            return new BulletBehavior(data);
        };
        return BulletBehaviorBuilder;
    }());
    App.BulletBehaviorBuilder = BulletBehaviorBuilder;
    var BulletBehavior = /** @class */ (function (_super) {
        __extends(BulletBehavior, _super);
        function BulletBehavior(data) {
            var _this = _super.call(this, data) || this;
            _this.m_explosion = [];
            _this.m_explosionAnimation = [];
            _this.m_explosionIndex = 0;
            _this.m_bulletID = 1000;
            _this.m_bulletSpriteData = data.bulletSpriteData;
            _this.m_bulletCollisionData = data.bulletCollisionData;
            _this.m_bulletExplosionData = data.bulletExplosionData;
            Lib.Message.subscribe("MOUSE_DOWN", _this);
            Lib.Message.subscribe("COLLISION_ENTRY", _this);
            return _this;
        }
        BulletBehavior.prototype.load = function () {
            _super.prototype.load.call(this);
            for (var i = 0; i <= 10; i++) {
                this.m_explosion[i] = new Lib.SimObject(this.m_bulletID, "explosion" + this.m_bulletID);
                this.m_explosionAnimation[i] = new Lib.AnimatedSpriteComponent(this.m_bulletExplosionData);
                this.m_explosion[i].addComponent(this.m_explosionAnimation[i]);
                this.m_owner.addChild(this.m_explosion[i]);
                this.m_explosion[i].load();
                this.m_bulletID++;
            }
            this.m_explosionIndex = 0;
            this.m_cannonAnimator = this.m_owner.parent.getComponentByName("cannonAnimator");
            if (this.m_cannonAnimator === undefined) {
                throw new Error("Get m_cannonAnimator error.");
            }
        };
        BulletBehavior.prototype.update = function (time) {
            _super.prototype.update.call(this, time);
        };
        BulletBehavior.prototype.onMessage = function (message) {
            if (message.code === "MOUSE_DOWN") {
                var context = message.context;
                var bullet = new Lib.SimObject(this.m_bulletID, "bullet" + this.m_bulletID.toString());
                var bulletSprite = new Lib.SpriteComponent(this.m_bulletSpriteData);
                var bulletRigidbody = new Lib.RigidbodyComponent();
                var bulletCollision = new Lib.CollisionComponent(this.m_bulletCollisionData);
                var bulletVelocity = Lib.Vector3.normalize(context.position.toVector3(), this.m_owner.transform.position);
                bulletRigidbody.setVelocity(bulletVelocity.multiply(20));
                bullet.addComponent(bulletRigidbody);
                bullet.addComponent(bulletSprite);
                bullet.addComponent(bulletCollision);
                this.m_owner.addChild(bullet);
                bullet.load();
                this.m_cannonAnimator.getOwner().transform.rotation.z = Lib.Vector3.getAngle(new Lib.Vector3(0, -1, 0), bulletVelocity);
                this.m_cannonAnimator.setState(0);
                this.m_bulletID++;
            }
            else if (message.code === "COLLISION_ENTRY") {
                var context = message.context;
                var bullet = void 0;
                if (context.a.name === "bulletCollision01") {
                    bullet = context.a.getOwner();
                }
                else if (context.b.name === "bulletCollision01") {
                    bullet = context.b.getOwner();
                }
                else {
                    return;
                }
                this.m_explosion[this.m_explosionIndex].transform.position.copyFrom(bullet.transform.position);
                this.m_explosionAnimation[this.m_explosionIndex].reset();
                bullet.transform.position.y = -800;
                this.m_explosionIndex++;
                if (this.m_explosionIndex >= 10) {
                    this.m_explosionIndex = 0;
                }
            }
        };
        return BulletBehavior;
    }(Lib.BaseBehavior));
    App.BulletBehavior = BulletBehavior;
    Lib.BehaviorManager.registerBuilder(new BulletBehaviorBuilder());
})(App || (App = {}));
/// <reference path="../lib/behavior/behavior.ts" />
var App;
(function (App) {
    var FishBehaviorData = /** @class */ (function () {
        function FishBehaviorData() {
            this.speed = 1;
        }
        FishBehaviorData.prototype.setFromJson = function (json) {
            if (json.name === undefined) {
                throw new Error("Name must be defined in fishBehavior.");
            }
            this.name = String(json.name);
            if (json.speed !== undefined) {
                this.speed = Number(json.speed);
            }
        };
        return FishBehaviorData;
    }());
    App.FishBehaviorData = FishBehaviorData;
    var FishBehaviorBuilder = /** @class */ (function () {
        function FishBehaviorBuilder() {
        }
        Object.defineProperty(FishBehaviorBuilder.prototype, "type", {
            get: function () {
                return "fishBehavior";
            },
            enumerable: true,
            configurable: true
        });
        FishBehaviorBuilder.prototype.buildFromJson = function (json) {
            var data = new FishBehaviorData();
            data.setFromJson(json);
            return new FishBehavior(data);
        };
        return FishBehaviorBuilder;
    }());
    App.FishBehaviorBuilder = FishBehaviorBuilder;
    var FishBehavior = /** @class */ (function (_super) {
        __extends(FishBehavior, _super);
        function FishBehavior(data) {
            var _this = _super.call(this, data) || this;
            _this.m_speed = 1;
            _this.m_life = 5;
            _this.m_speed = data.speed;
            Lib.Message.subscribe("COLLISION_ENTRY", _this);
            return _this;
        }
        FishBehavior.prototype.load = function () {
            _super.prototype.load.call(this);
        };
        FishBehavior.prototype.update = function (time) {
            _super.prototype.update.call(this, time);
            this.m_owner.transform.position.x += this.m_speed;
            var x = this.m_owner.transform.position.x;
            if (x > 900) {
                this.m_owner.transform.position.x = -100;
            }
            if (this.m_fishAnimator !== undefined) {
                if (this.m_life < 0) {
                    this.m_fishAnimator.setState(1);
                    this.m_life = 1000;
                }
                if (this.m_life > 500 && this.m_fishAnimator.isDone()) {
                    this.m_fishAnimator.getOwner().transform.position.x = -220;
                    this.m_life = 5;
                    this.m_fishAnimator.setState(0);
                }
            }
        };
        FishBehavior.prototype.onMessage = function (message) {
            if (message.code === "COLLISION_ENTRY") {
                var context = message.context;
                var fish = void 0;
                if (context.a.name === "fish01Collision") {
                    fish = context.a.getOwner();
                }
                else if (context.b.name === "fish01Collision") {
                    fish = context.b.getOwner();
                }
                else {
                    return;
                }
                this.m_fishAnimator = fish.getComponentByName("fish01Animator");
                if (this.m_fishAnimator === undefined) {
                    throw new Error("Get m_fishAnimator error.");
                }
                this.m_life--;
            }
        };
        return FishBehavior;
    }(Lib.BaseBehavior));
    App.FishBehavior = FishBehavior;
    Lib.BehaviorManager.registerBuilder(new FishBehaviorBuilder());
})(App || (App = {}));
var Lib;
(function (Lib) {
    Lib.MESSAGE_ASSET_LOADER_ASSET_LOADED = "MESSAGE_ASSET_LOADER_ASSET_LOADED::";
    var AssetManager = /** @class */ (function () {
        function AssetManager() {
        }
        AssetManager.initialize = function () {
            AssetManager.m_loader.push(new ImageAssetLoader());
            AssetManager.m_loader.push(new JsonAssetLoader());
        };
        AssetManager.registerLoader = function (loader) {
            AssetManager.m_loader.push(loader);
        };
        AssetManager.onAssetLoaded = function (asset) {
            AssetManager.m_loadedAsset[asset.name] = asset;
            Lib.Message.send(Lib.MESSAGE_ASSET_LOADER_ASSET_LOADED + asset.name, this, asset);
        };
        AssetManager.loadAsset = function (assetName) {
            //Get file extension
            var extension = assetName.split('.').pop().toLowerCase();
            for (var _i = 0, _a = AssetManager.m_loader; _i < _a.length; _i++) {
                var l = _a[_i];
                if (l.suppertedExtensions.indexOf(extension) !== -1) {
                    l.loadAsset(assetName);
                    return;
                }
            }
            console.warn("Unable to load asset with extension:" + extension);
        };
        AssetManager.isAssetLoader = function (assetName) {
            return AssetManager.m_loadedAsset[assetName] !== undefined;
        };
        AssetManager.getAsset = function (assetName) {
            if (AssetManager.m_loadedAsset[assetName] !== undefined) {
                return AssetManager.m_loadedAsset[assetName];
            }
            else {
                AssetManager.loadAsset(assetName);
            }
            return undefined;
        };
        AssetManager.m_loader = [];
        AssetManager.m_loadedAsset = {};
        return AssetManager;
    }());
    Lib.AssetManager = AssetManager;
    var ImageAsset = /** @class */ (function () {
        function ImageAsset(name, data) {
            this.name = name;
            this.data = data;
        }
        Object.defineProperty(ImageAsset.prototype, "width", {
            get: function () {
                return this.data.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ImageAsset.prototype, "height", {
            get: function () {
                return this.data.height;
            },
            enumerable: true,
            configurable: true
        });
        return ImageAsset;
    }());
    Lib.ImageAsset = ImageAsset;
    var ImageAssetLoader = /** @class */ (function () {
        function ImageAssetLoader() {
        }
        Object.defineProperty(ImageAssetLoader.prototype, "suppertedExtensions", {
            get: function () {
                return ["png", "gif", "jpg"];
            },
            enumerable: true,
            configurable: true
        });
        ImageAssetLoader.prototype.loadAsset = function (assetName) {
            var image = new Image();
            image.onload = (this.onImageLoaded.bind(this, assetName, image));
            image.src = assetName;
        };
        ImageAssetLoader.prototype.onImageLoaded = function (assetName, image) {
            console.log("OnImageLoaded: assetName/image", assetName, image);
            var asset = new ImageAsset(assetName, image);
            AssetManager.onAssetLoaded(asset);
        };
        return ImageAssetLoader;
    }());
    Lib.ImageAssetLoader = ImageAssetLoader;
    var JsonAsset = /** @class */ (function () {
        function JsonAsset(name, data) {
            this.name = name;
            this.data = data;
        }
        return JsonAsset;
    }());
    Lib.JsonAsset = JsonAsset;
    var JsonAssetLoader = /** @class */ (function () {
        function JsonAssetLoader() {
        }
        Object.defineProperty(JsonAssetLoader.prototype, "suppertedExtensions", {
            get: function () {
                return ["json"];
            },
            enumerable: true,
            configurable: true
        });
        JsonAssetLoader.prototype.loadAsset = function (assetName) {
            var request = new XMLHttpRequest();
            request.open("GET", assetName);
            request.addEventListener("load", this.onJsonLoaded.bind(this, assetName, request));
            request.send();
        };
        JsonAssetLoader.prototype.onJsonLoaded = function (assetName, request) {
            console.log("onJsonLoaded: assetName/request", assetName, request);
            if (request.readyState === request.DONE) {
                var json = JSON.parse(request.responseText);
                var asset = new JsonAsset(assetName, json);
                AssetManager.onAssetLoaded(asset);
            }
        };
        return JsonAssetLoader;
    }());
    Lib.JsonAssetLoader = JsonAssetLoader;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var SoundEffect = /** @class */ (function () {
        function SoundEffect(path, loop) {
            this.m_player = new Audio(path);
            this.m_player.loop = loop;
        }
        Object.defineProperty(SoundEffect.prototype, "loop", {
            get: function () {
                return this.m_player.loop;
            },
            set: function (value) {
                this.m_player.loop = value;
            },
            enumerable: true,
            configurable: true
        });
        SoundEffect.prototype.destory = function () {
            this.m_player = undefined;
        };
        SoundEffect.prototype.play = function () {
            if (!this.m_player.paused) {
                this.stop();
            }
            this.m_player.play();
        };
        SoundEffect.prototype.pause = function () {
            this.m_player.pause();
        };
        SoundEffect.prototype.stop = function () {
            this.m_player.pause();
            this.m_player.currentTime = 0;
        };
        return SoundEffect;
    }());
    Lib.SoundEffect = SoundEffect;
    var AudioManager = /** @class */ (function () {
        function AudioManager() {
        }
        AudioManager.loadSoundFile = function (name, assetPath, loop) {
            AudioManager.m_soundEffects[name] = new SoundEffect(assetPath, loop);
        };
        AudioManager.playSound = function (name) {
            if (AudioManager.m_soundEffects[name] !== undefined) {
                AudioManager.m_soundEffects[name].play();
            }
        };
        AudioManager.stopSound = function (name) {
            if (AudioManager.m_soundEffects[name] !== undefined) {
                AudioManager.m_soundEffects[name].stop();
            }
        };
        AudioManager.pauseSound = function (name) {
            if (AudioManager.m_soundEffects[name] !== undefined) {
                AudioManager.m_soundEffects[name].pause();
            }
        };
        AudioManager.stopAll = function (name) {
            for (var i in AudioManager.m_soundEffects) {
                AudioManager.m_soundEffects[i].stop();
            }
        };
        AudioManager.pauseAll = function (name) {
            for (var i in AudioManager.m_soundEffects) {
                AudioManager.m_soundEffects[i].pause();
            }
        };
        AudioManager.m_soundEffects = {};
        return AudioManager;
    }());
    Lib.AudioManager = AudioManager;
})(Lib || (Lib = {}));
//namespace Lib {
//}
/// <reference path="behavior.ts" />
var Lib;
(function (Lib) {
    var keyboardMovementBehaviorData = /** @class */ (function () {
        function keyboardMovementBehaviorData() {
            this.speed = 1;
        }
        keyboardMovementBehaviorData.prototype.setFromJson = function (json) {
            if (json.name === undefined) {
                throw new Error("Name must be defined in keyboardMovement.");
            }
            this.name = String(json.name);
            if (json.speed !== undefined) {
                this.speed = Number(json.speed);
            }
        };
        return keyboardMovementBehaviorData;
    }());
    Lib.keyboardMovementBehaviorData = keyboardMovementBehaviorData;
    var keyboardMovementBehaviorBuilder = /** @class */ (function () {
        function keyboardMovementBehaviorBuilder() {
        }
        Object.defineProperty(keyboardMovementBehaviorBuilder.prototype, "type", {
            get: function () {
                return "keyboardMovement";
            },
            enumerable: true,
            configurable: true
        });
        keyboardMovementBehaviorBuilder.prototype.buildFromJson = function (json) {
            var data = new keyboardMovementBehaviorData();
            data.setFromJson(json);
            return new keyboardMovementBehavior(data);
        };
        return keyboardMovementBehaviorBuilder;
    }());
    Lib.keyboardMovementBehaviorBuilder = keyboardMovementBehaviorBuilder;
    var keyboardMovementBehavior = /** @class */ (function (_super) {
        __extends(keyboardMovementBehavior, _super);
        function keyboardMovementBehavior(data) {
            var _this = _super.call(this, data) || this;
            _this.speed = 0.1;
            _this.speed = data.speed;
            return _this;
        }
        keyboardMovementBehavior.prototype.update = function (time) {
            if (Lib.InputManager.isKeyDown(Lib.Keys.LEFT)) {
                this.m_owner.transform.position.x -= this.speed;
            }
            if (Lib.InputManager.isKeyDown(Lib.Keys.RIGHT)) {
                this.m_owner.transform.position.x += this.speed;
            }
            if (Lib.InputManager.isKeyDown(Lib.Keys.UP)) {
                this.m_owner.transform.position.y -= this.speed;
            }
            if (Lib.InputManager.isKeyDown(Lib.Keys.DOWN)) {
                this.m_owner.transform.position.y += this.speed;
            }
            _super.prototype.update.call(this, time);
        };
        return keyboardMovementBehavior;
    }(Lib.BaseBehavior));
    Lib.keyboardMovementBehavior = keyboardMovementBehavior;
    Lib.BehaviorManager.registerBuilder(new keyboardMovementBehaviorBuilder());
})(Lib || (Lib = {}));
/// <reference path="behavior.ts" />
var Lib;
(function (Lib) {
    var RotationBehaviorData = /** @class */ (function () {
        function RotationBehaviorData() {
            this.rotation = Lib.Vector3.zero;
        }
        RotationBehaviorData.prototype.setFromJson = function (json) {
            if (json.name === undefined) {
                throw new Error("Name must be defined in rotation.");
            }
            this.name = String(json.name);
            if (json.rotation !== undefined) {
                this.rotation.setFromJson(json.rotation);
            }
        };
        return RotationBehaviorData;
    }());
    Lib.RotationBehaviorData = RotationBehaviorData;
    var RotationBehaviorBuilder = /** @class */ (function () {
        function RotationBehaviorBuilder() {
        }
        Object.defineProperty(RotationBehaviorBuilder.prototype, "type", {
            get: function () {
                return "rotation";
            },
            enumerable: true,
            configurable: true
        });
        RotationBehaviorBuilder.prototype.buildFromJson = function (json) {
            var data = new RotationBehaviorData();
            data.setFromJson(json);
            return new RotationBehavior(data);
        };
        return RotationBehaviorBuilder;
    }());
    Lib.RotationBehaviorBuilder = RotationBehaviorBuilder;
    var RotationBehavior = /** @class */ (function (_super) {
        __extends(RotationBehavior, _super);
        function RotationBehavior(data) {
            var _this = _super.call(this, data) || this;
            _this.m_rotation = data.rotation;
            return _this;
        }
        RotationBehavior.prototype.update = function (time) {
            this.m_owner.transform.rotation.add(this.m_rotation);
            _super.prototype.update.call(this, time);
        };
        return RotationBehavior;
    }(Lib.BaseBehavior));
    Lib.RotationBehavior = RotationBehavior;
    Lib.BehaviorManager.registerBuilder(new RotationBehaviorBuilder());
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var CollisionData = /** @class */ (function () {
        function CollisionData(time, a, b) {
            this.time = 0;
            this.time = time;
            this.a = a;
            this.b = b;
        }
        return CollisionData;
    }());
    Lib.CollisionData = CollisionData;
    var CollisionManager = /** @class */ (function () {
        function CollisionManager() {
        }
        CollisionManager.initialize = function () {
            CollisionManager.m_totalTime = 0;
            CollisionManager.clear();
        };
        CollisionManager.registerCollisionComponent = function (component) {
            CollisionManager.m_components.push(component);
        };
        CollisionManager.unRegisterCollisionComponent = function (component) {
            var index = CollisionManager.m_components.indexOf(component);
            if (index !== -1) {
                CollisionManager.m_components.slice(index, 1);
            }
        };
        CollisionManager.clear = function () {
            CollisionManager.m_components.length = 0;
        };
        CollisionManager.update = function (time) {
            if (isNaN(CollisionManager.m_totalTime)) {
                CollisionManager.m_totalTime = 0;
            }
            this.m_escapetime = time;
            CollisionManager.m_totalTime += this.m_escapetime;
            for (var c = 0; c < CollisionManager.m_components.length; ++c) {
                var comp = CollisionManager.m_components[c];
                for (var o = 0; o < CollisionManager.m_components.length; ++o) {
                    var other = CollisionManager.m_components[o];
                    // Do not check against collisions with self.
                    if (comp === other) {
                        continue;
                    }
                    // If both shapes are static, stop detection.
                    if (comp.isStatic && other.isStatic) {
                        continue;
                    }
                    if (comp.shape.intersects(other.shape)) {
                        // We have a collision!
                        var exists = false;
                        for (var d = 0; d < CollisionManager.m_collisionData.length; ++d) {
                            var data = CollisionManager.m_collisionData[d];
                            if ((data.a === comp && data.b === other) || (data.a === other && data.b === comp)) {
                                // We have existing data. Update it.
                                comp.onCollisionUpdate(other);
                                other.onCollisionUpdate(comp);
                                data.time = CollisionManager.m_totalTime;
                                exists = true;
                                break;
                            }
                        }
                        if (!exists) {
                            // Create a new collision.
                            var col = new CollisionData(CollisionManager.m_totalTime, comp, other);
                            comp.onCollisionEntry(other);
                            other.onCollisionEntry(comp);
                            Lib.Message.sendPriority("COLLISION_ENTRY", undefined, col);
                            CollisionManager.m_collisionData.push(col);
                        }
                    }
                }
            }
            // Remove stale collision data.
            var removeData = [];
            for (var d = 0; d < CollisionManager.m_collisionData.length; ++d) {
                var data = CollisionManager.m_collisionData[d];
                if (data.time !== CollisionManager.m_totalTime) {
                    // Old collision data.
                    removeData.push(data);
                }
            }
            while (removeData.length !== 0) {
                var data = removeData.shift();
                var index = CollisionManager.m_collisionData.indexOf(data);
                CollisionManager.m_collisionData.splice(index, 1);
                data.a.onCollisionExit(data.b);
                data.b.onCollisionExit(data.a);
                Lib.Message.sendPriority("COLLISION_EXIT", undefined, data);
            }
        };
        CollisionManager.m_components = [];
        CollisionManager.m_collisionData = [];
        CollisionManager.m_escapetime = 0;
        CollisionManager.m_totalTime = 0;
        return CollisionManager;
    }());
    Lib.CollisionManager = CollisionManager;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Color = /** @class */ (function () {
        function Color(r, g, b, a) {
            if (r === void 0) { r = 255; }
            if (g === void 0) { g = 255; }
            if (b === void 0) { b = 255; }
            if (a === void 0) { a = 255; }
            this.m_r = r;
            this.m_g = g;
            this.m_b = b;
            this.m_a = a;
        }
        Object.defineProperty(Color.prototype, "r", {
            get: function () {
                return this.m_r;
            },
            set: function (value) {
                this.m_r = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "rFloat", {
            get: function () {
                return this.m_r / 255.0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "g", {
            get: function () {
                return this.m_r;
            },
            set: function (value) {
                this.m_r = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "gFloat", {
            get: function () {
                return this.m_r / 255.0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "b", {
            get: function () {
                return this.m_r;
            },
            set: function (value) {
                this.m_r = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "bFloat", {
            get: function () {
                return this.m_r / 255.0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "a", {
            get: function () {
                return this.m_r;
            },
            set: function (value) {
                this.m_r = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Color.prototype, "aFloat", {
            get: function () {
                return this.m_r / 255.0;
            },
            enumerable: true,
            configurable: true
        });
        Color.prototype.toArray = function () {
            return [this.m_r, this.m_g, this.m_b, this.m_a];
        };
        Color.prototype.toFloatrray = function () {
            return [this.m_r / 255.0, this.m_g / 255.0, this.m_b / 255.0, this.m_a / 255.0];
        };
        Color.prototype.toFloat32Array = function () {
            return new Float32Array(this.toFloatrray());
        };
        Color.white = function () {
            return new Color(255, 255, 255, 255);
        };
        Color.black = function () {
            return new Color(0, 0, 0, 255);
        };
        Color.red = function () {
            return new Color(255, 0, 0, 255);
        };
        Color.green = function () {
            return new Color(0, 255, 0, 255);
        };
        Color.blue = function () {
            return new Color(0, 0, 255, 255);
        };
        return Color;
    }());
    Lib.Color = Color;
})(Lib || (Lib = {}));
//namespace Lib {
//
//
//      
//}
var Lib;
(function (Lib) {
    var BaseComponent = /** @class */ (function () {
        function BaseComponent(data) {
            this.name = "";
            if (data !== undefined) {
                this.data = data;
                this.name = data.name;
            }
        }
        BaseComponent.prototype.getOwner = function () {
            return this.owner;
        };
        BaseComponent.prototype.setOwner = function (owner) {
            this.owner = owner;
        };
        BaseComponent.prototype.load = function () {
        };
        BaseComponent.prototype.update = function (time) {
        };
        BaseComponent.prototype.render = function (shader) {
        };
        return BaseComponent;
    }());
    Lib.BaseComponent = BaseComponent;
    var ComponentManager = /** @class */ (function () {
        function ComponentManager() {
        }
        ComponentManager.registerBuilder = function (builder) {
            ComponentManager.m_registeredBuilders[builder.type] = builder;
            console.log("Register component builder:" + builder.type);
        };
        //Set component from json file
        ComponentManager.extractComponent = function (json) {
            if (json.type !== undefined) {
                if (ComponentManager.m_registeredBuilders[json.type] !== undefined) {
                    return ComponentManager.m_registeredBuilders[String(json.type)].buildFromJson(json);
                }
                throw new Error("Component manager error: builder is not registered.");
            }
            throw new Error("Component manager error: type is undefined.");
        };
        ComponentManager.m_registeredBuilders = {};
        return ComponentManager;
    }());
    Lib.ComponentManager = ComponentManager;
})(Lib || (Lib = {}));
/// <reference path="component.ts" />
var Lib;
(function (Lib) {
    var SpriteComponentData = /** @class */ (function () {
        function SpriteComponentData() {
            this.origin = Lib.Vector3.zero;
        }
        SpriteComponentData.prototype.setFromJson = function (json) {
            if (json.name === undefined) {
                throw new Error("Sprite name is undefined in file.");
            }
            else {
                this.name = String(json.name);
            }
            if (json.materialName === undefined) {
                throw new Error("Sprite:" + this.name + " materialName is undefined in file.");
            }
            else {
                this.materialName = String(json.materialName);
            }
            if (json.width === undefined) {
                throw new Error("Sprite:" + this.name + " width is undefined in file.");
            }
            else {
                this.width = Number(json.width);
            }
            if (json.height === undefined) {
                throw new Error("Sprite:" + this.name + " height is undefined in file.");
            }
            else {
                this.height = Number(json.height);
            }
            if (json.origin !== undefined) {
                this.origin.setFromJson(json.origin);
            }
        };
        return SpriteComponentData;
    }());
    Lib.SpriteComponentData = SpriteComponentData;
    var SpriteComponentBuilder = /** @class */ (function () {
        function SpriteComponentBuilder() {
        }
        Object.defineProperty(SpriteComponentBuilder.prototype, "type", {
            get: function () {
                return "sprite";
            },
            enumerable: true,
            configurable: true
        });
        SpriteComponentBuilder.prototype.buildFromJson = function (json) {
            var data = new SpriteComponentData();
            data.setFromJson(json);
            return new SpriteComponent(data);
        };
        return SpriteComponentBuilder;
    }());
    Lib.SpriteComponentBuilder = SpriteComponentBuilder;
    var SpriteComponent = /** @class */ (function (_super) {
        __extends(SpriteComponent, _super);
        function SpriteComponent(data) {
            var _this = _super.call(this, data) || this;
            _this.m_sprite = new Lib.Sprite(data.name, data.materialName, data.width, data.height, data.origin);
            return _this;
        }
        SpriteComponent.prototype.load = function () {
            this.m_sprite.load();
        };
        SpriteComponent.prototype.render = function (shader) {
            this.m_sprite.draw(shader, this.owner.worldMatrix);
            _super.prototype.render.call(this, shader);
        };
        return SpriteComponent;
    }(Lib.BaseComponent));
    Lib.SpriteComponent = SpriteComponent;
    Lib.ComponentManager.registerBuilder(new SpriteComponentBuilder());
})(Lib || (Lib = {}));
/// <reference path="component.ts" />
/// <reference path="spritecomponent.ts" />
var Lib;
(function (Lib) {
    var AnimatedSpriteComponentData = /** @class */ (function (_super) {
        __extends(AnimatedSpriteComponentData, _super);
        function AnimatedSpriteComponentData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.assetWidth = 0;
            _this.assetHeight = 0;
            _this.frameWidth = 0;
            _this.frameHeight = 0;
            _this.frameCount = 0;
            _this.frameSequence = [];
            _this.frameRate = 100;
            _this.playMode = "";
            return _this;
        }
        AnimatedSpriteComponentData.prototype.setFromJson = function (json) {
            _super.prototype.setFromJson.call(this, json);
            if (json.assetWidth === undefined) {
                throw new Error("Sprite:" + this.name + " assetWidth is undefined in file.");
            }
            else {
                this.assetWidth = Number(json.assetWidth);
            }
            if (json.assetHeight === undefined) {
                throw new Error("Sprite:" + this.name + " assetHeight is undefined in file.");
            }
            else {
                this.assetHeight = Number(json.assetHeight);
            }
            if (json.frameWidth === undefined) {
                throw new Error("Sprite:" + this.name + " frameWidth is undefined in file.");
            }
            else {
                this.frameWidth = Number(json.frameWidth);
            }
            if (json.frameHeight === undefined) {
                throw new Error("Sprite:" + this.name + " frameHeight is undefined in file.");
            }
            else {
                this.frameHeight = Number(json.frameHeight);
            }
            if (json.frameCount === undefined) {
                throw new Error("Sprite:" + this.name + " frameCount is undefined in file.");
            }
            else {
                this.frameCount = Number(json.frameCount);
            }
            if (json.frameSequence === undefined) {
                throw new Error("Sprite:" + this.name + " frameSequence is undefined in file.");
            }
            else {
                this.frameSequence = json.frameSequence;
            }
            if (json.frameRate !== undefined) {
                this.frameRate = Number(json.frameRate);
            }
            if (json.playMode === undefined) {
                throw new Error("Sprite:" + this.name + " playMode is undefined in file.");
            }
            else {
                this.playMode = json.playMode;
            }
        };
        return AnimatedSpriteComponentData;
    }(Lib.SpriteComponentData));
    Lib.AnimatedSpriteComponentData = AnimatedSpriteComponentData;
    var AnimatedSpriteComponentBuilder = /** @class */ (function () {
        function AnimatedSpriteComponentBuilder() {
        }
        Object.defineProperty(AnimatedSpriteComponentBuilder.prototype, "type", {
            get: function () {
                return "animatedSprite";
            },
            enumerable: true,
            configurable: true
        });
        AnimatedSpriteComponentBuilder.prototype.buildFromJson = function (json) {
            var data = new AnimatedSpriteComponentData();
            data.setFromJson(json);
            return new AnimatedSpriteComponent(data);
        };
        return AnimatedSpriteComponentBuilder;
    }());
    Lib.AnimatedSpriteComponentBuilder = AnimatedSpriteComponentBuilder;
    var AnimatedSpriteComponent = /** @class */ (function (_super) {
        __extends(AnimatedSpriteComponent, _super);
        function AnimatedSpriteComponent(data) {
            var _this = _super.call(this, data) || this;
            _this.m_sprite = new Lib.AnimatedSprite(data.name, data.materialName, data.width, data.height, data.origin, data.assetWidth, data.assetHeight, data.frameWidth, data.frameHeight, data.frameCount, data.frameSequence, data.frameRate, data.playMode);
            return _this;
        }
        AnimatedSpriteComponent.prototype.load = function () {
            this.m_sprite.load();
        };
        AnimatedSpriteComponent.prototype.update = function (time) {
            _super.prototype.update.call(this, time);
            this.m_sprite.update(time);
        };
        AnimatedSpriteComponent.prototype.render = function (shader) {
            _super.prototype.render.call(this, shader);
            this.m_sprite.draw(shader, this.owner.worldMatrix);
        };
        AnimatedSpriteComponent.prototype.isDone = function () {
            return this.m_sprite.isDone();
        };
        AnimatedSpriteComponent.prototype.reset = function () {
            this.m_sprite.reset();
        };
        return AnimatedSpriteComponent;
    }(Lib.BaseComponent));
    Lib.AnimatedSpriteComponent = AnimatedSpriteComponent;
    Lib.ComponentManager.registerBuilder(new AnimatedSpriteComponentBuilder());
})(Lib || (Lib = {}));
/// <reference path="component.ts" />
/// <reference path="animatedspritecomponent.ts" />
var Lib;
(function (Lib) {
    var AnimatorComponentData = /** @class */ (function () {
        function AnimatorComponentData() {
            this.animates = [];
        }
        AnimatorComponentData.prototype.setFromJson = function (json) {
            if (json.name === undefined) {
                throw new Error("Animator name is undefined in file.");
            }
            else {
                this.name = String(json.name);
            }
            if (json.animates !== undefined) {
                for (var a in json.animates) {
                    var data = new Lib.AnimatedSpriteComponentData();
                    data.setFromJson(json.animates[a]);
                    this.animates[a] = data;
                }
            }
        };
        return AnimatorComponentData;
    }());
    Lib.AnimatorComponentData = AnimatorComponentData;
    var AnimatorComponentBuilder = /** @class */ (function () {
        function AnimatorComponentBuilder() {
        }
        Object.defineProperty(AnimatorComponentBuilder.prototype, "type", {
            get: function () {
                return "animator";
            },
            enumerable: true,
            configurable: true
        });
        AnimatorComponentBuilder.prototype.buildFromJson = function (json) {
            var data = new AnimatorComponentData();
            data.setFromJson(json);
            return new AnimatorComponent(data);
        };
        return AnimatorComponentBuilder;
    }());
    Lib.AnimatorComponentBuilder = AnimatorComponentBuilder;
    var AnimatorComponent = /** @class */ (function (_super) {
        __extends(AnimatorComponent, _super);
        function AnimatorComponent(data) {
            var _this = _super.call(this, data) || this;
            _this.m_animates = [];
            _this.m_state = 0;
            if (data !== undefined) {
                for (var a in data.animates) {
                    var component = new Lib.AnimatedSpriteComponent(data.animates[a]);
                    _this.m_animates[a] = component;
                }
            }
            return _this;
        }
        AnimatorComponent.prototype.load = function () {
            _super.prototype.load.call(this);
            for (var a in this.m_animates) {
                this.m_animates[a].setOwner(this.getOwner());
                this.m_animates[a].load();
            }
            this.m_state = 0;
        };
        AnimatorComponent.prototype.update = function (time) {
            _super.prototype.update.call(this, time);
            this.m_animates[this.m_state].update(time);
        };
        AnimatorComponent.prototype.setState = function (state) {
            this.m_state = state;
            this.m_animates[this.m_state].reset();
        };
        AnimatorComponent.prototype.isDone = function () {
            return this.m_animates[this.m_state].isDone();
        };
        AnimatorComponent.prototype.render = function (shader) {
            _super.prototype.render.call(this, shader);
            this.m_animates[this.m_state].render(shader);
        };
        return AnimatorComponent;
    }(Lib.BaseComponent));
    Lib.AnimatorComponent = AnimatorComponent;
    Lib.ComponentManager.registerBuilder(new AnimatorComponentBuilder());
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var CollisionComponentData = /** @class */ (function () {
        function CollisionComponentData() {
            this.static = false;
        }
        CollisionComponentData.prototype.setFromJson = function (json) {
            if (json.name !== undefined) {
                this.name = String(json.name);
            }
            if (json.static !== undefined) {
                this.static = Boolean(json.static);
            }
            if (json.shape === undefined) {
                throw new Error("CollisionComponentData requires shape.");
            }
            else {
                if (json.shape.type === undefined) {
                    throw new Error("CollisionComponentData requires 'shape.type'.");
                }
                this.shapeData = json.shape;
            }
        };
        return CollisionComponentData;
    }());
    Lib.CollisionComponentData = CollisionComponentData;
    var CollisionComponentBuilder = /** @class */ (function () {
        function CollisionComponentBuilder() {
        }
        Object.defineProperty(CollisionComponentBuilder.prototype, "type", {
            get: function () {
                return "collision";
            },
            enumerable: true,
            configurable: true
        });
        CollisionComponentBuilder.prototype.buildFromJson = function (json) {
            var data = new CollisionComponentData();
            data.setFromJson(json);
            return new CollisionComponent(data);
        };
        return CollisionComponentBuilder;
    }());
    Lib.CollisionComponentBuilder = CollisionComponentBuilder;
    /**
     * A collision component. Likely to be removed when collision system is replaced.
     */
    var CollisionComponent = /** @class */ (function (_super) {
        __extends(CollisionComponent, _super);
        function CollisionComponent(data) {
            var _this = _super.call(this, data) || this;
            if (data.shapeData.type == "circle") {
                _this.m_shape = new Lib.Circle2D();
            }
            else if (data.shapeData.type == "rectangle") {
                _this.m_shape = new Lib.Rectangle2D();
            }
            _this.m_shape.setFromJson(data.shapeData);
            _this.m_static = data.static;
            return _this;
        }
        Object.defineProperty(CollisionComponent.prototype, "shape", {
            get: function () {
                return this.m_shape;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CollisionComponent.prototype, "isStatic", {
            get: function () {
                return this.m_static;
            },
            enumerable: true,
            configurable: true
        });
        CollisionComponent.prototype.load = function () {
            _super.prototype.load.call(this);
            // TODO: need to get world position for nested objects.
            //this.m_shape.position.copyFrom(this.owner.getWorldPosition().toVector2().subtract(this.m_shape.offset));
            this.m_shape.position.copyFrom(this.owner.getWorldPosition().toVector2());
            // Tell the collision manager that we exist.
            Lib.CollisionManager.registerCollisionComponent(this);
        };
        CollisionComponent.prototype.update = function (time) {
            // TODO: need to get world position for nested objects.
            //this.m_shape.position.copyFrom(this.owner.getWorldPosition().toVector2().subtract(this.m_shape.offset));
            _super.prototype.update.call(this, time);
            this.m_shape.position.copyFrom(this.owner.getWorldPosition().toVector2());
        };
        CollisionComponent.prototype.render = function (shader) {
            //this._sprite.draw( shader, this.owner.worldMatrix );
            _super.prototype.render.call(this, shader);
        };
        CollisionComponent.prototype.onCollisionEntry = function (other) {
            console.log("onCollisionEntry:", this, other);
        };
        CollisionComponent.prototype.onCollisionUpdate = function (other) {
            //console.log("onCollisionUpdate:", this, other);
        };
        CollisionComponent.prototype.onCollisionExit = function (other) {
            console.log("onCollisionExit:", this, other);
        };
        return CollisionComponent;
    }(Lib.BaseComponent));
    Lib.CollisionComponent = CollisionComponent;
    Lib.ComponentManager.registerBuilder(new CollisionComponentBuilder());
})(Lib || (Lib = {}));
/// <reference path="component.ts" />
var Lib;
(function (Lib) {
    var RigidbodyComponentData = /** @class */ (function () {
        function RigidbodyComponentData() {
            this.velocity = Lib.Vector3.zero;
        }
        RigidbodyComponentData.prototype.setFromJson = function (json) {
            if (json.name === undefined) {
                throw new Error("Sprite name is undefined in file.");
            }
            this.name = String(json.name);
            if (json.velocity !== undefined) {
                this.velocity.setFromJson(json.velocity);
            }
        };
        return RigidbodyComponentData;
    }());
    Lib.RigidbodyComponentData = RigidbodyComponentData;
    var RigidbodyComponentBuilder = /** @class */ (function () {
        function RigidbodyComponentBuilder() {
        }
        Object.defineProperty(RigidbodyComponentBuilder.prototype, "type", {
            get: function () {
                return "rigidbody";
            },
            enumerable: true,
            configurable: true
        });
        RigidbodyComponentBuilder.prototype.buildFromJson = function (json) {
            var data = new RigidbodyComponentData();
            data.setFromJson(json);
            return new RigidbodyComponent(data);
        };
        return RigidbodyComponentBuilder;
    }());
    Lib.RigidbodyComponentBuilder = RigidbodyComponentBuilder;
    var RigidbodyComponent = /** @class */ (function (_super) {
        __extends(RigidbodyComponent, _super);
        function RigidbodyComponent(data) {
            var _this = _super.call(this, data) || this;
            _this.m_velocity = Lib.Vector3.zero;
            if (data !== undefined) {
                _this.m_velocity = data.velocity;
            }
            return _this;
        }
        RigidbodyComponent.prototype.update = function (time) {
            _super.prototype.update.call(this, time);
            this.owner.transform.position.add(this.m_velocity);
            this.owner.transform.rotation.z = Lib.Vector3.getAngle(new Lib.Vector3(0, -1, 0), this.m_velocity);
        };
        RigidbodyComponent.prototype.setVelocity = function (v) {
            this.m_velocity = v;
        };
        return RigidbodyComponent;
    }(Lib.BaseComponent));
    Lib.RigidbodyComponent = RigidbodyComponent;
    Lib.ComponentManager.registerBuilder(new RigidbodyComponentBuilder());
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Keys;
    (function (Keys) {
        Keys[Keys["LEFT"] = 37] = "LEFT";
        Keys[Keys["UP"] = 38] = "UP";
        Keys[Keys["RIGHT"] = 39] = "RIGHT";
        Keys[Keys["DOWN"] = 40] = "DOWN";
    })(Keys = Lib.Keys || (Lib.Keys = {}));
    var MouseContext = /** @class */ (function () {
        function MouseContext(leftDown, rightDown, position) {
            this.leftDown = leftDown;
            this.rightDown = rightDown;
            this.position = position;
        }
        return MouseContext;
    }());
    Lib.MouseContext = MouseContext;
    var InputManager = /** @class */ (function () {
        function InputManager() {
        }
        InputManager.initialize = function () {
            for (var i = 0; i < 255; i++) {
                InputManager.m_keys[i] = false;
            }
            window.addEventListener("keydown", InputManager.onKeyDown);
            window.addEventListener("keyup", InputManager.onKeyUp);
            window.addEventListener("mousemove", InputManager.onMouseMove);
            window.addEventListener("mousedown", InputManager.onMouseDown);
            window.addEventListener("mouseup", InputManager.onMouseUp);
        };
        InputManager.isKeyDown = function (key) {
            return InputManager.m_keys[key];
        };
        InputManager.onKeyDown = function (event) {
            InputManager.m_keys[event.keyCode] = true;
            return true;
            //Disable all key function
            //event.preventDefault();
            //event.stopPropagation();
            //return false;
        };
        InputManager.onKeyUp = function (event) {
            InputManager.m_keys[event.keyCode] = false;
            return true;
            //Disable all key function
            //event.preventDefault();
            //event.stopPropagation();
            //return false;
        };
        InputManager.getMousePosition = function () {
            return new Lib.Vector2(this.m_mouseX, this.m_mouseY);
        };
        InputManager.onMouseMove = function (event) {
            InputManager.m_previousMouseX = InputManager.m_mouseX;
            InputManager.m_previousMouseY = InputManager.m_mouseY;
            InputManager.m_mouseX = event.clientX;
            InputManager.m_mouseY = event.clientY;
        };
        InputManager.onMouseDown = function (event) {
            if (event.button === 0) {
                this.m_leftDown = true;
            }
            else if (event.button === 2) {
                this.m_rightDown = true;
            }
            Lib.Message.send("MOUSE_DOWN", this, new MouseContext(InputManager.m_leftDown, InputManager.m_rightDown, InputManager.getMousePosition()));
        };
        InputManager.onMouseUp = function (event) {
            if (event.button === 0) {
                this.m_leftDown = false;
            }
            else if (event.button === 2) {
                this.m_rightDown = false;
            }
            Lib.Message.send("MOUSE_UP", this, new MouseContext(InputManager.m_leftDown, InputManager.m_rightDown, InputManager.getMousePosition()));
        };
        InputManager.m_keys = [];
        InputManager.m_leftDown = false;
        InputManager.m_rightDown = false;
        return InputManager;
    }());
    Lib.InputManager = InputManager;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Material = /** @class */ (function () {
        function Material(name, diffuseTextureName, tint) {
            this.m_name = name;
            this.m_diffuseTextureName = diffuseTextureName;
            this.m_tint = tint;
            if (this.m_diffuseTextureName !== undefined) {
                this.m_diffuseTexture = Lib.TextureManager.getTexture(this.m_diffuseTextureName);
            }
        }
        Object.defineProperty(Material.prototype, "name", {
            get: function () {
                return this.m_name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "diffuseTextureName", {
            get: function () {
                return this.m_diffuseTextureName;
            },
            set: function (name) {
                if (this.m_diffuseTexture !== undefined) {
                    Lib.TextureManager.releaseTexture(this.m_diffuseTextureName);
                }
                this.m_diffuseTextureName = name;
                if (this.m_diffuseTextureName !== undefined) {
                    this.m_diffuseTexture = Lib.TextureManager.getTexture(this.m_diffuseTextureName);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "diffuseTexture", {
            get: function () {
                return this.m_diffuseTexture;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "tint", {
            get: function () {
                return this.m_tint;
            },
            enumerable: true,
            configurable: true
        });
        Material.prototype.destory = function () {
            Lib.TextureManager.releaseTexture(this.m_diffuseTextureName);
            this.m_diffuseTexture = undefined;
        };
        return Material;
    }());
    Lib.Material = Material;
    var MaterialReferenceNode = /** @class */ (function () {
        function MaterialReferenceNode(material) {
            this.referenceCount = 0;
            this.material = material;
        }
        return MaterialReferenceNode;
    }());
    var MaterialManager = /** @class */ (function () {
        function MaterialManager() {
        }
        MaterialManager.registerMaterial = function (material) {
            if (MaterialManager.m_materials[material.name] === undefined) {
                MaterialManager.m_materials[material.name] = new MaterialReferenceNode(material);
            }
        };
        MaterialManager.getMaterial = function (name) {
            if (MaterialManager.m_materials[name] === undefined) {
                return undefined;
            }
            else {
                MaterialManager.m_materials[name].referenceCount++;
                return MaterialManager.m_materials[name].material;
            }
        };
        MaterialManager.releaseMaterial = function (name) {
            if (MaterialManager.m_materials[name] === undefined) {
                console.warn("Material:" + name + "has not been registerd.");
            }
            else {
                MaterialManager.m_materials[name].referenceCount--;
                if (MaterialManager.m_materials[name].referenceCount < 1) {
                    MaterialManager.m_materials[name].material.destory();
                    MaterialManager.m_materials[name].material = undefined;
                    delete MaterialManager.m_materials[name].material;
                }
            }
        };
        MaterialManager.m_materials = {};
        return MaterialManager;
    }());
    Lib.MaterialManager = MaterialManager;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Scene = /** @class */ (function () {
        function Scene() {
            this.m_root = new Lib.SimObject(0, "__ROOT__");
        }
        Object.defineProperty(Scene.prototype, "root", {
            get: function () {
                return this.m_root;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "isLoaded", {
            get: function () {
                return this.m_root.isLoaded;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.addObject = function (object) {
            this.m_root.addChild(object);
        };
        Scene.prototype.getObjectByName = function (name) {
            return this.m_root.getObjectByName(name);
        };
        Scene.prototype.load = function () {
            this.m_root.load();
        };
        Scene.prototype.update = function (time) {
            this.m_root.update(time);
        };
        Scene.prototype.render = function (shader) {
            this.m_root.render(shader);
        };
        return Scene;
    }());
    Lib.Scene = Scene;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Rectangle2D = /** @class */ (function () {
        function Rectangle2D() {
            this.position = Lib.Vector2.zero;
        }
        Object.defineProperty(Rectangle2D.prototype, "offset", {
            get: function () {
                return Lib.Vector2.zero;
            },
            enumerable: true,
            configurable: true
        });
        Rectangle2D.prototype.setFromJson = function (json) {
            if (json.position !== undefined) {
                this.position.setFromJson(json.position);
            }
            if (json.width === undefined) {
                throw new Error("Rectangle2D requires width.");
            }
            this.width = Number(json.width);
            if (json.height === undefined) {
                throw new Error("Rectangle2D requires height.");
            }
            this.height = Number(json.height);
        };
        Rectangle2D.prototype.intersects = function (other) {
            if (other instanceof Rectangle2D) {
                var a = other.position;
                var b = new Lib.Vector2(other.position.x + other.width, other.position.y);
                var c = new Lib.Vector2(other.position.x + other.width, other.position.y + other.height);
                var d = new Lib.Vector2(other.position.x, other.position.y + other.height);
                if (this.pointInShape(a) || this.pointInShape(b) || this.pointInShape(c) || this.pointInShape(d)) {
                    return true;
                }
            }
            if (other instanceof Circle2D) {
                var deltaX = other.position.x - Math.max(this.position.x, Math.min(other.position.x, this.position.x + this.width));
                var deltaY = other.position.y - Math.max(this.position.y, Math.min(other.position.y, this.position.y + this.height));
                if ((deltaX * deltaX + deltaY * deltaY) < (other.radius * other.radius)) {
                    return true;
                }
            }
            return false;
        };
        Rectangle2D.prototype.pointInShape = function (point) {
            if (point.x >= this.position.x && point.x <= point.x + this.width) {
                if (point.y >= this.position.y && point.y <= this.position.y + this.height) {
                    return true;
                }
            }
            return false;
        };
        return Rectangle2D;
    }());
    Lib.Rectangle2D = Rectangle2D;
    var Circle2D = /** @class */ (function () {
        function Circle2D() {
            this.position = Lib.Vector2.zero;
            this.origin = Lib.Vector2.zero;
        }
        Object.defineProperty(Circle2D.prototype, "offset", {
            get: function () {
                return new Lib.Vector2(this.radius + (this.radius * this.origin.x), this.radius + (this.radius * this.origin.y));
            },
            enumerable: true,
            configurable: true
        });
        Circle2D.prototype.setFromJson = function (json) {
            if (json.position !== undefined) {
                this.position.setFromJson(json.position);
            }
            if (json.origin !== undefined) {
                this.origin.setFromJson(json.origin);
            }
            if (json.radius === undefined) {
                throw new Error("Circle2D requires radius.");
            }
            this.radius = Number(json.radius);
        };
        Circle2D.prototype.intersects = function (other) {
            if (other instanceof Circle2D) {
                var d = Lib.Vector2.distance(other.position, this.position);
                var l = other.radius + this.radius;
                if (d <= l) {
                    return true;
                }
            }
            return false;
        };
        Circle2D.prototype.pointInShape = function (point) {
            var d = Lib.Vector2.distance(this.position, point);
            if (d <= this.radius) {
                return true;
            }
            return false;
        };
        return Circle2D;
    }());
    Lib.Circle2D = Circle2D;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var SimObject = /** @class */ (function () {
        function SimObject(id, name, scene) {
            this.m_children = [];
            this.m_isLoaded = false;
            this.m_component = [];
            this.m_behavior = [];
            this.m_localMatrix = Lib.Matrix4x4.identity();
            this.m_worldMatrix = Lib.Matrix4x4.identity();
            this.transform = new Lib.Transform();
            this.m_id = id;
            this.name = name;
            this.m_scene = scene;
        }
        Object.defineProperty(SimObject.prototype, "id", {
            get: function () {
                return this.m_id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SimObject.prototype, "parent", {
            get: function () {
                return this.m_parent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SimObject.prototype, "worldMatrix", {
            get: function () {
                return this.m_worldMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SimObject.prototype, "isLoaded", {
            get: function () {
                return this.m_isLoaded;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SimObject.prototype, "scene", {
            get: function () {
                return this.m_scene;
            },
            enumerable: true,
            configurable: true
        });
        SimObject.prototype.addChild = function (child) {
            child.m_parent = this;
            this.m_children.push(child);
            child.onAdded(this.m_scene);
        };
        SimObject.prototype.removeChild = function (child) {
            var index = this.m_children.indexOf(child);
            if (index !== -1) {
                child.m_parent = undefined;
                this.m_children.splice(index, 1);
            }
        };
        SimObject.prototype.getObjectByName = function (name) {
            if (this.name === name) {
                return this;
            }
            for (var _i = 0, _a = this.m_children; _i < _a.length; _i++) {
                var child = _a[_i];
                var result = child.getObjectByName(name);
                if (result !== undefined) {
                    return result;
                }
            }
            return undefined;
        };
        SimObject.prototype.addComponent = function (component) {
            this.m_component.push(component);
            component.setOwner(this);
        };
        SimObject.prototype.getComponentByName = function (name) {
            for (var _i = 0, _a = this.m_component; _i < _a.length; _i++) {
                var component = _a[_i];
                if (component.name === name) {
                    return component;
                }
            }
            for (var _b = 0, _c = this.m_children; _b < _c.length; _b++) {
                var child = _c[_b];
                var component = child.getComponentByName(name);
                if (component !== undefined) {
                    return component;
                }
            }
            return undefined;
        };
        SimObject.prototype.addBehavior = function (behavior) {
            this.m_behavior.push(behavior);
            behavior.setOwner(this);
        };
        SimObject.prototype.load = function () {
            this.m_isLoaded = true;
            for (var _i = 0, _a = this.m_component; _i < _a.length; _i++) {
                var c = _a[_i];
                c.load();
            }
            for (var _b = 0, _c = this.m_behavior; _b < _c.length; _b++) {
                var b = _c[_b];
                b.load();
            }
            for (var _d = 0, _e = this.m_children; _d < _e.length; _d++) {
                var c = _e[_d];
                c.load();
            }
        };
        SimObject.prototype.update = function (time) {
            this.m_localMatrix = this.transform.getTransformationMatrix();
            this.updateWorldMatrix((this.m_parent !== undefined) ? this.m_parent.worldMatrix : undefined);
            for (var _i = 0, _a = this.m_component; _i < _a.length; _i++) {
                var c = _a[_i];
                c.update(time);
            }
            for (var _b = 0, _c = this.m_behavior; _b < _c.length; _b++) {
                var b = _c[_b];
                b.update(time);
            }
            for (var _d = 0, _e = this.m_children; _d < _e.length; _d++) {
                var c = _e[_d];
                c.update(time);
            }
        };
        SimObject.prototype.render = function (shader) {
            for (var _i = 0, _a = this.m_component; _i < _a.length; _i++) {
                var c = _a[_i];
                c.render(shader);
            }
            for (var _b = 0, _c = this.m_children; _b < _c.length; _b++) {
                var c = _c[_b];
                c.render(shader);
            }
        };
        SimObject.prototype.onAdded = function (scene) {
            this.m_scene = scene;
        };
        SimObject.prototype.updateWorldMatrix = function (parentWorldMatrix) {
            if (parentWorldMatrix !== undefined) {
                this.m_worldMatrix = Lib.Matrix4x4.multiply(parentWorldMatrix, this.m_localMatrix);
            }
            else {
                this.m_worldMatrix.copyFrom(this.m_localMatrix);
            }
        };
        SimObject.prototype.getWorldPosition = function () {
            return new Lib.Vector3(this.m_worldMatrix.data[12], this.m_worldMatrix.data[13], this.m_worldMatrix.data[14]);
        };
        return SimObject;
    }());
    Lib.SimObject = SimObject;
})(Lib || (Lib = {}));
// <reference path="Zone.ts" />
/*
namespace Lib {
    export class TestZone extends Zone {
        private m_parentObject: SimObject;
        private m_parentSprite: SpriteComponent;

        private m_testObject: SimObject;
        private m_testSprite: SpriteComponent;

        public load(): void {
            //this.m_sprite = new Sprite("Test", "head");
            //this.m_sprite.load();
            //this.m_sprite.position.x = 200;
            this.m_parentObject = new SimObject(0, "parentObject");
            this.m_parentSprite = new SpriteComponent("Test", "head");
            this.m_parentObject.addComponent(this.m_parentSprite);
            this.m_parentObject.transform.position.x = 500;
            this.m_parentObject.transform.position.y = 500;

            this.m_testObject = new SimObject(0, "testObject");
            this.m_testSprite = new SpriteComponent("Test", "headSmall");
            this.m_testObject.addComponent(this.m_testSprite);

            this.m_testObject.transform.position.x = 100;
            this.m_testObject.transform.position.y = 100;

            this.m_parentObject.addChild(this.m_testObject);

            this.scene.addObject(this.m_parentObject);
            super.load();
        }

        public update(time: number): void {
            this.m_parentObject.transform.rotation.z += 0.01;
            this.m_testObject.transform.rotation.z += 0.1;
            super.update(time);
        }
        
        public render(shader: Shader): void {
            this.m_sprite.draw(shader);
            super.render(shader);
        }
    }
}
*/ 
var Lib;
(function (Lib) {
    var Transform = /** @class */ (function () {
        function Transform() {
            this.position = Lib.Vector3.zero;
            this.rotation = Lib.Vector3.zero;
            this.scale = Lib.Vector3.one;
        }
        Transform.prototype.copyFrom = function (transform) {
            this.position.copyFrom(transform.position);
            this.rotation.copyFrom(transform.rotation);
            this.scale.copyFrom(transform.scale);
        };
        /** Creates and returns a matrix based on this transform. */
        Transform.prototype.getTransformationMatrix = function () {
            var translation = Lib.Matrix4x4.translation(this.position);
            var rotation = Lib.Matrix4x4.rotationZ(this.rotation.z);
            var scale = Lib.Matrix4x4.scale(this.scale);
            return Lib.Matrix4x4.multiply(Lib.Matrix4x4.multiply(translation, rotation), scale);
        };
        Transform.prototype.setFromJson = function (json) {
            if (json.position !== undefined) {
                this.position.setFromJson(json.position);
                console.log("set position...");
            }
            if (json.rotation !== undefined) {
                this.rotation.setFromJson(json.rotation);
                console.log("set rotation...");
            }
            if (json.scale !== undefined) {
                this.scale.setFromJson(json.scale);
                console.log("set scale...");
            }
        };
        return Transform;
    }());
    Lib.Transform = Transform;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Utilities = /** @class */ (function () {
        function Utilities() {
        }
        /**
         * Setting up a WebGL context.
         * @param canvas Canvas element in document.
         * @param width game resolution width (0: normal).
         * @param height game resolution height (0: normal).
         */
        Utilities.init = function (canvas, width, height) {
            //Create WebGL on canvas
            if (canvas === undefined) {
                throw new Error("Cannot find a canvas element named App.");
            }
            this.m_cavan = canvas;
            //Game resolution
            this.m_gameWidth = width;
            this.m_gameHeight = height;
            //PNG edge problem: https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
            Lib.gl = this.m_cavan.getContext("webgl", { premultipliedAlpha: false });
            if (Lib.gl === undefined) {
                throw new Error("Unable to initialize WebGL");
            }
            //Set game resolution
            this.resize();
            Lib.AssetManager.initialize();
            Lib.InputManager.initialize();
            Lib.ZoneManager.initialize();
            Lib.CollisionManager.initialize();
            //Set clear color
            Lib.gl.clearColor(0, 0, 0.3, 1);
            Lib.gl.enable(Lib.gl.BLEND);
            //PNG edge problem: https://stackoverflow.com/questions/39341564/webgl-how-to-correctly-blend-alpha-channel-png
            //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            Lib.gl.blendFunc(Lib.gl.ONE, Lib.gl.ONE_MINUS_SRC_ALPHA);
            //Load shader
            this.m_Basicshader = new Lib.BasicShader("basic");
            this.m_Basicshader.use();
            //Load material
            //MaterialManager.registerMaterial(new Material("head", "head.png", new Color(255, 128, 0, 255)));
            //Load Zone
            //let zoneID = ZoneManager.createZone("TestZone", "A test for zone.");
            //ZoneManager.changeZone(zoneID);
        };
        Utilities.resize = function () {
            Lib.gl.viewport(0, 0, Lib.gl.canvas.width, Lib.gl.canvas.height);
            if (this.m_gameWidth === 0 && this.m_gameHeight === 0) {
                //Set game resolution (normal)
                this.m_projection = Lib.Matrix4x4.orthographic(0, Lib.gl.canvas.width, Lib.gl.canvas.height, 0, -100, 100);
            }
            else {
                //Set game resolution (full screen)
                this.m_projection = Lib.Matrix4x4.orthographic(0, this.m_gameWidth, this.m_gameHeight, 0, -100, 100);
            }
        };
        Utilities.update = function (time) {
            this.m_escapetime = time;
            Lib.MessageBus.update(time);
            Lib.ZoneManager.update(time);
            Lib.CollisionManager.update(time);
        };
        Utilities.render = function () {
            //clear
            Lib.gl.clear(Lib.gl.COLOR_BUFFER_BIT);
            //Zone
            Lib.ZoneManager.render(this.m_Basicshader);
            //set view matrix
            var projectionPosition = this.m_Basicshader.getUniformLocation("u_projection");
            Lib.gl.uniformMatrix4fv(projectionPosition, false, new Float32Array(this.m_projection.data));
        };
        Utilities.m_fullScreen = false;
        return Utilities;
    }());
    Lib.Utilities = Utilities;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var AttributeInfo = /** @class */ (function () {
        function AttributeInfo() {
            this.offset = 0;
        }
        return AttributeInfo;
    }());
    Lib.AttributeInfo = AttributeInfo;
    var GLBuffer = /** @class */ (function () {
        /**
         * Create a new GL buffer
         * @param elementmSize The size of element in this buffer
         * @param dataType The type of this buffer
         * @param targetBufferType The buffer target type
         * @param mode The drawing mode of this buffer
         */
        function GLBuffer(
        //elementSize: number,
        dataType, targetBufferType, mode) {
            if (dataType === void 0) { dataType = Lib.gl.FLOAT; }
            if (targetBufferType === void 0) { targetBufferType = Lib.gl.ARRAY_BUFFER; }
            if (mode === void 0) { mode = Lib.gl.TRIANGLES; }
            this.m_hasAttributeLocation = false;
            this.m_data = [];
            this.m_attributes = [];
            this.m_totalOffset = 0;
            //this.m_elementsize = elementSize;
            this.m_elementsize = 0;
            this.m_dataType = dataType;
            this.m_targetBufferType = targetBufferType;
            this.m_mode = mode;
            //Determine byte size
            switch (this.m_dataType) {
                case Lib.gl.FLOAT:
                case Lib.gl.INT:
                case Lib.gl.UNSIGNED_INT:
                    this.m_typeSize = 4;
                    break;
                case Lib.gl.SHORT:
                case Lib.gl.UNSIGNED_SHORT:
                    this.m_typeSize = 2;
                    break;
                case Lib.gl.BYTE:
                case Lib.gl.UNSIGNED_BYTE:
                    this.m_typeSize = 1;
                    break;
                default:
                    throw new Error("Unrecognize dtat type" + dataType.toString());
            }
            this.m_buffer = Lib.gl.createBuffer();
        }
        GLBuffer.prototype.destory = function () {
            Lib.gl.deleteBuffer(this.m_buffer);
        };
        /**
         * Bind GPU to this buffer
         * @param normalized
         */
        GLBuffer.prototype.bind = function (normalized) {
            if (normalized === void 0) { normalized = false; }
            Lib.gl.bindBuffer(this.m_targetBufferType, this.m_buffer);
            if (this.m_hasAttributeLocation) {
                for (var _i = 0, _a = this.m_attributes; _i < _a.length; _i++) {
                    var it = _a[_i];
                    Lib.gl.vertexAttribPointer(it.location, it.size, this.m_dataType, normalized, this.m_stride, it.offset * this.m_typeSize);
                    Lib.gl.enableVertexAttribArray(it.location);
                }
            }
        };
        GLBuffer.prototype.unbind = function () {
            for (var _i = 0, _a = this.m_attributes; _i < _a.length; _i++) {
                var it = _a[_i];
                Lib.gl.disableVertexAttribArray(it.location);
            }
            Lib.gl.bindBuffer(this.m_targetBufferType, undefined);
        };
        /**
         * Add an attribute
         * @param info
         */
        GLBuffer.prototype.addAttributeLocation = function (info) {
            this.m_hasAttributeLocation = true;
            info.offset = this.m_elementsize;
            this.m_attributes.push(info);
            this.m_elementsize += info.size;
            this.m_stride = this.m_elementsize * this.m_typeSize;
        };
        /**
         * Replace data in this buffer
         * @param data
         */
        GLBuffer.prototype.setData = function (data) {
            this.clearData();
            this.pushBackData(data);
        };
        /**
         * Add data to this buffer
         * @param data
         */
        GLBuffer.prototype.pushBackData = function (data) {
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var d = data_1[_i];
                this.m_data.push(d);
            }
        };
        /**
         * Clear all data
         * */
        GLBuffer.prototype.clearData = function () {
            this.m_data.length = 0;
        };
        /**
         * Upload this buffer's data to GPU
         * */
        GLBuffer.prototype.upload = function () {
            Lib.gl.bindBuffer(this.m_targetBufferType, this.m_buffer);
            var bufferData;
            switch (this.m_dataType) {
                case Lib.gl.FLOAT:
                    bufferData = new Float32Array(this.m_data);
                    break;
                case Lib.gl.INT:
                    bufferData = new Int32Array(this.m_data);
                    break;
                case Lib.gl.UNSIGNED_INT:
                    bufferData = new Uint32Array(this.m_data);
                    break;
                case Lib.gl.SHORT:
                    bufferData = new Int16Array(this.m_data);
                    break;
                case Lib.gl.UNSIGNED_SHORT:
                    bufferData = new Uint16Array(this.m_data);
                    break;
                case Lib.gl.BYTE:
                    bufferData = new Int8Array(this.m_data);
                    break;
                case Lib.gl.UNSIGNED_BYTE:
                    bufferData = new Uint8Array(this.m_data);
                    break;
            }
            Lib.gl.bufferData(this.m_targetBufferType, bufferData, Lib.gl.STATIC_DRAW);
        };
        /**GPU draw data in this buffer */
        GLBuffer.prototype.draw = function () {
            if (this.m_targetBufferType === Lib.gl.ARRAY_BUFFER) {
                Lib.gl.drawArrays(this.m_mode, 0, this.m_data.length / this.m_elementsize);
            }
            else if (this.m_targetBufferType === Lib.gl.ELEMENT_ARRAY_BUFFER) {
                Lib.gl.drawElements(this.m_mode, this.m_data.length, this.m_dataType, 0);
            }
        };
        return GLBuffer;
    }());
    Lib.GLBuffer = GLBuffer;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Matrix4x4 = /** @class */ (function () {
        function Matrix4x4() {
            this.m_data = [];
            //identity matrix
            this.m_data = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ];
        }
        Object.defineProperty(Matrix4x4.prototype, "data", {
            get: function () {
                return this.m_data;
            },
            enumerable: true,
            configurable: true
        });
        Matrix4x4.identity = function () {
            return new Matrix4x4();
        };
        Matrix4x4.orthographic = function (left, right, bottom, top, nearClip, farClip) {
            var m = new Matrix4x4();
            var lr = 1.0 / (left - right);
            var bt = 1.0 / (bottom - top);
            var nf = 1.0 / (nearClip - farClip);
            m.m_data[0] = -2.0 * lr;
            m.m_data[5] = -2.0 * bt;
            m.m_data[10] = 2.0 * nf;
            m.m_data[12] = (left + right) * lr;
            m.m_data[13] = (top + bottom) * bt;
            m.m_data[14] = (farClip + nearClip) * nf;
            return m;
        };
        Matrix4x4.rotationZ = function (angleInRadians) {
            var m = new Matrix4x4();
            var c = Math.cos(angleInRadians);
            var s = Math.sin(angleInRadians);
            m.m_data[0] = c;
            m.m_data[1] = s;
            m.m_data[4] = -s;
            m.m_data[5] = c;
            return m;
        };
        Matrix4x4.scale = function (scale) {
            var m = new Matrix4x4();
            m.m_data[0] = scale.x;
            m.m_data[5] = scale.y;
            m.m_data[10] = scale.z;
            return m;
        };
        Matrix4x4.multiply = function (a, b) {
            var m = new Matrix4x4();
            var b00 = b.m_data[0 * 4 + 0];
            var b01 = b.m_data[0 * 4 + 1];
            var b02 = b.m_data[0 * 4 + 2];
            var b03 = b.m_data[0 * 4 + 3];
            var b10 = b.m_data[1 * 4 + 0];
            var b11 = b.m_data[1 * 4 + 1];
            var b12 = b.m_data[1 * 4 + 2];
            var b13 = b.m_data[1 * 4 + 3];
            var b20 = b.m_data[2 * 4 + 0];
            var b21 = b.m_data[2 * 4 + 1];
            var b22 = b.m_data[2 * 4 + 2];
            var b23 = b.m_data[2 * 4 + 3];
            var b30 = b.m_data[3 * 4 + 0];
            var b31 = b.m_data[3 * 4 + 1];
            var b32 = b.m_data[3 * 4 + 2];
            var b33 = b.m_data[3 * 4 + 3];
            var a00 = a.m_data[0 * 4 + 0];
            var a01 = a.m_data[0 * 4 + 1];
            var a02 = a.m_data[0 * 4 + 2];
            var a03 = a.m_data[0 * 4 + 3];
            var a10 = a.m_data[1 * 4 + 0];
            var a11 = a.m_data[1 * 4 + 1];
            var a12 = a.m_data[1 * 4 + 2];
            var a13 = a.m_data[1 * 4 + 3];
            var a20 = a.m_data[2 * 4 + 0];
            var a21 = a.m_data[2 * 4 + 1];
            var a22 = a.m_data[2 * 4 + 2];
            var a23 = a.m_data[2 * 4 + 3];
            var a30 = a.m_data[3 * 4 + 0];
            var a31 = a.m_data[3 * 4 + 1];
            var a32 = a.m_data[3 * 4 + 2];
            var a33 = a.m_data[3 * 4 + 3];
            m.m_data[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
            m.m_data[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
            m.m_data[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
            m.m_data[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
            m.m_data[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
            m.m_data[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
            m.m_data[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
            m.m_data[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
            m.m_data[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
            m.m_data[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
            m.m_data[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
            m.m_data[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
            m.m_data[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
            m.m_data[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
            m.m_data[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
            m.m_data[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
            return m;
        };
        Matrix4x4.translation = function (position) {
            var matrix = new Matrix4x4();
            matrix.m_data[12] = position.x;
            matrix.m_data[13] = position.y;
            matrix.m_data[14] = position.z;
            return matrix;
        };
        Matrix4x4.prototype.toFloat32Array = function () {
            return new Float32Array(this.m_data);
        };
        Matrix4x4.prototype.copyFrom = function (m) {
            for (var i = 0; i < 16; i++) {
                this.m_data[i] = m.m_data[i];
            }
        };
        return Matrix4x4;
    }());
    Lib.Matrix4x4 = Matrix4x4;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var MessagePriority;
    (function (MessagePriority) {
        MessagePriority[MessagePriority["NORMAL"] = 0] = "NORMAL";
        MessagePriority[MessagePriority["HIGH"] = 1] = "HIGH";
    })(MessagePriority = Lib.MessagePriority || (Lib.MessagePriority = {}));
    var Message = /** @class */ (function () {
        function Message(code, sender, context, priority) {
            if (priority === void 0) { priority = MessagePriority.NORMAL; }
            this.code = code;
            this.sender = sender;
            this.context = context;
            this.priority = priority;
        }
        Message.send = function (code, sender, context) {
            MessageBus.post(new Message(code, sender, context, MessagePriority.NORMAL));
        };
        Message.sendPriority = function (code, sender, context) {
            MessageBus.post(new Message(code, sender, context, MessagePriority.HIGH));
        };
        Message.subscribe = function (code, handler) {
            MessageBus.addSubscription(code, handler);
        };
        Message.unsubscribe = function (code, handler) {
            MessageBus.removeSubscription(code, handler);
        };
        return Message;
    }());
    Lib.Message = Message;
    var MessageSubscriptionNode = /** @class */ (function () {
        function MessageSubscriptionNode(message, handler) {
            this.message = message;
            this.handler = handler;
        }
        return MessageSubscriptionNode;
    }());
    Lib.MessageSubscriptionNode = MessageSubscriptionNode;
    var MessageBus = /** @class */ (function () {
        function MessageBus() {
        }
        MessageBus.addSubscription = function (code, handler) {
            console.log("Message subscribe:", code, handler);
            if (MessageBus.m_subscriptions[code] === undefined) {
                MessageBus.m_subscriptions[code] = [];
            }
            if (MessageBus.m_subscriptions[code].indexOf(handler) !== -1) {
                console.warn("Attempting to add a duplicate handler to code:" + code + "subscription not added.");
            }
            else {
                MessageBus.m_subscriptions[code].push(handler);
            }
        };
        MessageBus.removeSubscription = function (code, handler) {
            if (MessageBus.m_subscriptions[code] === undefined) {
                console.warn("Cannot unsubscribe handler fram code:" + code);
                return;
            }
            var index = MessageBus.m_subscriptions[code].indexOf(handler);
            if (index !== -1) {
                MessageBus.m_subscriptions[code].splice(index, 1);
            }
        };
        MessageBus.post = function (message) {
            console.log("Message posted:", message);
            var handlers = MessageBus.m_subscriptions[message.code];
            if (handlers === undefined) {
                return;
            }
            for (var _i = 0, handlers_1 = handlers; _i < handlers_1.length; _i++) {
                var h = handlers_1[_i];
                if (message.priority === MessagePriority.HIGH) {
                    h.onMessage(message);
                }
                else {
                    MessageBus.m_normalMessageQueue.push(new MessageSubscriptionNode(message, h));
                }
            }
        };
        MessageBus.update = function (time) {
            if (MessageBus.m_normalMessageQueue.length === 0) {
                return;
            }
            var limit = Math.min(MessageBus.m_normalQueueMessagePerUpdate, MessageBus.m_normalMessageQueue.length);
            for (var i = 0; i < limit; i++) {
                var node = MessageBus.m_normalMessageQueue.pop();
                if (node.handler !== undefined) {
                    console.log("OnMessage:", node);
                    node.handler.onMessage(node.message);
                    //} else if (node.callback !== undefined) {
                    //    node.callback(node.message);
                }
                else {
                    console.warn("Unable to process message node because there is no handler or callback: " + node);
                }
            }
        };
        MessageBus.m_subscriptions = {};
        MessageBus.m_normalQueueMessagePerUpdate = 10;
        MessageBus.m_normalMessageQueue = [];
        return MessageBus;
    }());
    Lib.MessageBus = MessageBus;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Shader = /** @class */ (function () {
        /**
         * Create shader
         * @param name The name of this shader
         * @param vertexSource The source code of vertext shader
         * @param fragmentSource The source code of fragment shader
         */
        function Shader(name) {
            this.m_attributes = {};
            this.m_uniforms = {};
            this.m_name = name;
        }
        Shader.prototype.load = function (vertexSource, fragmentSource) {
            //Load and compile shader code
            var vertexShader = this.loadShader(vertexSource, Lib.gl.VERTEX_SHADER);
            var fragmentShader = this.loadShader(fragmentSource, Lib.gl.FRAGMENT_SHADER);
            //Create and link shader program
            this.createProgram(vertexShader, fragmentShader);
            //Make attribute mapping table
            this.detectAttributes();
            this.detectUniforms();
        };
        Object.defineProperty(Shader.prototype, "name", {
            get: function () {
                return this.m_name;
            },
            enumerable: true,
            configurable: true
        });
        Shader.prototype.use = function () {
            Lib.gl.useProgram(this.m_program);
        };
        Shader.prototype.getAttributeLocation = function (name) {
            if (this.m_attributes[name] === undefined) {
                throw new Error("Unable to find attribute name" + name + "in shader" + this.m_name);
            }
            return this.m_attributes[name];
        };
        Shader.prototype.getUniformLocation = function (name) {
            if (this.m_uniforms[name] === undefined) {
                throw new Error("Unable to find uniform name" + name + "in shader" + this.m_name);
            }
            return this.m_uniforms[name];
        };
        /**
         * Load and compile shader
         * @param source
         * @param shaderType
         */
        Shader.prototype.loadShader = function (source, shaderType) {
            var shader = Lib.gl.createShader(shaderType);
            Lib.gl.shaderSource(shader, source);
            Lib.gl.compileShader(shader);
            var error = Lib.gl.getShaderInfoLog(shader);
            if (error !== "") {
                throw new Error("Error compiling shader: " + error);
            }
            return shader;
        };
        ;
        Shader.prototype.createProgram = function (vertexShader, fragmentShader) {
            this.m_program = Lib.gl.createProgram();
            Lib.gl.attachShader(this.m_program, vertexShader);
            Lib.gl.attachShader(this.m_program, fragmentShader);
            Lib.gl.linkProgram(this.m_program);
            var error = Lib.gl.getProgramInfoLog(this.m_program);
            if (error !== "") {
                throw new Error("Error linking shader: " + error);
            }
        };
        Shader.prototype.detectAttributes = function () {
            var count = Lib.gl.getProgramParameter(this.m_program, Lib.gl.ACTIVE_ATTRIBUTES);
            for (var i = 0; i < count; i++) {
                var info = Lib.gl.getActiveAttrib(this.m_program, i);
                if (!info) {
                    break;
                }
                this.m_attributes[info.name] = Lib.gl.getAttribLocation(this.m_program, info.name);
            }
        };
        Shader.prototype.detectUniforms = function () {
            var count = Lib.gl.getProgramParameter(this.m_program, Lib.gl.ACTIVE_UNIFORMS);
            for (var i = 0; i < count; i++) {
                var info = Lib.gl.getActiveUniform(this.m_program, i);
                if (!info) {
                    break;
                }
                this.m_uniforms[info.name] = Lib.gl.getUniformLocation(this.m_program, info.name);
            }
        };
        return Shader;
    }());
    Lib.Shader = Shader;
    var BasicShader = /** @class */ (function (_super) {
        __extends(BasicShader, _super);
        function BasicShader(name) {
            var _this = _super.call(this, name) || this;
            //Shader source code
            _this.vShaderSrc = "\nattribute vec3 a_position;\nattribute vec2 a_texCoord;\nuniform mat4 u_projection;\nuniform mat4 u_model;\nvarying vec2 v_texCoord;\nvoid main(){\n    gl_Position = u_projection * u_model *vec4(a_position, 1.0);\n    v_texCoord = a_texCoord;\n}";
            _this.fShaderSrc = "\nprecision mediump float;\nuniform vec4 u_tint;\nuniform sampler2D u_diffuse;\nvarying vec2 v_texCoord;\nvoid main(){\n    gl_FragColor = u_tint * texture2D(u_diffuse, v_texCoord);\n    gl_FragColor.rgb *= gl_FragColor.a;\n}";
            _this.load(_this.vShaderSrc, _this.fShaderSrc);
            return _this;
        }
        return BasicShader;
    }(Shader));
    Lib.BasicShader = BasicShader;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Vertex = /** @class */ (function () {
        function Vertex(x, y, z, tu, tv) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (tu === void 0) { tu = 0; }
            if (tv === void 0) { tv = 0; }
            this.position = Lib.Vector3.zero;
            this.texCoords = Lib.Vector2.zero;
            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
            this.texCoords.x = tu;
            this.texCoords.y = tv;
        }
        /** Returns the data of this vertex as an array of numbers. */
        Vertex.prototype.toArray = function () {
            var array = [];
            array = array.concat(this.position.toArray());
            array = array.concat(this.texCoords.toArray());
            return array;
        };
        /** Returns the data of this vertex as a Float32Array. */
        Vertex.prototype.toFloat32Array = function () {
            return new Float32Array(this.toArray());
        };
        return Vertex;
    }());
    Lib.Vertex = Vertex;
    var Sprite = /** @class */ (function () {
        function Sprite(name, materialName, width, height, origin) {
            this.m_origin = Lib.Vector3.zero;
            this.m_vertices = [];
            this.m_name = name;
            this.m_width = width;
            this.m_height = height;
            this.m_origin = origin;
            this.m_materialName = materialName;
            this.m_material = Lib.MaterialManager.getMaterial(this.m_materialName);
        }
        Object.defineProperty(Sprite.prototype, "name", {
            get: function () {
                return this.m_name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sprite.prototype, "origin", {
            get: function () {
                return this.m_origin;
            },
            set: function (value) {
                this.m_origin = value;
                this.recalculateVertices();
            },
            enumerable: true,
            configurable: true
        });
        Sprite.prototype.destory = function () {
            this.m_buffer.destory();
            Lib.MaterialManager.releaseMaterial(this.m_materialName);
            this.m_materialName = undefined;
            this.m_material = undefined;
        };
        /**Load sprite default data*/
        Sprite.prototype.load = function () {
            this.m_buffer = new Lib.GLBuffer();
            var positionAttribute = new Lib.AttributeInfo();
            positionAttribute.location = 0;
            positionAttribute.size = 3;
            this.m_buffer.addAttributeLocation(positionAttribute);
            var texCoordAttribute = new Lib.AttributeInfo();
            texCoordAttribute.location = 1;
            texCoordAttribute.size = 2;
            this.m_buffer.addAttributeLocation(texCoordAttribute);
            this.calculateVertices();
        };
        Sprite.prototype.update = function (time) {
        };
        /**Draw sprite */
        Sprite.prototype.draw = function (shader, model) {
            //set model location
            var modelLocation = shader.getUniformLocation("u_model");
            Lib.gl.uniformMatrix4fv(modelLocation, false, model.toFloat32Array());
            //set uniform color
            var colorLocation = shader.getUniformLocation("u_tint");
            Lib.gl.uniform4fv(colorLocation, this.m_material.tint.toFloat32Array());
            //set texture color
            if (this.m_material.diffuseTexture !== undefined) {
                this.m_material.diffuseTexture.activateAndBind(0);
                var diffuseLocation = shader.getUniformLocation("u_diffuse");
                Lib.gl.uniform1i(diffuseLocation, 0);
            }
            this.m_buffer.bind();
            this.m_buffer.draw();
        };
        Sprite.prototype.calculateVertices = function () {
            var minX = -(this.m_width * this.m_origin.x);
            var maxX = this.m_width * (1.0 - this.m_origin.x);
            var minY = -(this.m_height * this.m_origin.y);
            var maxY = this.m_height * (1.0 - this.m_origin.y);
            this.m_vertices = [
                //x, y, z  ,u , v
                new Vertex(minX, minY, 0, 0, 0),
                new Vertex(minX, maxY, 0, 0, 1.0),
                new Vertex(maxX, maxY, 0, 1.0, 1.0),
                new Vertex(maxX, maxY, 0, 1.0, 1.0),
                new Vertex(maxX, minY, 0, 1.0, 0),
                new Vertex(minX, minY, 0, 0, 0)
            ];
            for (var _i = 0, _a = this.m_vertices; _i < _a.length; _i++) {
                var v = _a[_i];
                this.m_buffer.pushBackData(v.toArray());
            }
            this.m_buffer.upload();
            this.m_buffer.unbind();
        };
        Sprite.prototype.recalculateVertices = function () {
            var minX = -(this.m_width * this.m_origin.x);
            var maxX = this.m_width * (1.0 - this.m_origin.x);
            var minY = -(this.m_height * this.m_origin.y);
            var maxY = this.m_height * (1.0 - this.m_origin.y);
            this.m_vertices[0].position.set(minX, minY);
            this.m_vertices[1].position.set(minX, maxY);
            this.m_vertices[2].position.set(maxX, maxY);
            this.m_vertices[3].position.set(maxX, maxY);
            this.m_vertices[4].position.set(maxX, minY);
            this.m_vertices[5].position.set(minX, minY);
            this.m_buffer.clearData();
            for (var _i = 0, _a = this.m_vertices; _i < _a.length; _i++) {
                var v = _a[_i];
                this.m_buffer.pushBackData(v.toArray());
            }
            this.m_buffer.upload();
            this.m_buffer.unbind();
        };
        return Sprite;
    }());
    Lib.Sprite = Sprite;
    var UVInfo = /** @class */ (function () {
        function UVInfo(min, max) {
            this.min = min;
            this.max = max;
        }
        return UVInfo;
    }());
    Lib.UVInfo = UVInfo;
    var AnimatedSprite = /** @class */ (function (_super) {
        __extends(AnimatedSprite, _super);
        function AnimatedSprite(name, materialName, width, height, origin, assetWidt, assetHeight, frameWidth, frameHeight, frameCount, frameSequence, frameRate, playMode) {
            if (width === void 0) { width = 100; }
            if (height === void 0) { height = 100; }
            if (origin === void 0) { origin = Lib.Vector3.zero; }
            if (assetWidt === void 0) { assetWidt = 100; }
            if (assetHeight === void 0) { assetHeight = 100; }
            if (frameWidth === void 0) { frameWidth = 10; }
            if (frameHeight === void 0) { frameHeight = 10; }
            if (frameCount === void 0) { frameCount = 1; }
            if (frameSequence === void 0) { frameSequence = []; }
            if (frameRate === void 0) { frameRate = 100; }
            if (playMode === void 0) { playMode = "loop"; }
            var _this = _super.call(this, name, materialName, width, height, origin) || this;
            _this.m_frameSequence = [];
            //each frame time
            _this.m_frameTime = 100;
            _this.m_frameUVs = [];
            _this.m_currentFrame = 0;
            _this.m_currentTime = 0;
            _this.m_assetWidth = 2;
            _this.m_assetHeight = 2;
            _this.m_playMode = "loop";
            _this.m_assetLoaded = false;
            _this.m_assetWidth = assetWidt;
            _this.m_assetHeight = assetHeight;
            _this.m_frameWidth = frameWidth;
            _this.m_frameHeight = frameHeight;
            _this.m_frameCount = frameCount;
            _this.m_frameSequence = frameSequence;
            _this.m_frameTime = frameRate;
            _this.m_playMode = playMode;
            return _this;
        }
        AnimatedSprite.prototype.destory = function () {
            _super.prototype.destory.call(this);
        };
        /**Load sprite default data*/
        AnimatedSprite.prototype.load = function () {
            _super.prototype.load.call(this);
            this.calculateTotalUVs();
        };
        AnimatedSprite.prototype.update = function (time) {
            //if (this.m_assetLoaded === false) {
            //    return;
            //}
            this.m_currentTime += time;
            if (this.m_currentTime > this.m_frameTime) {
                //next frame
                this.m_currentFrame++;
                this.m_currentTime = 0;
                if (this.m_currentFrame >= this.m_frameSequence.length) {
                    if (this.m_playMode === "once") {
                        this.m_currentFrame = this.m_frameSequence.length - 1;
                    }
                    else if (this.m_playMode === "loop") {
                        this.m_currentFrame = 0;
                    }
                    else {
                        throw new Error("Unsopport playMode: " + this.m_playMode);
                    }
                }
                //change texture
                var idx = this.m_frameSequence[this.m_currentFrame];
                this.m_vertices[0].texCoords.copyFrom(this.m_frameUVs[idx].min);
                this.m_vertices[1].texCoords = new Lib.Vector2(this.m_frameUVs[idx].min.x, this.m_frameUVs[idx].max.y);
                this.m_vertices[2].texCoords.copyFrom(this.m_frameUVs[idx].max);
                this.m_vertices[3].texCoords.copyFrom(this.m_frameUVs[idx].max);
                this.m_vertices[4].texCoords = new Lib.Vector2(this.m_frameUVs[idx].max.x, this.m_frameUVs[idx].min.y);
                this.m_vertices[5].texCoords.copyFrom(this.m_frameUVs[idx].min);
                this.m_buffer.clearData();
                for (var _i = 0, _a = this.m_vertices; _i < _a.length; _i++) {
                    var v = _a[_i];
                    this.m_buffer.pushBackData(v.toArray());
                }
                this.m_buffer.upload();
                this.m_buffer.unbind();
            }
            _super.prototype.update.call(this, time);
        };
        AnimatedSprite.prototype.isDone = function () {
            return (this.m_currentFrame === (this.m_frameSequence.length - 1));
        };
        AnimatedSprite.prototype.reset = function () {
            this.m_currentFrame = 0;
            this.m_currentTime = 0;
        };
        AnimatedSprite.prototype.calculateTotalUVs = function () {
            for (var i = 0; i < this.m_frameCount; ++i) {
                var u = 0;
                var v = (i * this.m_frameHeight) / this.m_assetHeight;
                var min = new Lib.Vector2(u, v);
                var uMax = this.m_frameWidth / this.m_assetWidth;
                var vMax = ((i * this.m_frameHeight) + this.m_frameHeight) / this.m_assetHeight;
                var max = new Lib.Vector2(uMax, vMax);
                this.m_frameUVs.push(new UVInfo(min, max));
            }
        };
        AnimatedSprite.prototype.calculateUVs = function () {
            /*
            let totalWidth: number = 0;
            let yValue: number = 0;
            for (let i = 0; i < this.m_frameCount; i++) {
                totalWidth += i * this.m_frameWidth;
                if (totalWidth > this.m_width) {
                    yValue++;
                    totalWidth = 0;
                }

                let texWight = this.m_material.diffuseTexture.width;
                let texHeight = this.m_material.diffuseTexture.height;

                let uMin = (i * this.m_frameWidth) / texWight;
                let vMin = (yValue * this.m_frameHeight) / texHeight;
                let min: Vector2 = new Vector2(uMin, vMin);

                let uMax = (i * this.m_frameWidth + this.m_width) / texWight;
                let vMax = (yValue * this.m_frameHeight + this.m_height) / texHeight;
                let max: Vector2 = new Vector2(uMax, vMax);

                this.m_frameUV.push(new UVInfo(min, max));
            }
            */
            var totalWidth = 0;
            var yValue = 0;
            for (var i = 0; i < this.m_frameCount; ++i) {
                totalWidth += i * this.m_frameWidth;
                if (totalWidth > this.m_assetWidth) {
                    yValue++;
                    totalWidth = 0;
                }
                console.log("w/h", this.m_assetWidth, this.m_assetHeight);
                var u = (i * this.m_frameWidth) / this.m_assetWidth;
                var v = (yValue * this.m_frameHeight) / this.m_assetHeight;
                var min = new Lib.Vector2(u, v);
                var uMax = ((i * this.m_frameWidth) + this.m_frameWidth) / this.m_assetWidth;
                var vMax = ((yValue * this.m_frameHeight) + this.m_frameHeight) / this.m_assetHeight;
                var max = new Lib.Vector2(uMax, vMax);
                this.m_frameUVs.push(new UVInfo(min, max));
            }
        };
        return AnimatedSprite;
    }(Sprite));
    Lib.AnimatedSprite = AnimatedSprite;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var LEVEL = 0;
    var BORDER = 0;
    var TEMP_IMAGE_DATA = new Uint8Array([255, 255, 255, 255]);
    var Texture = /** @class */ (function () {
        function Texture(name, width, height) {
            if (width === void 0) { width = 1; }
            if (height === void 0) { height = 1; }
            this.m_isLoaded = false;
            this.bitMode = false;
            this.m_name = name;
            this.m_width = width;
            this.m_height = height;
            this.m_handle = Lib.gl.createTexture();
            Lib.Message.subscribe(Lib.MESSAGE_ASSET_LOADER_ASSET_LOADED + this.m_name, this);
            this.bind();
            //assign a init raw imagine texture
            Lib.gl.texImage2D(Lib.gl.TEXTURE_2D, LEVEL, Lib.gl.RGBA, 1, 1, BORDER, Lib.gl.RGBA, Lib.gl.UNSIGNED_BYTE, TEMP_IMAGE_DATA);
            //Get Asset
            var asset = Lib.AssetManager.getAsset(this.name);
            if (asset !== undefined) {
                this.loadTextureFromAesst(asset);
            }
        }
        Object.defineProperty(Texture.prototype, "name", {
            get: function () {
                return this.m_name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Texture.prototype, "isLoaded", {
            get: function () {
                return this.m_isLoaded;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Texture.prototype, "width", {
            get: function () {
                return this.m_width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Texture.prototype, "height", {
            get: function () {
                return this.m_height;
            },
            enumerable: true,
            configurable: true
        });
        Texture.prototype.destory = function () {
            Lib.gl.deleteTexture(this.m_handle);
        };
        Texture.prototype.activateAndBind = function (textureUnit) {
            if (textureUnit === void 0) { textureUnit = 0; }
            Lib.gl.activeTexture(Lib.gl.TEXTURE0 + textureUnit);
            this.bind();
        };
        Texture.prototype.bind = function () {
            Lib.gl.bindTexture(Lib.gl.TEXTURE_2D, this.m_handle);
        };
        Texture.prototype.unbind = function () {
            Lib.gl.bindTexture(Lib.gl.TEXTURE_2D, undefined);
        };
        Texture.prototype.onMessage = function (message) {
            if (message.code === Lib.MESSAGE_ASSET_LOADER_ASSET_LOADED + this.m_name) {
                this.loadTextureFromAesst(message.context);
            }
        };
        Texture.prototype.loadTextureFromAesst = function (asset) {
            this.m_width = asset.width;
            this.m_height = asset.height;
            this.bind();
            //assign image element texture
            Lib.gl.texImage2D(Lib.gl.TEXTURE_2D, LEVEL, Lib.gl.RGBA, Lib.gl.RGBA, Lib.gl.UNSIGNED_BYTE, asset.data);
            Lib.gl.pixelStorei(Lib.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            if (this.isPowerof2()) {
                Lib.gl.generateMipmap(Lib.gl.TEXTURE_2D);
            }
            else {
                // Do not generate a mip map and clamp wrapping to edge.
                Lib.gl.texParameteri(Lib.gl.TEXTURE_2D, Lib.gl.TEXTURE_WRAP_S, Lib.gl.CLAMP_TO_EDGE);
                Lib.gl.texParameteri(Lib.gl.TEXTURE_2D, Lib.gl.TEXTURE_WRAP_T, Lib.gl.CLAMP_TO_EDGE);
            }
            // TODO:  Set texture filte r ing based on configuration.
            Lib.gl.texParameteri(Lib.gl.TEXTURE_2D, Lib.gl.TEXTURE_MIN_FILTER, Lib.gl.LINEAR);
            Lib.gl.texParameteri(Lib.gl.TEXTURE_2D, Lib.gl.TEXTURE_MAG_FILTER, Lib.gl.LINEAR);
            this.m_isLoaded = true;
        };
        Texture.prototype.isPowerof2 = function () {
            return (this.isValuePowerOf2(this.m_width) && this.isValuePowerOf2(this.m_height));
        };
        Texture.prototype.isValuePowerOf2 = function (value) {
            return (value & (value - 1)) == 0;
        };
        return Texture;
    }());
    Lib.Texture = Texture;
    var TextureReferenceNode = /** @class */ (function () {
        function TextureReferenceNode(texture) {
            this.referenceCount = 1;
            this.texture = texture;
        }
        return TextureReferenceNode;
    }());
    var TextureManager = /** @class */ (function () {
        function TextureManager() {
        }
        TextureManager.getTexture = function (textureName) {
            if (TextureManager.m_texture[textureName] === undefined) {
                var texture = new Texture(textureName);
                TextureManager.m_texture[textureName] = new TextureReferenceNode(texture);
            }
            else {
                TextureManager.m_texture[textureName].referenceCount++;
            }
            return TextureManager.m_texture[textureName].texture;
        };
        TextureManager.releaseTexture = function (name) {
            if (TextureManager.m_texture[name] === undefined) {
                console.warn("Texture:" + name + "is not exist.");
            }
            else {
                TextureManager.m_texture[name].referenceCount--;
                if (TextureManager.m_texture[name].referenceCount < 1) {
                    TextureManager.m_texture[name].texture.destory();
                    TextureManager.m_texture[name] = undefined;
                    delete TextureManager.m_texture[name];
                }
            }
        };
        TextureManager.m_texture = {};
        return TextureManager;
    }());
    Lib.TextureManager = TextureManager;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var Vector3 = /** @class */ (function () {
        /**
         * Creates a new vector 3.
         * @param x The x component.
         * @param y The y component.
         * @param z The z component.
         */
        function Vector3(x, y, z) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            this.m_x = x;
            this.m_y = y;
            this.m_z = z;
        }
        Object.defineProperty(Vector3.prototype, "x", {
            /** The x component. */
            get: function () {
                return this.m_x;
            },
            /** The x component. */
            set: function (value) {
                this.m_x = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3.prototype, "y", {
            /** The y component. */
            get: function () {
                return this.m_y;
            },
            /** The y component. */
            set: function (value) {
                this.m_y = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3.prototype, "z", {
            /** The z component. */
            get: function () {
                return this.m_z;
            },
            /** The z component. */
            set: function (value) {
                this.m_z = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3, "zero", {
            get: function () {
                return new Vector3();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3, "one", {
            get: function () {
                return new Vector3(1, 1, 1);
            },
            enumerable: true,
            configurable: true
        });
        Vector3.distance = function (a, b) {
            var diff = a.clone().subtract(b);
            return Math.sqrt(diff.x * diff.x + diff.y * diff.y + diff.z * diff.z);
        };
        Vector3.abs = function (v) {
            return this.distance(v, Vector3.zero);
        };
        Vector3.normalize = function (target, origin) {
            var d = this.distance(target, origin);
            var v = target.clone();
            return v.subtract(origin).divide(d);
        };
        Vector3.dotProduct = function (a, b) {
            return a.x * b.x + a.y * b.y + a.z * b.z;
        };
        Vector3.getAngle = function (target, origin) {
            var value = Math.acos(this.dotProduct(target, origin) / (this.abs(target) * this.abs(origin)));
            var v = origin.clone().subtract(target);
            if (v.x < 0) {
                value = Math.PI + (Math.PI - value);
            }
            return value;
        };
        Vector3.prototype.set = function (x, y, z) {
            if (x !== undefined) {
                this.m_x = x;
            }
            if (y !== undefined) {
                this.m_y = y;
            }
            if (z !== undefined) {
                this.m_z = z;
            }
        };
        Vector3.prototype.equals = function (v) {
            return (this.m_x === v.x && this.m_y === v.y && this.m_z === v.z);
        };
        /** Returns the data of this vector as a number array. */
        Vector3.prototype.toArray = function () {
            return [this.m_x, this.m_y, this.m_z];
        };
        /** Returns the data of this vector as a Float32Array. */
        Vector3.prototype.toFloat32Array = function () {
            return new Float32Array(this.toArray());
        };
        Vector3.prototype.copyFrom = function (vector) {
            this.m_x = vector.m_x;
            this.m_y = vector.m_y;
            this.m_z = vector.m_z;
        };
        Vector3.prototype.setFromJson = function (json) {
            if (json.x !== undefined) {
                this.m_x = Number(json.x);
            }
            if (json.y !== undefined) {
                this.m_y = Number(json.y);
            }
            if (json.z !== undefined) {
                this.m_z = Number(json.z);
            }
        };
        Vector3.prototype.add = function (v) {
            this.m_x += v.m_x;
            this.m_y += v.m_y;
            this.m_z += v.m_z;
            return this;
        };
        Vector3.prototype.subtract = function (v) {
            this.m_x -= v.m_x;
            this.m_y -= v.m_y;
            this.m_z -= v.m_z;
            return this;
        };
        Vector3.prototype.multiply = function (value) {
            this.m_x *= value;
            this.m_y *= value;
            this.m_z *= value;
            return this;
        };
        Vector3.prototype.divide = function (value) {
            this.m_x /= value;
            this.m_y /= value;
            this.m_z /= value;
            return this;
        };
        Vector3.prototype.clone = function () {
            return new Vector3(this.m_x, this.m_y, this.m_z);
        };
        Vector3.prototype.toVector2 = function () {
            return new Vector2(this.m_x, this.m_y);
        };
        return Vector3;
    }());
    Lib.Vector3 = Vector3;
    var Vector2 = /** @class */ (function () {
        /**
         * Creates a new vector 2.
         * @param x The x component.
         * @param y The y component.
         */
        function Vector2(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this.m_x = x;
            this.m_y = y;
        }
        Object.defineProperty(Vector2.prototype, "x", {
            /** The x component. */
            get: function () {
                return this.m_x;
            },
            /** The x component. */
            set: function (value) {
                this.m_x = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2.prototype, "y", {
            /** The y component. */
            get: function () {
                return this.m_y;
            },
            /** The y component. */
            set: function (value) {
                this.m_y = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector2, "zero", {
            get: function () {
                return new Vector2();
            },
            enumerable: true,
            configurable: true
        });
        Vector2.distance = function (a, b) {
            var diff = a.clone().subtract(b);
            var value = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
            return value;
        };
        /** Returns the data of this vector as a number array. */
        Vector2.prototype.toArray = function () {
            return [this.m_x, this.m_y];
        };
        /** Returns the data of this vector as a Float32Array. */
        Vector2.prototype.toFloat32Array = function () {
            return new Float32Array(this.toArray());
        };
        Vector2.prototype.toVector3 = function () {
            return new Vector3(this.m_x, this.m_y, 0);
        };
        Vector2.prototype.copyFrom = function (vector) {
            this.m_x = vector.m_x;
            this.m_y = vector.m_y;
        };
        Vector2.prototype.setFromJson = function (json) {
            if (json.x !== undefined) {
                this.m_x = Number(json.x);
            }
            if (json.y !== undefined) {
                this.m_y = Number(json.y);
            }
        };
        Vector2.prototype.add = function (v) {
            this.m_x += v.m_x;
            this.m_y += v.m_y;
            return this;
        };
        Vector2.prototype.subtract = function (v) {
            this.m_x -= v.m_x;
            this.m_y -= v.m_y;
            return this;
        };
        Vector2.prototype.multiply = function (v) {
            this.m_x *= v.m_x;
            this.m_y *= v.m_y;
            return this;
        };
        Vector2.prototype.divide = function (v) {
            this.m_x /= v.m_x;
            this.m_y /= v.m_y;
            return this;
        };
        Vector2.prototype.clone = function () {
            return new Vector2(this.m_x, this.m_y);
        };
        return Vector2;
    }());
    Lib.Vector2 = Vector2;
})(Lib || (Lib = {}));
var Lib;
(function (Lib) {
    var ZoneState;
    (function (ZoneState) {
        ZoneState[ZoneState["UNINITIALIZED"] = 0] = "UNINITIALIZED";
        ZoneState[ZoneState["LOADING"] = 1] = "LOADING";
        ZoneState[ZoneState["UPDATEING"] = 2] = "UPDATEING";
    })(ZoneState = Lib.ZoneState || (Lib.ZoneState = {}));
    var Zone = /** @class */ (function () {
        function Zone(id, name, description) {
            this.m_state = ZoneState.UNINITIALIZED;
            this.m_globalID = -1;
            this.m_id = id;
            this.m_name = name;
            this.m_description = description;
            this.m_scene = new Lib.Scene();
        }
        Object.defineProperty(Zone.prototype, "id", {
            get: function () {
                return this.m_id;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Zone.prototype, "name", {
            get: function () {
                return this.m_name;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Zone.prototype, "description", {
            get: function () {
                return this.m_description;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Zone.prototype, "scene", {
            get: function () {
                return this.m_scene;
            },
            enumerable: true,
            configurable: true
        });
        Zone.prototype.initialize = function (data) {
            //phase objects
            if (data.objects === undefined) {
                throw new Error("Zone initialization error: no object list.");
            }
            for (var o in data.objects) {
                var obj = data.objects[o];
                this.loadSimobject(obj, this.m_scene.root);
            }
        };
        Zone.prototype.load = function () {
            this.m_state = ZoneState.LOADING;
            this.m_scene.load();
            this.m_state = ZoneState.UPDATEING;
        };
        Zone.prototype.unload = function () {
        };
        Zone.prototype.update = function (time) {
            if (this.m_state === ZoneState.UPDATEING) {
                this.m_scene.update(time);
            }
        };
        Zone.prototype.render = function (shader) {
            if (this.m_state === ZoneState.UPDATEING) {
                this.m_scene.render(shader);
            }
        };
        Zone.prototype.onActivated = function () {
        };
        Zone.prototype.onDeactivated = function () {
        };
        Zone.prototype.loadSimobject = function (data, parent) {
            //phase name
            var name;
            if (data.name !== undefined) {
                name = String(data.name);
                console.log("load SimObject:" + name);
            }
            this.m_globalID++;
            var simObject = new Lib.SimObject(this.m_globalID, name, this.m_scene);
            //phase transform
            if (data.transform !== undefined) {
                simObject.transform.setFromJson(data.transform);
                console.log("load SimObject:" + name + " transform");
            }
            if (data.components !== undefined) {
                for (var c in data.components) {
                    var component = Lib.ComponentManager.extractComponent(data.components[c]);
                    console.log("load SimObject:" + name + " components:" + component.name);
                    simObject.addComponent(component);
                }
            }
            if (data.behaviors !== undefined) {
                for (var b in data.behaviors) {
                    var behavior = Lib.BehaviorManager.extractComponent(data.behaviors[b]);
                    console.log("load SimObject:" + name + " behaviors:" + behavior.name);
                    simObject.addBehavior(behavior);
                }
            }
            //load child
            if (data.children !== undefined) {
                for (var o in data.children) {
                    var obj = data.children[o];
                    this.loadSimobject(obj, simObject);
                }
            }
            //add to parent
            if (parent !== undefined) {
                parent.addChild(simObject);
            }
        };
        return Zone;
    }());
    Lib.Zone = Zone;
    var ZoneManager = /** @class */ (function () {
        function ZoneManager() {
        }
        ZoneManager.initialize = function () {
            ZoneManager.m_inst = new ZoneManager();
            //ZoneManager.m_registerZones[0] = "asset/testZone.json";
            ZoneManager.m_registerZones[0] = "asset/testZone.json";
        };
        /*
        public static createZone(name: string, description: string): number {
            ZoneManager.m_globalZoneID++;
            let zone = new TestZone(ZoneManager.m_globalZoneID, name, description);
            ZoneManager.m_zones[ZoneManager.m_globalZoneID] = zone;
            return ZoneManager.m_globalZoneID;
        }*/
        ZoneManager.changeZone = function (id) {
            if (ZoneManager.m_activeZone !== undefined) {
                ZoneManager.m_activeZone.onDeactivated();
                ZoneManager.m_activeZone.unload();
                ZoneManager.m_activeZone = undefined;
            }
            if (ZoneManager.m_registerZones[id] !== undefined) {
                if (Lib.AssetManager.isAssetLoader(ZoneManager.m_registerZones[id])) {
                    var asset = Lib.AssetManager.getAsset(ZoneManager.m_registerZones[id]);
                    ZoneManager.loadZone(asset);
                }
                else {
                    //asset is not loaded
                    Lib.Message.subscribe(Lib.MESSAGE_ASSET_LOADER_ASSET_LOADED + ZoneManager.m_registerZones[id], ZoneManager.m_inst);
                    Lib.AssetManager.loadAsset(ZoneManager.m_registerZones[id]);
                }
            }
            else {
                throw new Error("Zone id:" + id.toString + "is not exist");
            }
        };
        Object.defineProperty(ZoneManager, "activeZone", {
            get: function () {
                return this.m_activeZone;
            },
            enumerable: true,
            configurable: true
        });
        ZoneManager.update = function (time) {
            if (ZoneManager.m_activeZone !== undefined) {
                ZoneManager.m_activeZone.update(time);
            }
        };
        ZoneManager.render = function (shader) {
            if (ZoneManager.m_activeZone !== undefined) {
                ZoneManager.m_activeZone.render(shader);
            }
        };
        ZoneManager.prototype.onMessage = function (message) {
            if (message.code.indexOf(Lib.MESSAGE_ASSET_LOADER_ASSET_LOADED) !== -1) {
                var asset = message.context;
                ZoneManager.loadZone(asset);
            }
        };
        ZoneManager.loadZone = function (asset) {
            var data = asset.data;
            var id;
            if (data.id === undefined) {
                throw new Error("Zone file format error: id is not exist.");
            }
            else {
                id = Number(data.id);
            }
            var name;
            if (data.name === undefined) {
                throw new Error("Zone file format error: name is not exist.");
            }
            else {
                name = String(data.name);
            }
            var description;
            if (data.description !== undefined) {
                description = String(data.description);
            }
            ZoneManager.m_activeZone = new Zone(id, name, description);
            ZoneManager.m_activeZone.initialize(data);
            ZoneManager.m_activeZone.onActivated();
            ZoneManager.m_activeZone.load();
        };
        ZoneManager.m_globalZoneID = -1;
        //private static m_zones: { [id: number]: Zone } = {};
        ZoneManager.m_registerZones = {};
        return ZoneManager;
    }());
    Lib.ZoneManager = ZoneManager;
})(Lib || (Lib = {}));
//# sourceMappingURL=App.js.map