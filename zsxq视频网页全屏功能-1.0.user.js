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

    // ================== 常量定义 ==================
    const STORAGE_KEY = 'zsxq_fullscreen_button_position';
    const MEMORY_ENABLED_KEY = 'zsxq_fullscreen_memory_enabled';
    const FIRST_TIME_NOTICE_KEY = 'zsxq_fullscreen_first_time_notice_shown';

    // 打印使用说明
    console.log(`
=== zsxq视频网页全屏功能使用说明 ===
版本: 1.1

【基本功能】
• 点击"全屏"按钮可进入/退出网页全屏模式
• 按ESC键可退出全屏模式
• 空格键可播放/暂停视频

【按钮操作】
• 左键拖拽：移动全屏按钮位置
• 右键点击：打开上下文菜单
• 双击：无特殊操作（避免误触）

【上下文菜单功能】
• 记忆位置：启用/禁用按钮位置记忆功能
  - 启用后：刷新页面会保持按钮位置
  - 禁用后：刷新页面按钮回到默认位置（右上角）

【键盘快捷键】
• 方向键左右：
  - 短按：快进/快退5秒
  - 长按（300ms以上）：3倍速播放
  - 松开：恢复正常速度

【重要提示】
• 按钮位置记忆功能默认处于关闭状态！
• 如需启用记忆功能，请右键点击按钮并选择"记忆位置"
• 该工具仅供学习使用
• 全屏模式下视频容器会覆盖整个视窗
• 拖拽按钮时点击不会触发全屏功能

如有问题，请检查控制台日志。
==================================`);

    // ================== 首次使用提示对话框 ==================
    function showFirstTimeNotice() {
        // 检查是否已经显示过
        try {
            const hasShown = localStorage.getItem(FIRST_TIME_NOTICE_KEY);
            if (hasShown === 'true') {
                return;
            }
        } catch (e) {
            console.warn('Failed to check first time notice status:', e);
        }

        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // 创建对话框
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        // 标题
        const title = document.createElement('h3');
        title.textContent = 'zsxq视频网页全屏功能使用指南';
        title.style.cssText = `
            margin-top: 0;
            color: #333;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        `;

        // 使用说明内容
        const content = document.createElement('div');
        content.innerHTML = `
            <p><strong>【基本功能】</strong></p>
            <ul>
                <li>点击"全屏"按钮可进入/退出网页全屏模式</li>
                <li>按ESC键可退出全屏模式</li>
                <li>空格键可播放/暂停视频</li>
            </ul>
            
            <p><strong>【按钮操作】</strong></p>
            <ul>
                <li>左键拖拽：移动全屏按钮位置</li>
                <li>右键点击：打开上下文菜单</li>
                <li>双击：无特殊操作（避免误触）</li>
            </ul>
            
            <p><strong>【上下文菜单功能】</strong></p>
            <ul>
                <li>记忆位置：启用/禁用按钮位置记忆功能
                    <ul style="margin-top: 8px; margin-bottom: 8px;">
                        <li>启用后：刷新页面会保持按钮位置</li>
                        <li>禁用后：刷新页面按钮回到默认位置（右上角）</li>
                    </ul>
                </li>
            </ul>
            
            <p><strong>【键盘快捷键】</strong></p>
            <ul>
                <li>方向键左右：
                    <ul style="margin-top: 8px; margin-bottom: 8px;">
                        <li>短按：快进/快退5秒</li>
                        <li>长按（300ms以上）：3倍速播放</li>
                        <li>松开：恢复正常速度</li>
                    </ul>
                </li>
            </ul>
            
            <p><strong>【重要提示】</strong></p>
            <ul>
                <li>按钮位置记忆功能默认处于关闭状态！</li>
                <li>如需启用记忆功能，请右键点击按钮并选择"记忆位置"</li>
                <li>该工具仅供学习使用</li>
            </ul>
        `;
        content.style.cssText = `
            font-size: 14px;
            line-height: 1.6;
            color: #555;
        `;

        // 关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '我知道了';
        closeButton.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 15px;
            float: right;
        `;

        closeButton.addEventListener('click', () => {
            // 记录已显示状态
            try {
                localStorage.setItem(FIRST_TIME_NOTICE_KEY, 'true');
            } catch (e) {
                console.warn('Failed to save first time notice status:', e);
            }
            overlay.remove();
        });

        // 组装对话框
        dialog.appendChild(title);
        dialog.appendChild(content);
        dialog.appendChild(closeButton);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 点击遮罩层外部也可以关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                try {
                    localStorage.setItem(FIRST_TIME_NOTICE_KEY, 'true');
                } catch (e) {
                    console.warn('Failed to save first time notice status:', e);
                }
                overlay.remove();
            }
        });
    }

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
            this.contextMenu = null;
            this.memoryEnabled = this.loadMemoryEnabledFromStorage();

            this.loadPositionFromStorage();
            this.initDrag();
            this.initResize();
            this.initContextMenu();
        }

        // 从localStorage加载记忆位置功能状态
        loadMemoryEnabledFromStorage() {
            try {
                const saved = localStorage.getItem(MEMORY_ENABLED_KEY);
                return saved === 'true';
            } catch (e) {
                console.warn('Failed to load memory enabled state:', e);
                return false;
            }
        }

        // 保存记忆位置功能状态到localStorage
        saveMemoryEnabledToStorage(enabled) {
            try {
                localStorage.setItem(MEMORY_ENABLED_KEY, String(enabled));
            } catch (e) {
                console.warn('Failed to save memory enabled state:', e);
            }
        }

        // 从localStorage加载按钮位置
        loadPositionFromStorage() {
            // 只有在记忆位置功能启用时才加载位置
            if (!this.memoryEnabled) {
                this.dragEndXRatio = null;
                this.dragEndYRatio = null;
                return;
            }

            try {
                const savedPosition = localStorage.getItem(STORAGE_KEY);
                if (savedPosition) {
                    const position = JSON.parse(savedPosition);
                    this.dragEndXRatio = position.xRatio;
                    this.dragEndYRatio = position.yRatio;
                    // 应用加载的位置
                    const newLeft = this.dragEndXRatio * window.innerWidth;
                    const newTop = this.dragEndYRatio * window.innerHeight;
                    const maxWidth = window.innerWidth - this.button.offsetWidth;
                    const maxHeight = window.innerHeight - this.button.offsetHeight;
                    const clampedLeft = Math.max(0, Math.min(newLeft, maxWidth));
                    const clampedTop = Math.max(0, Math.min(newTop, maxHeight));
                    this.updatePosition(clampedLeft, clampedTop);
                }
            } catch (e) {
                console.warn('Failed to load button position from localStorage:', e);
                this.dragEndXRatio = null;
                this.dragEndYRatio = null;
            }
        }

        // 保存按钮位置到localStorage
        savePositionToStorage(xRatio, yRatio) {
            // 只有在记忆位置功能启用时才保存位置
            if (!this.memoryEnabled) return;

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    xRatio: xRatio,
                    yRatio: yRatio
                }));
            } catch (e) {
                console.warn('Failed to save button position to localStorage:', e);
            }
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
                    // 保存位置到localStorage（仅当功能启用时）
                    this.savePositionToStorage(this.dragEndXRatio, this.dragEndYRatio);
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

        initContextMenu() {
            this.button.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            });

            // 点击其他地方关闭菜单
            document.addEventListener('click', () => {
                if (this.contextMenu) {
                    this.contextMenu.remove();
                    this.contextMenu = null;
                }
            });
        }

        showContextMenu(x, y) {
            // 如果已有菜单，先移除
            if (this.contextMenu) {
                this.contextMenu.remove();
            }

            // 创建上下文菜单
            const menu = document.createElement('div');
            menu.className = 'fullscreen-context-menu';
            menu.style.cssText = `
                position: fixed;
                top: ${y}px;
                left: ${x}px;
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                z-index: 10000;
                padding: 4px 0;
                min-width: 120px;
                font-size: 14px;
            `;

            // 记忆位置选项
            const memoryItem = document.createElement('div');
            memoryItem.className = 'context-menu-item';
            memoryItem.style.cssText = `
                padding: 6px 12px;
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
            `;

            // 添加复选标记
            const checkMark = document.createElement('span');
            checkMark.style.marginRight = '8px';
            checkMark.textContent = this.memoryEnabled ? '✓' : ' ';
            memoryItem.appendChild(checkMark);

            const textSpan = document.createElement('span');
            textSpan.textContent = '记忆位置';
            memoryItem.appendChild(textSpan);

            memoryItem.addEventListener('mouseenter', () => {
                memoryItem.style.backgroundColor = '#f5f5f5';
            });
            memoryItem.addEventListener('mouseleave', () => {
                memoryItem.style.backgroundColor = 'white';
            });
            memoryItem.addEventListener('click', (e) => {
                e.stopPropagation();
                // 切换记忆位置功能状态
                this.memoryEnabled = !this.memoryEnabled;
                this.saveMemoryEnabledToStorage(this.memoryEnabled);

                if (this.memoryEnabled) {
                    // 启用时，保存当前位置
                    const rect = this.button.getBoundingClientRect();
                    this.dragEndXRatio = rect.left / window.innerWidth;
                    this.dragEndYRatio = rect.top / window.innerHeight;
                    this.savePositionToStorage(this.dragEndXRatio, this.dragEndYRatio);
                    this.toastManager.showToast('已启用记忆位置');
                } else {
                    // 禁用时，重置位置
                    this.resetToDefaultPosition();
                    this.toastManager.showToast('已禁用记忆位置');
                }

                // 更新菜单中的复选标记
                checkMark.textContent = this.memoryEnabled ? '✓' : ' ';

                menu.remove();
                this.contextMenu = null;
            });

            menu.appendChild(memoryItem);
            document.body.appendChild(menu);
            this.contextMenu = menu;

            // 调整菜单位置避免超出视窗
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = (window.innerWidth - rect.width - 5) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = (window.innerHeight - rect.height - 5) + 'px';
            }
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
            // 不再自动清除localStorage中的位置数据，因为功能可能被重新启用
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                cursor: move;
                border-radius: 20px;
                font-size: 14px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 5px;
                user-select: none;
                white-space: nowrap;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .fullscreen-btn:hover {
                background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            }
            .fullscreen-btn:active {
                transform: translateY(0);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .fullscreen-btn::before {
                content: '⤢';
                font-size: 16px;
            }
            .fullscreen-context-menu {
                position: fixed;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                padding: 4px 0;
                min-width: 120px;
                font-size: 14px;
                animation: fadeIn 0.2s ease;
            }
            .context-menu-item {
                padding: 8px 16px;
                cursor: pointer;
                user-select: none;
                transition: background 0.2s;
            }
            .context-menu-item:hover {
                background: #f0f0f0;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
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

        // 显示首次使用提示
        showFirstTimeNotice();

        // 键盘控制
        const keyboardController = new KeyboardController(toastManager);
        const videoContainer = document.querySelector('.video-container');
        keyboardController.setup(videoContainer, fullScreenController, fullScreenButton);
    });
})();