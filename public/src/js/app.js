var socket = require('socket.io-client')('http://robot.lyt.io:8080')
var Vue = require('vue')

var app = new Vue({
    data: function () {
        return {
            touchControls: true,
            login: false,
            chat: false,
            username: '',
            messages: [],
            message: '',
            unreadCount: 0, 
            controlling: { username: '', part: '', action: '' },
            MIN_PROXIMITY: 10,
            proximity1: 11
        }
    },
    created: function() {
        socket.on('login', function(data) {
            var message = '';
            if (data.numUsers > 1) {
                message = 'Welcome! There are ' + data.numUsers + ' humans playing with Apollo.'
            } else {
                message = 'Welcome! You\'re the only human playing with Apollo.'
            }
            this.messages.push({
                username: 'Cat Robot',
                message: message
            })
        }.bind(this))

        socket.on('user joined', function(data) {
            if (data.numUsers > 1) {
                message = 'There are ' + data.numUsers + ' humans playing with Apollo.'
            } else {
                message = 'You\'re the only human playing with Apollo.'
            }
            this.messages.push({
                username: 'Cat Robot',
                message: data.username + ' joined the party. ' + message
            })
        }.bind(this))

        socket.on('user left', function(data) {
            if (data.numUsers > 1) {
                message = 'There are ' + data.numUsers + ' humans playing with Apollo.'
            } else {
                message = 'You\'re the only human playing with Apollo.'
            }
            this.messages.push({
                username: 'Cat Robot',
                message: data.username + ' left the party. ' + message
            })
        }.bind(this))


        socket.on('camera moved', function (data) {
            this.$$.cameraX.style.right = ( data.x / 180 * 100) + '%'
            this.$$.cameraY.style.top = (( data.y / 180 * 100) / 2) + '%' // end on center point
            if (data.x <= 0) { this.$$.cameraRight.style.display = 'none' } else { this.$$.cameraRight.style.display =  'block' }
            if (data.x >= 180) { this.$$.cameraLeft.style.display = 'none' } else { this.$$.cameraLeft.style.display =  'block' }
            if (data.y <= 0) { this.$$.cameraUp.style.display = 'none' } else { this.$$.cameraUp.style.display =  'block' }
            if (data.y >= 180) { this.$$.cameraDown.style.display = 'none' } else { this.$$.cameraDown.style.display =  'block' }
        }.bind(this))

        socket.on('new message', function(data) {
            this.messages.push({
                username: data.username,
                message: data.message
            })
            var that = this
            setTimeout(function () {
                if (!this.chat) {
                    that.$$.messages.scrollTop = that.$$.messages.scrollHeight
                    that.unreadCount++
                }
            }, 10)
        }.bind(this))

        socket.on('controlling', function(data) {
            var that = this
            this.controlling = data
            setTimeout(function() {
                that.controlling = null
            }, 1000)
        }.bind(this))

        socket.on('proximity1', function (data) {
            this.proximity1 = data;
        }.bind(this))
    },
    ready: function () {
        var that = this;

        var getStream = function(url) {
            return new Promise(function(resolve, reject) {
                var img = new Image()
                img.onload = function() { resolve(img) }
                img.onerror = function() { reject(img) }
                img.src = url //+ '?random-no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16)
                img.id = 'stream'

                // Set a timeout for max-pings, 5s.
                setTimeout(function() { reject(img) }, 3000)
            });
        };

        getStream('http://robot.lyt.io:9000/?action=stream')
            .then(function(img) { 
                document.getElementById('camera').appendChild(img)
            }, function(img) {
                var camera = document.getElementById('camera')
                var msg = document.createElement('div')
                img.src = 'img/test-pattern.gif'
                msg.classList.add('warning')
                msg.innerHTML = '<div>The robot is sleeping.</div>'
                camera.insertBefore( img, camera.firstChild )
                camera.insertBefore( msg, camera.firstChild )
            });

        this.touchControls = ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch
        var allowKeyDown = true;
        var proximityCheck = null;
        document.onkeydown = function (e) {
            e = e || window.event
            if (e.target.tagName.toUpperCase() == 'BODY' && allowKeyDown) {
                switch (e.keyCode) {
                    case 38:
                        if (that.proximity1 > that.MIN_PROXIMITY) {
                            socket.emit('motor forward')
                            that.$$.motorForwardClick.classList.add('active')
                            allowKeyDown = false
                            var callback = function() {
                                if (that.proximity1 < that.MIN_PROXIMITY) {
                                    socket.emit('motor stop')
                                    clearInterval(proximityCheck);
                                }
                            }
                            proximityCheck = setInterval(callback, 250)
                        }
                        break
                    case 40:
                        socket.emit('motor reverse')
                        that.$$.motorReverseClick.classList.add('active')
                        allowKeyDown = false
                        break
                    case 37:
                        socket.emit('motor left')
                        that.$$.motorLeftClick.classList.add('active')
                        allowKeyDown = false
                        break
                    case 39:
                        socket.emit('motor right')
                        that.$$.motorRightClick.classList.add('active')
                        allowKeyDown = false
                        break
                    case 87:
                        socket.emit('camera up')
                        that.$$.cameraUp.classList.add('active')
                        allowKeyDown = false
                        break
                    case 83:
                        socket.emit('camera down')
                        that.$$.cameraDown.classList.add('active')
                        allowKeyDown = false
                        break
                    case 65:
                        socket.emit('camera left')
                        that.$$.cameraLeft.classList.add('active')
                        allowKeyDown = false
                        break
                    case 68:
                        socket.emit('camera right')
                        that.$$.cameraRight.classList.add('active')
                        allowKeyDown = false
                        break
                }
            }
        }
        document.onkeyup = function (e) {
            e = e || window.event
            if (e.target.tagName.toUpperCase() == 'BODY') {
                switch (e.keyCode) {
                    case 38:
                    case 40:
                    case 37:
                    case 39:
                        socket.emit('motor stop')
                        clearInterval(proximityCheck)
                        that.$$.motorForwardClick.classList.remove('active')
                        that.$$.motorReverseClick.classList.remove('active')
                        that.$$.motorLeftClick.classList.remove('active')
                        that.$$.motorRightClick.classList.remove('active')
                        allowKeyDown = true
                        break
                    case 87:
                    case 83:
                    case 65:
                    case 68:
                        that.$$.cameraUp.classList.remove('active')
                        that.$$.cameraDown.classList.remove('active')
                        that.$$.cameraLeft.classList.remove('active')
                        that.$$.cameraRight.classList.remove('active')
                        allowKeyDown = true
                        break
                }
            }
        }
    },
    methods: {
        loginNow: function () {
            if (this.username !== '') {
                this.login = true
                this.username = this.username.slice(0, 20)
                socket.emit('add user', this.username)
            }
        },
        toggleChat: function () {
            this.chat = !this.chat
            var that = this;
            this.unreadCount = 0
            setTimeout(function () {
                that.$$.input.focus()
            }, 10)
        },
        sendMessage: function () {
            if (this.message !== '') {
                this.messages.push({
                    username: this.username,
                    message: this.message
                })
                socket.emit('new message', this.message)
                this.message = ''
                var that = this;
                setTimeout(function () {
                    that.$$.messages.scrollTop = that.$$.messages.scrollHeight
                }, 10)
            }
        },
        cameraUp: function () {
            socket.emit('camera up')
        },
        cameraRight: function () {
            socket.emit('camera right')
        },
        cameraDown: function () {
            socket.emit('camera down')
        },
        cameraLeft: function () {
            socket.emit('camera left')
        },
        motorForward: function () {
            socket.emit('motor forward')
        },
        motorReverse: function () {
            socket.emit('motor reverse')
        },
        motorLeft: function () {
            socket.emit('motor left')
        },
        motorRight: function () {
            socket.emit('motor right')
        },
        motorStop: function () {
            socket.emit('motor stop')
        },
    }
})

app.$mount('#app')