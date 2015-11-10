(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define("webim", ["webim-dependencies", "webim-templates"],function (dependencies, templates) {
                var otr = dependencies.otr;
                if (typeof otr !== "undefined") {
                    return factory(
                        dependencies.jQuery,
                        _,
                        otr.OTR,
                        otr.DSA,
                        templates,
                        dependencies.moment,
                        dependencies.utils
                    );
                } else {
                    return factory(
                        dependencies.jQuery,
                        _,
                        undefined,
                        undefined,
                        templates,
                        dependencies.moment,
                        dependencies.utils
                    );
                }
            }
        );
    } else {
        root.webim = factory(jQuery, _, OTR, DSA, JST, moment, utils);
    }
}(this, function ($, _, OTR, DSA, templates, moment, utils) {

	if (typeof console === "undefined" || typeof console.log === "undefined") {
        console = { log: function () {}, error: function () {} };
    }
	
	_.templateSettings = {
        evaluate : /\{\[([\s\S]+?)\]\}/g,
        interpolate : /\{\{([\s\S]+?)\}\}/g
    };
    
    var webim = {
        plugins: {},
        templates: templates,
        emit: function (evt, data) {
            $(this).trigger(evt, data);
        },
        once: function (evt, handler) {
            $(this).one(evt, handler);
        },
        on: function (evt, handler) {
            $(this).bind(evt, handler);
        },
        off: function (evt, handler) {
            $(this).unbind(evt, handler);
        },
        refreshWebkit: function () {
            /* This works around a webkit bug. Refresh the browser's viewport,
            * otherwise chatboxes are not moved along when one is closed.
            */
            if ($.browser.webkit) {
                var conversejs = document.getElementById('conversejs');
                conversejs.style.display = 'none';
                conversejs.offsetHeight = conversejs.offsetHeight;
                conversejs.style.display = 'block';
            }
        }
    };
    
    webim.initialize = function (settings, callback) {
    	var webim = this;
        this.connection=null;

    	// Logging
        Strophe.log = function (level, msg) { console.log(level+' '+msg); };
        Strophe.error = function (msg) {
            console.log('ERROR: '+msg);
        };

        // Add Strophe Namespaces
        Strophe.addNamespace('REGISTER', 'jabber:iq:register');
        Strophe.addNamespace('XFORM', 'jabber:x:data');

        // Add Strophe Statuses
        var i = 0;
        Object.keys(Strophe.Status).forEach(function (key) {
            i = Math.max(i, Strophe.Status[key]);
        });
        Strophe.Status.REGIFAIL        = i + 1;
        Strophe.Status.REGISTERED      = i + 2;
        Strophe.Status.CONFLICT        = i + 3;
        Strophe.Status.NOTACCEPTABLE   = i + 5;
        
        // Constants
        // ---------
        var UNENCRYPTED = 0;
        var UNVERIFIED= 1;
        var VERIFIED= 2;
        var FINISHED = 3;
        var KEY = {
            ENTER: 13
        };
        var STATUS_WEIGHTS = {
            'offline':      6,
            'unavailable':  5,
            'xa':           4,
            'away':         3,
            'dnd':          2,
            'online':       1
        };
        var INACTIVE = 'inactive';
        var ACTIVE = 'active';
        var COMPOSING = 'composing';
        var PAUSED = 'paused';
        var GONE = 'gone';
        var HAS_CSPRNG = ((typeof crypto !== 'undefined') &&
            ((typeof crypto.randomBytes === 'function') ||
                (typeof crypto.getRandomValues === 'function')
        ));
        var HAS_CRYPTO = HAS_CSPRNG && (
            (typeof CryptoJS !== "undefined") &&
            (typeof OTR !== "undefined") &&
            (typeof DSA !== "undefined")
        );
        var OPENED = 'opened';
        var CLOSED = 'closed';
        
        // Default configuration values
        // ----------------------------
        var default_settings = {
            allow_contact_requests: true,
            allow_dragresize: true,
            allow_logout: true,
            allow_muc: true,
            allow_otr: true,
            allow_registration: true,
            animate: true,
            auto_list_rooms: false,
            auto_reconnect: false,
            auto_subscribe: false,
            bosh_service_url: undefined, // The BOSH connection manager URL.
            cache_otr_key: false,
            debug: false,
            domain_placeholder: " e.g. conversejs.org",  // Placeholder text shown in the domain input on the registration form
            default_box_height: 400, // The default height, in pixels, for the control box, chat boxes and chatrooms.
            expose_rid_and_sid: false,
            forward_messages: false,
            hide_muc_server: false,
            hide_offline_users: false,
            i18n: locales.en,
            jid: undefined,
            message_carbons: false,
            no_trimming: false, // Set to true for phantomjs tests (where browser apparently has no width)
            play_sounds: false,
            providers_link: 'https://xmpp.net/directory.php', // Link to XMPP providers shown on registration page
            rid: undefined,
            roster_groups: false,
            show_controlbox_by_default: false,
            show_only_online_users: false,
            show_toolbar: true,
            sid: undefined,
            storage: 'session', //used
            use_otr_by_default: false,
            use_vcards: true,
            visible_toolbar_buttons: {
                'emoticons': true,
                'call': false,
                'clear': true,
                'toggle_participants': true
            },
            xhr_custom_status: false,
            xhr_custom_status_url: '',
            xhr_user_search: false,
            xhr_user_search_url: ''
        };
        _.extend(this, default_settings);
        // Allow only whitelisted configuration attributes to be overwritten
        _.extend(this, _.pick(settings, Object.keys(default_settings)));
        
        
        
        // Translation machinery
        // ---------------------
        var __ = $.proxy(utils.__, this);
        var ___ = utils.___;
        
        // Backbone.sync = function(method, model) {
		    // alert(method + ": " + JSON.stringify(model));
		// };


        
        this.Message = Backbone.Model;
        this.Messages = Backbone.Collection.extend({
            model: webim.Message
        });

        this.ChatBox = Backbone.Model.extend({
        	
        });
        
        this.ChatBoxView = Backbone.View.extend({
        	
        });
        
        this.ChatBoxes = Backbone.Collection.extend({
        	model: webim.ChatBox,
        	comparator: 'time_opened',

            registerMessageHandler: function () {
                webim.connection.addHandler(
                    $.proxy(function (message) {
                        this.onMessage(message);
                        return true;
                    }, this), null, 'message', 'chat');

                webim.connection.addHandler(
                    $.proxy(function (message) {
                        this.onInvite(message);
                        return true;
                    }, this), 'jabber:x:conference', 'message');
            },
            
            onConnected: function () {
            	console.log("this.ChatBoxes onConnected method");
                this.browserStorage = new Backbone.BrowserStorage[webim.storage](b64_sha1('webim.chatboxes-'+webim.bare_jid));
                this.registerMessageHandler();
                // this.fetch({
                    // add: true,
                    // success: $.proxy(function (collection, resp) {
                    	// console.log("this.ChatBoxes onConnected method,fetch success");
                    	// console.log(collection);
                    	// console.log(_.pluck(resp, 'id'));
                        // if (!_.include(_.pluck(resp, 'id'), 'controlbox')) {
                            // this.add({
                                // id: 'controlbox',
                                // box_id: 'controlbox'
                            // });
                        // }
                        // // this.get('controlbox').save({connected:true});
                     // }, this)
                // });
            },
            
            isOnlyChatStateNotification: function ($msg) {
                // See XEP-0085 Chat State Notification
                return (
                    $msg.find('body').length === 0 && (
                        $msg.find(ACTIVE).length !== 0 ||
                        $msg.find(COMPOSING).length !== 0 ||
                        $msg.find(INACTIVE).length !== 0 ||
                        $msg.find(PAUSED).length !== 0 ||
                        $msg.find(GONE).length !== 0
                    )
                );
            },
            
            onInvite: function (message) {
            	console.log("this.ChatBoxes onInvite method");
            },
            
            onMessage: function(message) {
                console.log("this.ChatBoxes onInvite onMessage");
                var to = message.getAttribute('to');
                var from = message.getAttribute('from');
                var type = message.getAttribute('type');
                var elems = message.getElementsByTagName('body');

                if (type == "chat" && elems.length > 0) {
                    var body = elems[0];
                    var message = Strophe.getText(body);
                    console.log('receive msg: '+message);

                    var messageModel = new webim.MessageModel({
                        'message': message,
                        'type'    : "chatItem you"
                    });
                    //添加信息到信息集合中,会触发collection的add事件
                    webim.messageCollection.add(messageModel);
                }

            }
        });
        
        this.ChatBoxViews = Backbone.Overview.extend({

        });
        
        
        this.ChatLeftPanelTopModel = Backbone.Model.extend({
        	defaults:{
        		nickName:"",
        		avatar:"./images/avatar_default.png"
        	},
		    fetch: function () {
			    $.ajax({
			      method:"post",
			      url: "data/user_profile.json",
			      dataType:"json",
			      success: $.proxy(function(data){
				    	console.log(data);
		                this.set(data);
				    } ,this)
			    });
			}
        });

        this.Friend = Backbone.Model.extend({

        });

        this.Friends = Backbone.Collection.extend({
            model: webim.Friend,
            fetch: function() {
                $.ajax({
                    method: "post",
                    url: "data/friend_list.json",
                    dataType: "json",
                    success: $.proxy(function(data) {
                        console.log(data);
                        var arrObj = data.friendList;
                        if (typeof arrObj!="undefined"&&arrObj.length>0) {
                            this.add(arrObj);
                        }
                    }, this)
                });
            }
        });

        this.ChatMessageMainPanelModel=Backbone.Model.extend({
            defaults:{nickName:""}

        });

        this.MessageModel=Backbone.Model.extend({

        });

        this.MessageCollection=Backbone.Collection.extend({
            model:webim.MessageModel
        });

        this.rightMainWindow={
            exist:false,//右侧主窗口存在标志
            currentUserId:'',//右侧对话框当前userId
            getCurrentTime:function(){
                var myDate = new Date();
                return myDate.getHours()+':'+myDate.getMinutes();
            }
        };
        
        this.ChatLeftPanelTopView = Backbone.View.extend({
        	tagName: 'div',
            className: 'top',
            id: 'chat_left_panel_top',
            initialize: function () {
            	//绑定change事件，当数据改变时执行此回调函数
            	this.model.on('change:nickName',$.proxy(function(){this.render(); }),this);
                this.render();
            },
            render: function () {
            	this.$el.html(webim.templates.chat_left_panel_top(this.model.toJSON()));
                return this;
            }
        });
        
        this.ChatLeftPanelTabView = Backbone.View.extend({
        	tagName: 'div',
            className: 'chatListSearch',
            id: 'chat_left_panel_tab',
            events:{
            	"click #listOperatorTab a":"clickListOperatorTab"
            },
            render: function () {
            	this.$el.html(webim.templates.chat_left_panel_tab());
                return this;
            },
            clickListOperatorTab: function(event){
            	event.preventDefault();//阻止a链接的跳转行为 
            	$(event.currentTarget).tab('show');
            	console.log($(event.currentTarget).attr("class"));
            }
        });
        /**
         * 好友列表视图
         */
        this.ChatConversationListView = Backbone.View.extend({
        	tagName:"ul",
        	className:"list-group",
        	initialize: function () {
                // this.model.on('change',$.proxy(function(){this.render(); }),this);
                //集合的事件绑定
                this.collection.bind("add", this.addFriend);
                this.collection.bind("change", this.friendChange);
        		this.render();
        	},
            //增加好友
            addFriend:function(model){
                $('#conmu #conversationContainer .list-group').append(webim.templates.chat_conversation_list_item(model.attributes));
            },
            friendChange:function(model){
                var id=model.attributes.userId;
                var currentTime=webim.rightMainWindow.getCurrentTime();
                $('#'+id+' .extend .time').text(currentTime);
                $('#'+id+' .descWrapper .desc').text(model.attributes.desc);
            },
            render: function() {
                var friendList = this.collection.models;
                if (typeof friendList == "undefined" || friendList.length <= 0) {
                    this.$el.html("")
                    return this;
                }
                var html = "";
                for (var i = 0; i < friendList.length; i++) {
                    var template = webim.templates.chat_conversation_list_item(friendList[i]);
                    html += template;
                };
                this.$el.html(html);
                return this;
            }
        });
        /**
         * 群组视图
         */
        this.ChatContactListView = Backbone.View.extend({
        	tagName:"ul",
        	className:"list-group",
        	initialize: function () {
        		this.render();
        	},
        	render: function () {
        		var html = webim.templates.chat_contact_list_item_title()+webim.templates.chat_contact_list_item_detail();
        		html += html;
        		html += webim.templates.chat_contact_list_item_detail();
            	this.$el.html(html);
                return this;
            }
        });
        
        /**
         * 左侧列表视图
         */
        this.ChatLeftPanelListView = Backbone.View.extend({
        	tagName: 'div',
            className: 'listContentWrap',
            id: 'chat_left_panel_list',
            initialize: function () {
                webim.friends=new webim.Friends();
            	this.chatConversationListView = new webim.ChatConversationListView({collection:webim.friends});
                webim.friends.fetch();
            	this.chatContactListView = new webim.ChatContactListView();
            	
        		this.render();
        	},
            render: function () {
            	this.$el.css("position","relative");
            	this.$el.css("overflow-y","hidden");
            	this.$el.css("height","501px");
            	this.$el.html(webim.templates.chat_left_panel_list());
            	$("#conversationContainer", this.el).append(this.chatConversationListView.render().el);
            	$("#contactListContainer", this.el).append(this.chatContactListView.render().el);
                return this;
            }
        });
        
        this.ChatLeftPanelFooterView = Backbone.View.extend({
        	tagName: 'div',
            className: 'listOperator',
            initialize: function () {
        		this.render();
        	},
            render:function(){
            	this.$el.html(webim.templates.chat_left_panel_footer());
            	return this;
            }
        });
        
        this.ChatLeftPanelView = Backbone.View.extend({
            tagName: 'div',
            className: 'list',
            id: 'chat_left_panel',
            initialize: function () {
            	this.chatLeftPanelTopModel = new webim.ChatLeftPanelTopModel();
            	this.chatLeftPanelTopView = new webim.ChatLeftPanelTopView({model:this.chatLeftPanelTopModel});
                this.chatLeftPanelTopModel.fetch();
                this.chatLeftPanelTabView = new webim.ChatLeftPanelTabView();
                this.chatLeftPanelListView = new webim.ChatLeftPanelListView();
                this.chatLeftPanelFooterView = new webim.ChatLeftPanelFooterView();
                this.render();
            },
            render: function () {
            	this.$el.append(this.chatLeftPanelTopView.render().el);   
            	this.$el.append(this.chatLeftPanelTabView.render().el);   
            	this.$el.append(this.chatLeftPanelListView.render().el);   
            	this.$el.append(this.chatLeftPanelFooterView.render().el);   
                return this;
            }
        });
        /**
         * 消息面板视图
         */
        this.ChatMessageMainPanelView =  Backbone.View.extend({
        	tagName:"div",
        	className:"chatMainPanel",
        	id:"chatMainPanel",
        	initialize:function(){
                this.model.on('change:nickName',$.proxy(function(){this.render(); }),this);
                //集合的事件绑定，用来自动更新视图
                this.collection.bind("add", this.addMsg);
                // this.collection.bind("remove", this.delMsg);
        		this.render();
        	},
        	render:function(){
                this.$el.html(webim.templates.chat_message_main_panel(this.model.toJSON()));
        		return this;
        	},
            //当collection发生了add事件
            addMsg : function(msgModel) {
                //每个model会随机生成一个唯一的cid，用来识别，区分
                $("#chat_chatmsglist").append(webim.templates.chat_message(msgModel.toJSON()));
            }

        });
        /**
         * 消息主框架视图
         */
        this.ChatMessageContainerView = Backbone.View.extend({
        	tagName:"div",
        	className:"chat lightBorder",
        	id:"chatMessageContainer",
        	initialize:function(){
                //创建信息版面model
                webim.chatMessageMainPanelModel = new webim.ChatMessageMainPanelModel();
                //创建信息集合
                webim.messageCollection = new webim.MessageCollection();
                //画出信息信息面板
                webim.chatMessageMainPanelView = new webim.ChatMessageMainPanelView({
                    model: webim.chatMessageMainPanelModel,
                    collection: webim.messageCollection
                });
                // this.chatMessageMainPanelView = new webim.ChatMessageMainPanelView();
        		this.render();
        	},
        	render:function(){
        		this.$el.css("visibility: ","visible");
        		this.$el.html(webim.templates.chat_message_container());
        		$(".chatContainer",this.el).append(webim.chatMessageMainPanelView.render().el);
                //右侧面板与content相连接，与左侧面板同级
                $('.chatPanel .content').append(this.el);
        		return this;
        	}
        	
        });
        
        this.WebimContainerView = Backbone.View.extend({
            tagName: 'div',
            className: 'webim_container',
            id: 'container',
            initialize: function () {
            	this.chatLeftPanelView = new webim.ChatLeftPanelView();
            	// this.chatMessageContainerView = new webim.ChatMessageContainerView();
                this.render();
            },
            render: function () {
            	this.$el.html(webim.templates.webim_container());
            	$('.chatPanel .content',this.el).append(this.chatLeftPanelView.render().el);
            	$('.chatPanel .content',this.el).append('<div id="vernierContainer" style="width: 32px; position: relative; float: left; overflow: hidden; margin-top: 135px; visibility: visible; height: 501px;"></div>');
            	// $('.chatPanel .content',this.el).append(this.chatMessageContainerView.render().el);
            	$('#webimjs').append(this.el);
                return this;
            }
        });

        this.setSession = function () {
            if (this.keepalive) {
                this.session.save({
                    jid: this.connection.jid,
                    rid: this.connection._proto.rid,
                    sid: this.connection._proto.sid
                });
            }
        };
        
        this.clearSession = function () {
            // this.roster.browserStorage._clear();
            this.session.browserStorage._clear();
            // XXX: this should perhaps go into the beforeunload handler
            // converse.chatboxes.get('controlbox').save({'connected': false});
        };
        
        this.BOSHSession = Backbone.Model;
        this.initSession = function () {
            this.session = new this.BOSHSession();
            var id = b64_sha1('webim.bosh-session');
            this.session.id = id; // Appears to be necessary for backbone.browserStorage
            this.session.browserStorage = new Backbone.BrowserStorage[webim.storage](id);
            //TODO
            //this.session.fetch();
            $(window).on('beforeunload', $.proxy(function () {
                if (webim.connection.authenticated) {
                    this.setSession();
                } else {
                    this.clearSession();
                }
            }, this));
        };
        
        this.setUpXMLLogging = function () {
            if (this.debug) {
                this.connection.xmlInput = function (body) { console.log(body); };
                this.connection.xmlOutput = function (body) { console.log(body); };
            }
        };
        
        this.onConnect = function (status, condition, reconnect) {
			alert("this.onConnect")
            if ((status === Strophe.Status.CONNECTED) ||
                (status === Strophe.Status.ATTACHED)) {
                if ((typeof reconnect !== 'undefined') && (reconnect)) {
                    console.log(status === Strophe.Status.CONNECTED ? 'Reconnected' : 'Reattached');
                    webim.onReconnected();
                } else {
                    console.log(status === Strophe.Status.CONNECTED ? 'Connected' : 'Attached');
                    webim.onConnected();
                }
            } 
            // else if (status === Strophe.Status.DISCONNECTED) {
                // if (converse.auto_reconnect) {
                    // converse.reconnect();
                // } else {
                    // converse.renderLoginPanel();
                // }
            // } else if (status === Strophe.Status.Error) {
                // converse.giveFeedback(__('Error'), 'error');
            // } else if (status === Strophe.Status.CONNECTING) {
                // converse.giveFeedback(__('Connecting'));
            // } else if (status === Strophe.Status.AUTHENTICATING) {
                // converse.giveFeedback(__('Authenticating'));
            // } else if (status === Strophe.Status.AUTHFAIL) {
                // converse.giveFeedback(__('Authentication Failed'), 'error');
                // converse.connection.disconnect(__('Authentication Failed'));
            // } else if (status === Strophe.Status.DISCONNECTING) {
                // if (!converse.connection.connected) {
                    // converse.renderLoginPanel();
                // }
                // if (condition) {
                    // converse.giveFeedback(condition, 'error');
                // }
            // }
        };
        
        this.onConnected = function () {
        	this.setSession();
            this.jid = this.connection.jid;
            this.bare_jid = Strophe.getBareJidFromJid(this.connection.jid);
            this.domain = Strophe.getDomainFromJid(this.connection.jid);
            //注册取得信息后方法
            // webim.connection.addHandler(webim.onMessage, null, 'message', null, null, null);
            // var pres = $pres();
            // webim.connection.send(pres.tree());
            
            this.chatboxes.onConnected();
            webim.connection.send($pres().tree());
  
        };
        
        this.initConnection = function () {
            var rid, sid, jid;
            if (this.connection && this.connection.connected) {
                this.setUpXMLLogging();
                this.onConnected();
            } else {
                // XXX: it's not yet clear what the order of preference should
                // be between RID and SID received via the initialize method or
                // those received from sessionStorage.
                //
                // What do you we if we receive values from both avenues?
                //
                // Also, what do we do when the keepalive session values are
                // expired? Do we try to fall back?
                if (!this.bosh_service_url) {
                    throw("Error: you must supply a value for the bosh_service_url");
                }
                webim.connection = new Strophe.Connection(this.bosh_service_url);
                this.setUpXMLLogging();
                webim.connection.connect("wuhao002@im.brand.cn", "Aa123456", this.onConnect);
				//this.connection.attach("c9c86063.brand.cn/c9c86063","c9c86063","10005",this.onConnect,60,1,5);

            }
        };
        
        
        this._initialize = function () {
        	this.chatbox = new this.ChatBox();
        	this.chatboxes = new this.ChatBoxes();
        	
        	// this.chatboxes.fetch({   
                // url:"fetch.php",   
                // type:"POST",   
                // data:"name=John&location=Boston",   
                // success:function(model,response){   
                   // alert(response.name);   
                // },   
                // error:function(err){   
                    // console.log("err");   
                // }   
            // });
        	
            this.chatboxviews = new this.ChatBoxViews({model: this.chatboxes});
            this.webimContainerView = new this.WebimContainerView();
        	
            // this.otr = new this.OTR();
            this.initSession();

            this.initConnection();
            // if (this.connection) {
                // this.addControlBox();
            // }
            
            // this.ChatLeftPanelView = new this.ChatLeftPanelView();
      
            return this;
        };

        this._initializePlugins = function () {
            _.each(this.plugins, $.proxy(function (plugin) {
                $.proxy(plugin, this)(this);
            }, this));
        };
        
        
        // Initialization
        // --------------
        // This is the end of the initialize method.
        if (settings.connection) {
            this.connection = settings.connection;
        }
        this._initializePlugins();
        this._initialize();
        //TODO 临时注释
        // this.registerGlobalEventHandlers();
        // converse.emit('initialized');
    };
    
    
	
	return {
        'initialize': function (settings, callback) {
            webim.initialize(settings, callback);
        },
        'contacts': {
            'get': function (jids) {
                var _transform = function (jid) {
                    var contact = converse.roster.get(Strophe.getBareJidFromJid(jid));
                    if (contact) {
                        return contact.attributes;
                    }
                    return null;
                };
                if (typeof jids === "string") {
                    return _transform(jids);
                }
                return _.map(jids, _transform);
            }
        },
        'chats': {
            'get': function (jids) {
                var _transform = function (jid) {
                    var chatbox = converse.chatboxes.get(jid);
                    if (!chatbox) {
                        var roster_item = converse.roster.get(jid);
                        if (roster_item === undefined) {
                            converse.log('Could not get roster item for JID '+jid, 'error');
                            return null;
                        }
                        chatbox = converse.chatboxes.create({
                            'id': jid,
                            'jid': jid,
                            'fullname': _.isEmpty(roster_item.get('fullname'))? jid: roster_item.get('fullname'),
                            'image_type': roster_item.get('image_type'),
                            'image': roster_item.get('image'),
                            'url': roster_item.get('url')
                        });
                    }
                    return wrappedChatBox(chatbox);
                };
                if (typeof jids === "string") {
                    return _transform(jids);
                }
                return _.map(jids, _transform);
            }
        },
        'tokens': {
            'get': function (id) {
                if (!converse.expose_rid_and_sid || typeof converse.connection === "undefined") {
                    return null;
                }
                if (id.toLowerCase() === 'rid') {
                    return converse.connection.rid || converse.connection._proto.rid;
                } else if (id.toLowerCase() === 'sid') {
                    return converse.connection.sid || converse.connection._proto.sid;
                }
            }
        },
        'listen': {
            'once': function (evt, handler) {
                converse.once(evt, handler);
            },
            'on': function (evt, handler) {
                converse.on(evt, handler);
            },
            'not': function (evt, handler) {
                converse.off(evt, handler);
            },
        },
        'plugins': {
            'add': function (name, callback) {
                converse.plugins[name] = callback;
            },
            'remove': function (name) {
                delete converse.plugins[name];
            },
            'extend': function (obj, attributes) {
                /* Helper method for overriding or extending Converse's Backbone Views or Models
                *
                * When a method is overriden, the original will still be available
                * on the _super attribute of the object being overridden.
                *
                * obj: The Backbone View or Model
                * attributes: A hash of attributes, such as you would pass to Backbone.Model.extend or Backbone.View.extend
                */
                if (!obj.prototype._super) {
                    obj.prototype._super = {};
                }
                _.each(attributes, function (value, key) {
                    if (key === 'events') {
                        obj.prototype[key] = _.extend(value, obj.prototype[key]);
                    } else {
                        if (typeof key === 'function') {
                            obj.prototype._super[key] = obj.prototype[key];
                        }
                        obj.prototype[key] = value;
                    }
                });
            }
        },
        'env': {
            'jQuery': $,
            'Strophe': Strophe,
            '_': _
        },

        // Deprecated API methods
        'getBuddy': function (jid) {
            converse.log('WARNING: the "getBuddy" API method has been deprecated. Please use "contacts.get" instead');
            return this.contacts.get(jid);
        },
        'getChatBox': function (jid) {
            converse.log('WARNING: the "getChatBox" API method has been deprecated. Please use "chats.get" instead');
            return this.chats.get(jid);
        },
        'openChatBox': function (jid) {
            converse.log('WARNING: the "openChatBox" API method has been deprecated. Please use "chats.get(jid).open()" instead');
            var chat = this.chats.get(jid);
            if (chat) { chat.open(); }
            return chat;
        },
        'getRID': function () {
            converse.log('WARNING: the "getRID" API method has been deprecated. Please use "tokens.get(\'rid\')" instead');
            return this.tokens.get('rid');
        },
        'getSID': function () {
            converse.log('WARNING: the "getSID" API method has been deprecated. Please use "tokens.get(\'sid\')" instead');
            return this.tokens.get('sid');
        },
        'once': function (evt, handler) {
            converse.log('WARNING: the "one" API method has been deprecated. Please use "listen.once" instead');
            return this.listen.once(evt, handler);
        },
        'on': function (evt, handler) {
            converse.log('WARNING: the "on" API method has been deprecated. Please use "listen.on" instead');
            return this.listen.on(evt, handler);
        },
        'off': function (evt, handler) {
            converse.log('WARNING: the "off" API method has been deprecated. Please use "listen.not" instead');
            return this.listen.not(evt, handler);
        },
         'clickSend': function(event) {
                var context = $('textarea[id="textInput"]').val();
                //创建一个新model
                var messageModel = new webim.MessageModel({
                    'message' : context,
                    'type'    : "chatItem me"
                });
                var currentUserId=webim.rightMainWindow.currentUserId;
                var friendModel=webim.friends.where({userId:currentUserId});
                friendModel[0].set({'desc':context});
                //添加信息到信息集合中,会触发collection的add事件
                webim.messageCollection.add(messageModel);
                
                var sendMsg = $msg({
                    to: "wuhao001@im.brand.cn",
                    from: webim.connection.authzid + "@im.brand.cn",
                    type: 'chat'
                }).cnode(Strophe.xmlElement('body', '', context));
                webim.connection.send(sendMsg.tree());
                $('textarea[id="textInput"]').val('');
                // webim.rightMainWindow.arr[0].set({"message":context});
            },
        'openMsgMainPanel': function(event) {
            var nickName_ = $(event).attr("value");
            var userId = $(event).attr("id");
            webim.rightMainWindow.currentUserId = userId;
            if (!webim.rightMainWindow.exist) { //判断右侧主窗口是否创建
                //画出右侧主窗口大框
                this.chatMessageContainerView = new webim.ChatMessageContainerView();
                //更新chatMessageMainPanelModel属性
                webim.chatMessageMainPanelModel.set({
                    "nickName": nickName_
                });

                webim.rightMainWindow.exist = true; //主窗口已创建
            } else {
                webim.chatMessageMainPanelModel.set({
                    "nickName": nickName_
                });
            }
        }

    };
	
	
}));