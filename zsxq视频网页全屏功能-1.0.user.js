// ==UserScript==
// @name         zsxq视频网页全屏功能
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  为zsxq视频网站添加一个网页全屏的功能
// @author       You
// @match        *://wx.zsxq.com/*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    // ================== 工具函数 ==================
    function throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ================== Toast 提示模块 ==================
    class ToastManager {
        constructor() {
            this.currentToast = null;
            this.toastTimeout = null;
        }

        showToast(message, duration = 2000) {
            if (this.currentToast) {
                this.currentToast.remove();
            }
            if (this.toastTimeout) {
                clearTimeout(this.toastTimeout);
            }

            const toast = document.createElement('div');
            toast.className = 'video-toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            this.currentToast = toast;

            toast.offsetHeight;
            toast.classList.add('show');

            this.toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                    this.currentToast = null;
                }, 300);
            }, duration);
        }
    }

    // ================== 全屏控制模块 ==================
    class FullScreenController {
        constructor(toastManager) {
            this.toastManager = toastManager;
            this.originalBodyOverflow = document.body.style.overflow;
        }

        enterPseudoFullScreen(videoContainer) {
            videoContainer._originalStyles = {
                position: videoContainer.style.position,
                top: videoContainer.style.top,
                left: videoContainer.style.left,
                width: videoContainer.style.width,
                height: videoContainer.style.height,
                backgroundColor: videoContainer.style.backgroundColor,
                zIndex: videoContainer.style.zIndex,
                overflow: videoContainer.style.overflow
            };

            videoContainer._processingElement = videoContainer.querySelector('.processing');
            if (videoContainer._processingElement) {
                videoContainer._processingElement._originalStyles = {
                    width: videoContainer._processingElement.style.width,
                    height: videoContainer._processingElement.style.height
                };
                videoContainer._processingElement.remove();
            }

            Object.assign(videoContainer.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                width: '100vw',
                height: '100vh',
                backgroundColor: 'black',
                zIndex: '9998',
                overflow: 'hidden'
            });

            if (videoContainer._processingElement) {
                videoContainer._processingElement.style.setProperty('width', '100%', 'important');
                videoContainer._processingElement.style.setProperty('height', '100%', 'important');
                videoContainer.appendChild(videoContainer._processingElement);
            }

            document.body.style.overflow = 'hidden';
            videoContainer._isPseudoFullScreen = true;
        }

        exitPseudoFullScreen(videoContainer) {
            if (!videoContainer._originalStyles) return;

            Object.assign(videoContainer.style, videoContainer._originalStyles);
            delete videoContainer._originalStyles;

            if (videoContainer._processingElement) {
                Object.assign(videoContainer._processingElement.style, videoContainer._processingElement._originalStyles);
                videoContainer.appendChild(videoContainer._processingElement);
                delete videoContainer._processingElement._originalStyles;
            }

            document.body.style.overflow = this.originalBodyOverflow;
            videoContainer._isPseudoFullScreen = false;
        }
    }

    // ================== 按钮拖拽与定位管理 ==================
    class ButtonManager {
        constructor(button, toastManager) {
            this.button = button;
            this.toastManager = toastManager;
            this.isDragging = false;
            this.offsetX = 0;
            this.offsetY = 0;
            this.dragEndXRatio = null;
            this.dragEndYRatio = null;

            this.initDrag();
            this.initResize();
        }

        initDrag() {
            this.button.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                this.isDragging = true;
                const rect = this.button.getBoundingClientRect();
                this.offsetX = e.clientX - rect.left;
                this.offsetY = e.clientY - rect.top;
                e.preventDefault();
            });

            const throttledMove = throttle((e) => {
                if (!this.isDragging) return;
                const x = Math.max(0, Math.min(e.clientX - this.offsetX, window.innerWidth - this.button.offsetWidth));
                const y = Math.max(0, Math.min(e.clientY - this.offsetY, window.innerHeight - this.button.offsetHeight));
                this.updatePosition(x, y);
            }, 16);

            window.addEventListener('mousemove', throttledMove);
            window.addEventListener('mouseup', () => {
                if (this.isDragging) {
                    this.isDragging = false;
                    const rect = this.button.getBoundingClientRect();
                    this.dragEndXRatio = rect.left / window.innerWidth;
                    this.dragEndYRatio = rect.top / window.innerHeight;
                }
            });
        }

        initResize() {
            const throttledResize = throttle(() => {
                if (this.dragEndXRatio === null || this.dragEndYRatio === null) {
                    this.resetToDefaultPosition();
                    return;
                }

                const newLeft = this.dragEndXRatio * window.innerWidth;
                const newTop = this.dragEndYRatio * window.innerHeight;
                const maxWidth = window.innerWidth - this.button.offsetWidth;
                const maxHeight = window.innerHeight - this.button.offsetHeight;

                const clampedLeft = Math.max(0, Math.min(newLeft, maxWidth));
                const clampedTop = Math.max(0, Math.min(newTop, maxHeight));

                this.updatePosition(clampedLeft, clampedTop);
            }, 100);

            window.addEventListener('resize', throttledResize);
        }

        updatePosition(x, y) {
            this.button.style.left = x + 'px';
            this.button.style.top = y + 'px';
            this.button.style.right = 'auto';
            this.button.style.bottom = 'auto';
        }

        resetToDefaultPosition() {
            this.button.style.left = 'auto';
            this.button.style.top = '10px';
            this.button.style.right = '10px';
            this.button.style.bottom = 'auto';
            this.dragEndXRatio = null;
            this.dragEndYRatio = null;
        }

        wasJustDragged() {
            return this.isDragging;
        }
    }

    // ================== 键盘控制模块 ==================
    class KeyboardController {
        constructor(toastManager) {
            this.toastManager = toastManager;
            this.keyHoldTimer = null;
            this.isLongPress = false;
            this.LONG_PRESS_THRESHOLD = 300;
        }

        setup(videoContainer, fullScreenController, fullScreenButton) {
            window.addEventListener('keydown', (event) => {
                const videoElement = videoContainer?.querySelector('video');
                if (!videoElement) return;

                if (event.key === 'Escape') {
                    if (videoContainer._isPseudoFullScreen) {
                        fullScreenController.exitPseudoFullScreen(videoContainer);
                        this.toastManager.showToast('退出全屏');
                        fullScreenButton.innerText = '全屏';
                    }
                } else if (event.key === ' ') {
                    event.preventDefault();
                    if (videoElement.paused) {
                        videoElement.play();
                        this.toastManager.showToast('播放');
                    } else {
                        videoElement.pause();
                        this.toastManager.showToast('暂停');
                    }
                } else if (['ArrowRight', 'ArrowLeft'].includes(event.key)) {
                    event.preventDefault();
                    if (this.keyHoldTimer) return;

                    const direction = event.key === 'ArrowRight' ? 1 : -1;
                    this.keyHoldTimer = setTimeout(() => {
                        this.isLongPress = true;
                        videoElement._originalPlaybackRate = videoElement.playbackRate;
                        videoElement.playbackRate = 3.0;
                        this.toastManager.showToast('3倍速播放中');
                    }, this.LONG_PRESS_THRESHOLD);

                    const handleKeyUp = (upEvent) => {
                        if (upEvent.key === event.key) {
                            clearTimeout(this.keyHoldTimer);
                            this.keyHoldTimer = null;
                            this.isLongPress = false;

                            if (videoElement.playbackRate === 3.0) {
                                videoElement.playbackRate = videoElement._originalPlaybackRate || 1.0;
                                this.toastManager.showToast('恢复正常速度');
                            } else {
                                videoElement.currentTime += direction * 5;
                                this.toastManager.showToast(direction > 0 ? '快进 5 秒' : '快退 5 秒');
                            }

                            window.removeEventListener('keyup', handleKeyUp);
                        }
                    };

                    window.addEventListener('keyup', handleKeyUp);
                }
            });
        }
    }

    // ================== 主逻辑 ==================
    window.addEventListener('load', () => {
        // 注入样式
        const style = document.createElement('style');
        style.textContent = `
            .video-toast {
                position: fixed;
                top: 10%;
                left: 50%;
                transform: translate(-50%, 0);
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 10000;
                pointer-events: none;
                transition: opacity 0.3s;
                opacity: 0;
                font-size: 14px;
            }
            .video-toast.show {
                opacity: 1;
            }
            .fullscreen-btn {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background-color: rgba(0, 123, 255, 0.8);
                color: white;
                border: none;
                padding: 8px 16px;
                cursor: move;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 5px;
                user-select: none;
                white-space: nowrap;
            }
            .fullscreen-btn:hover {
                background-color: rgba(0, 98, 204, 0.9);
                transform: scale(1.05);
            }
            .fullscreen-btn:active {
                transform: scale(0.95);
            }
            .fullscreen-btn::before {
                content: '⤢';
                font-size: 16px;
            }
        `;
        document.head.appendChild(style);

        // 初始化组件
        const toastManager = new ToastManager();
        const fullScreenController = new FullScreenController(toastManager);

        const fullScreenButton = document.createElement('button');
        fullScreenButton.className = 'fullscreen-btn';
        fullScreenButton.innerText = '全屏';
        document.body.appendChild(fullScreenButton);

        const buttonManager = new ButtonManager(fullScreenButton, toastManager);

        // 全屏点击逻辑
        fullScreenButton.addEventListener('click', (e) => {
            if (buttonManager.wasJustDragged()) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            const videoContainer = document.querySelector('.video-container');
            if (!videoContainer) {
                toastManager.showToast('错误：未找到视频');
                return;
            }

            if (videoContainer._isPseudoFullScreen) {
                fullScreenController.exitPseudoFullScreen(videoContainer);
                toastManager.showToast('退出全屏');
                fullScreenButton.innerText = '全屏';
            } else {
                fullScreenController.enterPseudoFullScreen(videoContainer);
                toastManager.showToast('进入全屏 (按ESC退出)');
                fullScreenButton.innerText = '退出全屏';
            }
        });

        // 键盘控制
        const keyboardController = new KeyboardController(toastManager);
        const videoContainer = document.querySelector('.video-container');
        keyboardController.setup(videoContainer, fullScreenController, fullScreenButton);
    });
})();