// ==UserScript==
// @name         zsxq视频网页全屏功能 1.9.5，如有问题请提issue
// @namespace    http://tampermonkey.net/
// @version      1.9.5
// @description  在知识星球网页版中为视频播放器添加全屏按钮（悬浮按钮 + 播放控件条按钮），用于知识星球网页全屏，项目仅供学习使用，请勿非法使用，如有侵权请联系作者进行删除。
// @author       hhhfish
// @match        https://wx.zsxq.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ================== 常量定义 ==================
    const FIRST_TIME_NOTICE_KEY = 'zsxq_first_time_notice_shown';
    const STORAGE_KEY = 'zsxq_fullscreen_button_position';
    const MEMORY_ENABLED_KEY = 'zsxq_fullscreen_memory_enabled';
    const VIDEO_PROGRESS_MEMORY_ENABLED_KEY = 'zsxq_video_progress_memory_enabled';
    const LOG_ENABLED_KEY = 'zsxqLogEnabled';

    // 日志控制 - 从localStorage读取初始状态（默认关闭）
    let isZsxqLogEnabled = localStorage.getItem(LOG_ENABLED_KEY) === 'true';

    function toggleZsxqLog(enable) {
        isZsxqLogEnabled = Boolean(enable);
        localStorage.setItem(LOG_ENABLED_KEY, isZsxqLogEnabled.toString());
        console.log(`[zsxq] 日志输出已${isZsxqLogEnabled ? '开启' : '关闭'}`);
    }

    // 暴露toggleZsxqLog到全局作用域
    window.toggleZsxqLog = toggleZsxqLog;

    function zsxqLog(...args) {
        if (isZsxqLogEnabled) {
            console.log('[zsxq]', ...args);
        }
    }

    // 打印使用说明
    console.log(`
=== zsxq视频网页全屏功能使用说明 ===
版本: 1.9.5

【基本功能】
• 点击"全屏"按钮可进入/退出网页全屏模式
• 播控条右侧新增「网页全屏」按钮（浏览器窗口图标），与悬浮按钮功能一致
• 播控条支持「下一节」快捷跳转
• 倍速菜单额外提供 3.0X
• 视频上悬停滚轮可调节音量
• 按ESC键可退出全屏模式
• 空格键可播放/暂停视频

【按钮操作】
• 初始位置：屏幕右上角
• 左键拖拽：移动全屏按钮位置
• 右键点击：打开上下文菜单
• 双击：无特殊操作（避免误触）

【上下文菜单功能】
• 记忆位置：启用/禁用按钮位置记忆功能
  - 启用后：刷新页面会保持按钮位置
  - 禁用后：刷新页面按钮回到默认位置（右上角）
• 记忆视频进度：启用/禁用视频播放进度记忆功能
  - 启用后：自动保存并恢复视频播放进度
  - 禁用后：不保存视频播放进度
• 日志输出：启用/禁用详细日志输出

【键盘快捷键】
• 方向键左右：
  - 短按：快进/快退5秒
  - 长按（300ms以上）：3倍速播放
  - 松开：恢复正常速度
• 方向键上下：
  - 调整音量（每次±10%）

【重要提示】
• 按钮位置记忆功能默认处于关闭状态！
• 视频进度记忆功能默认处于关闭状态！
• 如需启用记忆功能，请右键点击按钮并选择相应选项
• 该工具仅供学习使用
• 全屏模式下视频容器会覆盖整个视窗
• 拖拽按钮时点击不会触发全屏功能

【日志控制】
• 在控制台输入 toggleZsxqLog(1) 启用详细日志
• 在控制台输入 toggleZsxqLog(0) 禁用详细日志
• 或通过右键菜单直接控制

【致谢】
• 脚本作者：hhhfish
• 不愿透漏姓名的小伙伴提供修改建议
==================================`);

    // ================== 首次使用提示对话框 ==================
    function saveFirstTimeNoticeStatus() {
        try {
            localStorage.setItem(FIRST_TIME_NOTICE_KEY, 'true');
        } catch (e) {
            console.warn('Failed to save first time notice status:', e);
        }
    }

    function hasShownFirstTimeNotice() {
        try {
            return localStorage.getItem(FIRST_TIME_NOTICE_KEY) === 'true';
        } catch (e) {
            console.warn('Failed to check first time notice status:', e);
            return false;
        }
    }

    function showFirstTimeNotice() {
        // 检查是否已经显示过
        if (hasShownFirstTimeNotice()) {
            return;
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
                <li>播控条右侧「网页全屏」按钮（浏览器窗口图标），与悬浮按钮一致</li>
                <li>播控条支持「下一节」快捷跳转</li>
                <li>倍速菜单额外提供 3.0X</li>
                <li>视频上悬停滚轮可调节音量</li>
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
                <li>记忆视频进度：启用/禁用视频播放进度记忆功能
                    <ul style="margin-top: 8px; margin-bottom: 8px;">
                        <li>启用后：自动保存并恢复视频播放进度</li>
                        <li>禁用后：不保存视频播放进度</li>
                    </ul>
                </li>
                <li>日志输出：启用/禁用详细日志输出</li>
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
                <li>方向键上下：
                    <ul style="margin-top: 8px; margin-bottom: 8px;">
                        <li>调整音量（每次±10%）</li>
                    </ul>
                </li>
            </ul>
            
            <p><strong>【重要提示】</strong></p>
            <ul>
                <li>按钮位置记忆功能默认处于关闭状态！</li>
                <li>视频进度记忆功能默认处于关闭状态！</li>
                <li>如需启用记忆功能，请右键点击按钮并选择相应选项</li>
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
            saveFirstTimeNoticeStatus();
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
                saveFirstTimeNoticeStatus();
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
    // 注意：隐藏动画还有一段 300ms 清理定时器。旧实现只跟踪外层 timer，
    // 淡出窗口内若再来一次 showToast，过期清理会把 currentToast 置空并
    // 误清掉新 toast 的隐藏 timer，导致节点永久卡在页面上。
    class ToastManager {
        constructor() {
            this.toast = null;
            this.hideTimer = null;
            this.removeTimer = null;
            this.generation = 0;
        }

        showToast(message, duration = 2000) {
            this.generation += 1;
            const gen = this.generation;
            this.clearTimers();

            // 复用现有节点（滚轮连打只更新文案），避免频繁建删
            if (this.toast && this.toast.isConnected) {
                this.toast.textContent = message;
                this.toast.classList.add('show');
            } else {
                this.destroyToast();
                const toast = document.createElement('div');
                toast.className = 'video-toast';
                toast.textContent = message;
                document.body.appendChild(toast);
                this.toast = toast;
                // 强制回流后再加 show，保证 opacity 0 -> 1 过渡生效
                void toast.offsetHeight;
                toast.classList.add('show');
            }

            this.hideTimer = setTimeout(() => {
                if (gen !== this.generation || !this.toast) return;
                this.toast.classList.remove('show');
                this.removeTimer = setTimeout(() => {
                    if (gen !== this.generation) return;
                    this.destroyToast();
                }, 300);
            }, duration);
        }

        clearTimers() {
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
            if (this.removeTimer) {
                clearTimeout(this.removeTimer);
                this.removeTimer = null;
            }
        }

        destroyToast() {
            if (this.toast) {
                this.toast.remove();
                this.toast = null;
            }
            // 兜底：清掉历史竞态可能泄漏的 .video-toast
            document.querySelectorAll('.video-toast').forEach((el) => el.remove());
        }
    }

    // ================== 页面可见性 / 控制条恢复 ==================
    // 只做安全恢复：重新挂载脚本按钮、唤醒站点控制条。
    // 不 pause/play，不对 video-container 做 display:none 重绘（会和伪全屏打架）。
    class VisibilityFixController {
        constructor({ onRemount }) {
            this.onRemount = onRemount;
            this.wakeTimer = null;
            this._destroyed = false;
        }

        setup() {
            document.addEventListener('visibilitychange', () => {
                if (this._destroyed) return;
                if (document.visibilityState !== 'visible') return;
                zsxqLog('[zsxq] 页面重新可见，尝试恢复播放器 UI');
                clearTimeout(this.wakeTimer);
                // 等 Angular 把 DOM 吐完再恢复
                this.wakeTimer = setTimeout(() => this.recover(), 250);
            });

            window.addEventListener('pageshow', (e) => {
                if (this._destroyed) return;
                // bfcache 返回时同样恢复
                if (e.persisted) {
                    clearTimeout(this.wakeTimer);
                    this.wakeTimer = setTimeout(() => this.recover(), 250);
                }
            });
        }

        recover() {
            if (this._destroyed) return;
            try {
                // 1) 先把脚本按钮重新塞回当前 DOM
                if (typeof this.onRemount === 'function') {
                    this.onRemount();
                }

                const videoContainer = document.querySelector('.video-container');
                if (!videoContainer) return;

                // 2) 控制条节点还在，但可能被站点样式藏住（display:none / opacity:0）
                const controls = videoContainer.querySelector('.video-controls');
                if (controls) {
                    this.wakeHiddenControls(videoContainer, controls);
                    return;
                }

                // 3) 控制条节点整段被框架卸掉：轻量触发一次 resize，交给站点/框架重排
                //    （不重放视频、不拆容器，避免副作用）
                zsxqLog('[zsxq] 未找到 .video-controls，触发 resize 轻量恢复');
                window.dispatchEvent(new Event('resize'));
            } catch (err) {
                zsxqLog('[zsxq] 可见性恢复出错:', err);
            }
        }

        wakeHiddenControls(videoContainer, controls) {
            const isHidden = () => {
                const cs = window.getComputedStyle(controls);
                return cs.display === 'none' || cs.opacity === '0' || cs.visibility === 'hidden';
            };

            if (!isHidden()) {
                controls.classList.remove('zsxq-controls-restored');
                return;
            }

            zsxqLog('[zsxq] 控制条处于隐藏态，尝试唤醒');

            // 先模拟指针移动，让站点自己的「悬停显示」逻辑跑起来
            const fire = (target, type) => {
                try {
                    target.dispatchEvent(new MouseEvent(type, {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        clientX: window.innerWidth / 2,
                        clientY: Math.max(80, window.innerHeight - 80)
                    }));
                } catch (_) { /* ignore */ }
            };

            const hit = videoContainer.querySelector('.processing') || videoContainer;
            fire(hit, 'mouseenter');
            fire(hit, 'mousemove');
            fire(videoContainer, 'mousemove');

            // 若事件没能唤醒，做一次不带 !important 的临时显示；
            // 站点后续内联样式仍可覆盖，指针离开后交给站点继续管理
            requestAnimationFrame(() => {
                if (this._destroyed || !controls.isConnected) return;
                if (!isHidden()) return;

                controls.classList.add('zsxq-controls-restored');
                const clearRestore = () => {
                    controls.classList.remove('zsxq-controls-restored');
                    videoContainer.removeEventListener('mouseleave', clearRestore);
                };
                videoContainer.addEventListener('mouseleave', clearRestore);
                zsxqLog('[zsxq] 已临时恢复控制条可见性');
            });
        }

        destroy() {
            this._destroyed = true;
            clearTimeout(this.wakeTimer);
        }
    }

    // ================== 全屏控制模块 ==================
    class FullScreenController {
        constructor(toastManager) {
            this.toastManager = toastManager;
            this.originalBodyOverflow = document.body.style.overflow;
            this.videoProgressKeyPrefix = 'zsxq_video_progress_';
        }

        // 获取当前页面URL作为视频ID
        getVideoId() {
            return window.location.href.split('?')[0]; // 移除查询参数
        }

        // 保存视频进度
        saveVideoProgress(currentTime, duration) {
            if (duration <= 0) return;

            const videoId = this.getVideoId();
            const progressKey = this.videoProgressKeyPrefix + videoId;

            try {
                localStorage.setItem(progressKey, JSON.stringify({
                    currentTime: currentTime,
                    duration: duration,
                    savedAt: Date.now()
                }));
            } catch (e) {
                console.warn('Failed to save video progress:', e);
            }
        }

        // 恢复视频进度
        restoreVideoProgress(videoElement) {
            const videoId = this.getVideoId();
            const progressKey = this.videoProgressKeyPrefix + videoId;

            try {
                const savedProgress = localStorage.getItem(progressKey);
                if (savedProgress) {
                    const progress = JSON.parse(savedProgress);
                    // 只有当视频时长匹配且进度有效时才恢复
                    if (progress.duration > 0 &&
                        Math.abs(progress.duration - videoElement.duration) < 5 && // 允许5秒误差
                        progress.currentTime > 0 &&
                        progress.currentTime < progress.duration) {
                        videoElement.currentTime = progress.currentTime;
                        return true;
                    }
                }
            } catch (e) {
                console.warn('Failed to restore video progress:', e);
            }
            return false;
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
            this.videoProgressMemoryEnabled = this.loadVideoProgressMemoryEnabledFromStorage();

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

        // 从localStorage加载视频进度记忆功能状态
        loadVideoProgressMemoryEnabledFromStorage() {
            try {
                const saved = localStorage.getItem(VIDEO_PROGRESS_MEMORY_ENABLED_KEY);
                return saved === 'true';
            } catch (e) {
                console.warn('Failed to load video progress memory enabled state:', e);
                return false; // 默认禁用
            }
        }

        // 保存视频进度记忆功能状态到localStorage
        saveVideoProgressMemoryEnabledToStorage(enabled) {
            try {
                localStorage.setItem(VIDEO_PROGRESS_MEMORY_ENABLED_KEY, String(enabled));
            } catch (e) {
                console.warn('Failed to save video progress memory enabled state:', e);
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
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05);
                z-index: 10000;
                padding: 8px 0;
                min-width: 160px;
                font-size: 14px;
                overflow: hidden;
            `;

            // 记忆位置选项
            const memoryItem = document.createElement('div');
            memoryItem.className = 'context-menu-item';
            memoryItem.style.cssText = `
                padding: 10px 16px;
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
                transition: all 0.2s ease;
            `;

            // 添加复选标记 - 使用更明显的视觉效果
            const memoryCheckMark = document.createElement('div');
            memoryCheckMark.style.cssText = `
                width: 18px;
                height: 18px;
                border: 2px solid #d1d1d6;
                border-radius: 4px;
                margin-right: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            `;

            if (this.memoryEnabled) {
                memoryCheckMark.style.backgroundColor = '#0a84ff';
                memoryCheckMark.style.borderColor = '#0a84ff';
                memoryCheckMark.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l1-1 1.5 1.5L8 3l1 1-4.5 4.5z"/></svg>';
            }

            const memoryTextSpan = document.createElement('span');
            memoryTextSpan.textContent = '记忆位置';

            memoryItem.appendChild(memoryCheckMark);
            memoryItem.appendChild(memoryTextSpan);

            memoryItem.addEventListener('mouseenter', () => {
                memoryItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            });
            memoryItem.addEventListener('mouseleave', () => {
                memoryItem.style.backgroundColor = 'transparent';
            });
            memoryItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this.memoryEnabled = !this.memoryEnabled;
                this.saveMemoryEnabledToStorage(this.memoryEnabled);

                if (this.memoryEnabled) {
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

                // 更新复选标记
                if (this.memoryEnabled) {
                    memoryCheckMark.style.backgroundColor = '#0a84ff';
                    memoryCheckMark.style.borderColor = '#0a84ff';
                    memoryCheckMark.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l1-1 1.5 1.5L8 3l1 1-4.5 4.5z"/></svg>';
                } else {
                    memoryCheckMark.style.backgroundColor = 'transparent';
                    memoryCheckMark.style.borderColor = '#d1d1d6';
                    memoryCheckMark.innerHTML = '';
                }

                menu.remove();
                this.contextMenu = null;
            });

            // 日志输出选项
            const logItem = document.createElement('div');
            logItem.className = 'context-menu-item';
            logItem.style.cssText = `
                padding: 10px 16px;
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
                transition: all 0.2s ease;
                border-top: 1px solid rgba(0, 0, 0, 0.05);
            `;

            const logCheckMark = document.createElement('div');
            logCheckMark.style.cssText = `
                width: 18px;
                height: 18px;
                border: 2px solid #d1d1d6;
                border-radius: 4px;
                margin-right: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            `;

            if (isZsxqLogEnabled) {
                logCheckMark.style.backgroundColor = '#0a84ff';
                logCheckMark.style.borderColor = '#0a84ff';
                logCheckMark.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l1-1 1.5 1.5L8 3l1 1-4.5 4.5z"/></svg>';
            }

            const logTextSpan = document.createElement('span');
            logTextSpan.textContent = '日志输出';

            logItem.appendChild(logCheckMark);
            logItem.appendChild(logTextSpan);

            logItem.addEventListener('mouseenter', () => {
                logItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            });
            logItem.addEventListener('mouseleave', () => {
                logItem.style.backgroundColor = 'transparent';
            });
            logItem.addEventListener('click', (e) => {
                e.stopPropagation();
                const newLogState = !isZsxqLogEnabled;
                toggleZsxqLog(newLogState);

                if (newLogState) {
                    this.toastManager.showToast('已启用日志输出');
                } else {
                    this.toastManager.showToast('已禁用日志输出');
                }

                // 更新复选标记
                if (newLogState) {
                    logCheckMark.style.backgroundColor = '#0a84ff';
                    logCheckMark.style.borderColor = '#0a84ff';
                    logCheckMark.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l1-1 1.5 1.5L8 3l1 1-4.5 4.5z"/></svg>';
                } else {
                    logCheckMark.style.backgroundColor = 'transparent';
                    logCheckMark.style.borderColor = '#d1d1d6';
                    logCheckMark.innerHTML = '';
                }

                menu.remove();
                this.contextMenu = null;
            });

            // 视频进度记忆选项
            const videoProgressItem = document.createElement('div');
            videoProgressItem.className = 'context-menu-item';
            videoProgressItem.style.cssText = `
                padding: 10px 16px;
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
                transition: all 0.2s ease;
                border-top: 1px solid rgba(0, 0, 0, 0.05);
            `;

            const videoProgressCheckMark = document.createElement('div');
            videoProgressCheckMark.style.cssText = `
                width: 18px;
                height: 18px;
                border: 2px solid #d1d1d6;
                border-radius: 4px;
                margin-right: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            `;

            if (this.videoProgressMemoryEnabled) {
                videoProgressCheckMark.style.backgroundColor = '#0a84ff';
                videoProgressCheckMark.style.borderColor = '#0a84ff';
                videoProgressCheckMark.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l1-1 1.5 1.5L8 3l1 1-4.5 4.5z"/></svg>';
            }

            const videoProgressTextSpan = document.createElement('span');
            videoProgressTextSpan.textContent = '记忆视频进度';

            videoProgressItem.appendChild(videoProgressCheckMark);
            videoProgressItem.appendChild(videoProgressTextSpan);

            videoProgressItem.addEventListener('mouseenter', () => {
                videoProgressItem.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            });
            videoProgressItem.addEventListener('mouseleave', () => {
                videoProgressItem.style.backgroundColor = 'transparent';
            });
            videoProgressItem.addEventListener('click', (e) => {
                e.stopPropagation();
                this.videoProgressMemoryEnabled = !this.videoProgressMemoryEnabled;
                this.saveVideoProgressMemoryEnabledToStorage(this.videoProgressMemoryEnabled);

                if (this.videoProgressMemoryEnabled) {
                    this.toastManager.showToast('已启用记忆视频进度');
                } else {
                    this.toastManager.showToast('已禁用记忆视频进度');
                }

                // 更新复选标记
                if (this.videoProgressMemoryEnabled) {
                    videoProgressCheckMark.style.backgroundColor = '#0a84ff';
                    videoProgressCheckMark.style.borderColor = '#0a84ff';
                    videoProgressCheckMark.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="white"><path d="M4.5 8.5L2 6l1-1 1.5 1.5L8 3l1 1-4.5 4.5z"/></svg>';
                } else {
                    videoProgressCheckMark.style.backgroundColor = 'transparent';
                    videoProgressCheckMark.style.borderColor = '#d1d1d6';
                    videoProgressCheckMark.innerHTML = '';
                }

                menu.remove();
                this.contextMenu = null;
            });

            menu.appendChild(memoryItem);
            menu.appendChild(logItem);
            menu.appendChild(videoProgressItem);
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
        }

        wasJustDragged() {
            return this.isDragging;
        }
    }

    // ================== 键盘控制模块 ==================
    class KeyboardController {
        constructor(toastManager) {
            this.toastManager = toastManager;
            this.LONG_PRESS_THRESHOLD = 300;
            this.isSetup = false;
            this.keyTimers = new Map(); // 存储每个按键的定时器
            this.activeSpeedKeys = new Set(); // 存储当前处于3倍速状态的按键
        }

        setup(fullScreenController, applyFullScreenState) {
            if (this.isSetup) return;
            this.isSetup = true;

            const handleKeyDown = (event) => {
                const videoContainer = document.querySelector('.video-container');
                const videoElement = videoContainer?.querySelector('video');
                if (!videoElement) return;

                zsxqLog(`[zsxq] 按键按下: ${event.key}`);

                if (event.key === 'Escape') {
                    if (videoContainer._isPseudoFullScreen) {
                        fullScreenController.exitPseudoFullScreen(videoContainer);
                        this.toastManager.showToast('退出全屏');
                        applyFullScreenState(false);
                        zsxqLog('[zsxq] ESC键触发 - 退出全屏');
                    }
                } else if (event.key === ' ') {
                    event.preventDefault();
                    // 走 togglePlayback：点站点播放/暂停钮，控件显隐交给站点
                    togglePlayback(videoElement);
                    zsxqLog('[zsxq] 空格键触发 - 切换播放');
                } else if (['ArrowRight', 'ArrowLeft'].includes(event.key)) {
                    event.preventDefault();

                    // 如果已经存在该键的定时器，清除它（防止重复触发）
                    if (this.keyTimers.has(event.key)) {
                        clearTimeout(this.keyTimers.get(event.key));
                    }

                    // 设置长按检测定时器
                    const timer = setTimeout(() => {
                        // 长按触发：设置3倍速
                        if (!this.activeSpeedKeys.has(event.key)) {
                            videoElement._originalPlaybackRate = videoElement.playbackRate;
                            videoElement.playbackRate = 3.0;
                            this.activeSpeedKeys.add(event.key);
                            this.toastManager.showToast('3倍速播放中');
                            zsxqLog(`[zsxq] ${event.key} 长按触发 - 3倍速播放`);
                        }
                    }, this.LONG_PRESS_THRESHOLD);

                    this.keyTimers.set(event.key, timer);
                } else if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
                    event.preventDefault();

                    // 音量控制：上键增加音量，下键减少音量
                    const currentVolume = videoElement.volume;
                    const volumeStep = 0.1; // 每次调整0.1的音量
                    let newVolume;

                    if (event.key === 'ArrowUp') {
                        newVolume = Math.min(1.0, currentVolume + volumeStep);
                    } else {
                        newVolume = Math.max(0.0, currentVolume - volumeStep);
                    }
                    videoElement.volume = newVolume;
                    syncVolumeUI(videoElement);
                    this.toastManager.showToast(`音量: ${(newVolume * 100).toFixed(0)}%`);
                    zsxqLog(`[zsxq] ${event.key} 音量 -> ${(newVolume * 100).toFixed(0)}%`);
                } else {
                    zsxqLog(`[zsxq] 未处理的按键: ${event.key}`);
                }
            };

            const handleKeyUp = (event) => {
                if (['ArrowRight', 'ArrowLeft'].includes(event.key)) {
                    const videoContainer = document.querySelector('.video-container');
                    const videoElement = videoContainer?.querySelector('video');
                    if (!videoElement) return;

                    // 清除定时器
                    if (this.keyTimers.has(event.key)) {
                        clearTimeout(this.keyTimers.get(event.key));
                        this.keyTimers.delete(event.key);
                    }

                    // 如果处于3倍速状态，恢复原速
                    if (this.activeSpeedKeys.has(event.key)) {
                        videoElement.playbackRate = videoElement._originalPlaybackRate || 1.0;
                        delete videoElement._originalPlaybackRate;
                        this.activeSpeedKeys.delete(event.key);
                        this.toastManager.showToast('恢复正常速度');
                        zsxqLog(`[zsxq] ${event.key} 松开 - 恢复正常速度`);
                    } else {
                        // 是短按，执行快进/快退
                        const direction = event.key === 'ArrowRight' ? 1 : -1;
                        videoElement.currentTime += direction * 5;
                        this.toastManager.showToast(direction > 0 ? '快进 5 秒' : '快退 5 秒');
                        zsxqLog(`[zsxq] ${event.key} 短按触发 - ${direction > 0 ? '快进' : '快退'} 5秒`);
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);

            // 处理窗口失去焦点的情况
            window.addEventListener('blur', () => {
                // 清除所有定时器和重置播放速度
                for (const [key, timer] of this.keyTimers) {
                    clearTimeout(timer);
                }
                this.keyTimers.clear();

                const videoContainer = document.querySelector('.video-container');
                const videoElement = videoContainer?.querySelector('video');
                if (videoElement && this.activeSpeedKeys.size > 0) {
                    videoElement.playbackRate = videoElement._originalPlaybackRate || 1.0;
                    delete videoElement._originalPlaybackRate;
                    this.activeSpeedKeys.clear();
                }
            });
        }
    }

    // ================== 主逻辑 ==================
    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .video-toast {
            position: fixed;
            top: 10%;
            left: 50%;
            transform: translate(-50%, 0);
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            color: white;
            padding: 10px 20px;
            border-radius: 12px;
            z-index: 10000;
            pointer-events: none;
            transition: opacity 0.3s;
            opacity: 0;
            font-size: 14px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .video-toast.show {
            opacity: 1;
        }
        .video-controls.zsxq-controls-restored {
            display: flex !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        }
        .zsxq-flash-icon {
            display: none !important;
        }
        .zsxq-center-play {
            display: none !important;
        }
        .fullscreen-btn {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            color: #6495ed;
            border: 1px solid rgba(255, 255, 255, 0.3);
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
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            font-weight: 500;
        }
        .fullscreen-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(0,0,0,0.15);
        }
        .fullscreen-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .fullscreen-btn::before {
            content: '⤢';
            font-size: 16px;
        }
        .zsxq-player-fs-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            margin: 0 4px;
            padding: 0;
            border: none;
            background: transparent;
            color: #fff;
            cursor: pointer;
            opacity: 0.9;
            vertical-align: middle;
            flex-shrink: 0;
        }
        .zsxq-player-fs-btn:hover {
            opacity: 1;
        }
        .zsxq-player-fs-btn svg {
            width: 18px;
            height: 18px;
            display: block;
            pointer-events: none;
        }
        .zsxq-next-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            margin: 0 4px;
            padding: 0;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: #fff;
            cursor: pointer;
            opacity: 0.9;
            flex-shrink: 0;
        }
        .zsxq-next-btn:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.15);
        }
        .zsxq-next-btn svg {
            width: 18px;
            height: 18px;
            display: block;
            pointer-events: none;
        }
        .zsxq-rate-3x {
            cursor: pointer;
        }
        .fullscreen-context-menu {
            position: fixed;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05);
            z-index: 10000;
            padding: 8px 0;
            min-width: 160px;
            font-size: 14px;
            animation: fadeIn 0.2s ease;
            overflow: hidden;
        }
        .context-menu-item {
            padding: 10px 16px;
            cursor: pointer;
            user-select: none;
            transition: background 0.2s;
        }
        .context-menu-item:hover {
            background: rgba(0, 0, 0, 0.05);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // ================== 播控条扩展按钮 ==================
    // 浏览器窗口造型，避免和原生「四角全屏」图标混淆
    const PLAYER_FS_ICON = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="14" rx="1.5"></rect>
            <path d="M3.5 8.5h17" stroke-linecap="round"></path>
        </svg>
    `;
    const PLAYER_FS_EXIT_ICON = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="14" rx="1.5"></rect>
            <path d="M3.5 8.5h17M8 12.5h8M8 15h5" stroke-linecap="round"></path>
        </svg>
    `;
    const PLAYER_FS_TOOLTIP_ENTER = '网页全屏脚本添加：网页全屏';
    const PLAYER_FS_TOOLTIP_EXIT = '网页全屏脚本添加：退出网页全屏';
    const VOLUME_WHEEL_STEP = 0.05;

    function createPlayerControlsButton() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'zsxq-player-fs-btn';
        btn.title = PLAYER_FS_TOOLTIP_ENTER;
        btn.setAttribute('aria-label', PLAYER_FS_TOOLTIP_ENTER);
        btn.innerHTML = PLAYER_FS_ICON;
        return btn;
    }

    function injectPlayerControlsButton(playerFsButton) {
        const videoControls = document.querySelector('.video-container .video-controls');
        if (!videoControls) return false;

        const existing = videoControls.querySelector('.zsxq-player-fs-btn');
        if (existing) {
            if (existing !== playerFsButton) existing.remove();
            else return true;
        }

        // 插在原生 #fullscreen 之前；没有则追加到控件条末尾
        const nativeFs = videoControls.querySelector('#fullscreen');
        if (nativeFs) {
            videoControls.insertBefore(playerFsButton, nativeFs);
        } else {
            videoControls.appendChild(playerFsButton);
        }
        return true;
    }

    function updateFullscreenUI(floatingButton, playerButton, isFullScreen) {
        const tip = isFullScreen ? PLAYER_FS_TOOLTIP_EXIT : PLAYER_FS_TOOLTIP_ENTER;
        if (floatingButton) {
            floatingButton.innerText = isFullScreen ? '退出全屏' : '全屏';
            floatingButton.title = tip;
        }
        if (playerButton) {
            playerButton.innerHTML = isFullScreen ? PLAYER_FS_EXIT_ICON : PLAYER_FS_ICON;
            playerButton.title = tip;
            playerButton.setAttribute('aria-label', tip);
        }
    }

    // 从正文里解析「上一节 / 下一节」链接
    function findSectionNavLinks() {
        const result = { prev: null, next: null };
        const anchors = document.querySelectorAll('a[href]');
        for (const a of anchors) {
            let before = '';
            let node = a.previousSibling;
            let hops = 0;
            while (node && hops < 12) {
                const text = node.textContent || '';
                before = text + before;
                if (before.includes('下一节') && !result.next) result.next = a;
                if (before.includes('上一节') && !result.prev) result.prev = a;
                if (result.next && result.prev) return result;
                node = node.previousSibling;
                hops += 1;
            }

            // 兜底：父级文本紧邻标签
            const parent = a.parentElement;
            if (parent) {
                const pText = parent.textContent || '';
                const linkText = a.textContent || '';
                const idx = pText.indexOf(linkText);
                if (idx > 0) {
                    const lead = pText.slice(Math.max(0, idx - 8), idx);
                    if (lead.includes('下一节') && !result.next) result.next = a;
                    if (lead.includes('上一节') && !result.prev) result.prev = a;
                }
            }
        }
        return result;
    }

    // 播控条「下一节」：跳过/下一曲图标
    const NEXT_SECTION_ICON = `
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 6v12l8.5-6L6 6zm10 0h2v12h-2V6z"></path>
        </svg>
    `;

    function createNextSectionButton(toastManager) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'zsxq-next-btn';
        btn.innerHTML = NEXT_SECTION_ICON;
        btn.style.display = 'none';
        btn.title = '下一节';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const links = findSectionNavLinks();
            if (!links.next) {
                toastManager.showToast('未找到下一节链接');
                return;
            }
            const href = links.next.href || links.next.getAttribute('href');
            if (!href) {
                toastManager.showToast('未找到下一节链接');
                return;
            }
            toastManager.showToast('前往下一节');
            window.location.href = href;
        });

        return btn;
    }

    function syncNextSectionButton(nextButton) {
        const links = findSectionNavLinks();
        if (links.next) {
            const title = (links.next.textContent || '下一节').trim();
            nextButton.style.display = '';
            nextButton.title = `下一节：${title}`;
            nextButton.setAttribute('aria-label', `下一节：${title}`);
        } else {
            nextButton.style.display = 'none';
        }
    }

    function injectNextSectionButton(nextButton) {
        const videoControls = document.querySelector('.video-container .video-controls');
        if (!videoControls) return false;

        const existing = videoControls.querySelector('.zsxq-next-btn');
        if (existing && existing !== nextButton) existing.remove();

        // 放在播放控件旁：#pause（播放钮）或 #play（暂停钮）紧后面
        const pauseCtrl = videoControls.querySelector('#pause') || videoControls.querySelector('#play');
        if (pauseCtrl) {
            if (pauseCtrl.nextSibling !== nextButton) {
                videoControls.insertBefore(nextButton, pauseCtrl.nextSibling);
            }
        } else if (videoControls.firstElementChild !== nextButton) {
            videoControls.insertBefore(nextButton, videoControls.firstChild);
        }
        syncNextSectionButton(nextButton);
        return true;
    }

    // 向倍速菜单追加 3.0X（站点本身最大 2.0X）
    // 注意：站点是 Angular 局部样式，新节点要克隆已有 .rate 才能带上 _ngcontent 作用域
    function hideRatePopup(rateSelect) {
        const playRate = rateSelect.closest('.play-rate');
        if (!playRate) return;
        // 结构：.play-rate > span.倍速 + div[hidden]（含 .rate-select / .triangle）
        const popup = playRate.querySelector(':scope > div');
        if (popup) {
            popup.hidden = true;
            popup.style.display = 'none';
            popup.style.opacity = '0';
        }
    }

    function ensureTripleSpeedOption() {
        const rateSelect = document.querySelector('.video-container .play-rate .rate-select');
        if (!rateSelect) return false;

        let item = rateSelect.querySelector('.rate.zsxq-rate-3x');
        if (!item) {
            const sample = rateSelect.querySelector('.rate:not(.selected)')
                || rateSelect.querySelector('.rate');
            if (!sample) return false;

            // 从原生选项克隆，保留 Angular _ngcontent-* 等样式作用域属性
            item = sample.cloneNode(false);
            item.className = 'rate ng-star-inserted zsxq-rate-3x';
            item.classList.remove('selected');
            item.textContent = ' 3.0X ';
            item.removeAttribute('id');
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const video = document.querySelector('.video-container video');
                if (!video) return;
                video.playbackRate = 3.0;
                rateSelect.querySelectorAll('.rate').forEach((r) => r.classList.remove('selected'));
                item.classList.add('selected');
                hideRatePopup(rateSelect);
                zsxqLog('[zsxq] 倍速切换 - 3.0X');
            });
            rateSelect.appendChild(item);
        }

        // 站点切换其它倍速时，取消 3.0X 的选中态
        rateSelect.querySelectorAll('.rate:not(.zsxq-rate-3x)').forEach((r) => {
            if (r._zsxqRateBound) return;
            r._zsxqRateBound = true;
            r.addEventListener('click', () => {
                item.classList.remove('selected');
            });
        });
        return true;
    }

    // ================== 播放器原生控件 UI 同步 ==================
    // 站点控件（#play / #play-btn / #sound / .soundBar）只在自己的点击回调里更新。
    // 我们用空格/滚轮直接改 video 时，需要手动把 UI 拧回去。
    function copyNgScopeAttributes(fromEl, toEl) {
        if (!fromEl || !toEl) return;
        for (const attr of [...fromEl.attributes]) {
            if (attr.name.startsWith('_ngcontent') || attr.name.startsWith('_nghost')) {
                toEl.setAttribute(attr.name, attr.value);
            }
        }
    }

    function getVideoContainer() {
        return document.querySelector('.video-container');
    }

    function syncVolumeUI(video) {
        const container = getVideoContainer();
        if (!container || !video) return;

        const pct = Math.round((video.muted ? 0 : video.volume) * 100);
        const soundBar = container.querySelector('#sound-progress .soundBar, .soundBar');
        if (soundBar) {
            soundBar.style.width = pct + '%';
        }

        // 调节时短暂露出音量条，对齐悬停音量控件的体验
        const soundProgress = container.querySelector('#sound-progress');
        if (soundProgress) {
            soundProgress.hidden = false;
            clearTimeout(soundProgress._zsxqHideTimer);
            soundProgress._zsxqHideTimer = setTimeout(() => {
                soundProgress.hidden = true;
            }, 1200);
        }

        const soundIcon = container.querySelector('#sound');
        if (soundIcon) {
            const muted = Boolean(video.muted || video.volume === 0);
            soundIcon.classList.toggle('muted', muted);
            soundIcon.classList.toggle('mute', muted);
            soundIcon.setAttribute('data-muted', muted ? '1' : '0');
        }
    }

    // 站点控件语义（id 与动作相反）：
    //   #pause = 播放按钮；#play = 暂停按钮；#play-btn = 中央播放钮
    // 控件显隐交给站点，脚本不强制改 display/class。
    function togglePlayback(video) {
        if (!video) return;
        const wantPlay = Boolean(video.paused);
        const container = getVideoContainer();
        if (!container) return;

        const playCtrl = container.querySelector('#play');   // 暂停钮
        const pauseCtrl = container.querySelector('#pause'); // 播放钮
        const centerBtn = container.querySelector('#play-btn');

        const target = wantPlay
            ? (pauseCtrl || centerBtn)
            : playCtrl;

        if (target) {
            try { target.click(); } catch (_) { /* ignore */ }
        }

        // 站点未接管时，同步兜底（需在用户手势调用栈内）
        if (wantPlay && video.paused) {
            const p = video.play();
            if (p && typeof p.catch === 'function') {
                p.catch((err) => zsxqLog('[zsxq] play() 失败:', err && err.name));
            }
        } else if (!wantPlay && !video.paused) {
            video.pause();
        }
        zsxqLog('[zsxq] 切换播放状态', wantPlay ? '-> play' : '-> pause');
    }

    function bindPlayerChromeSync(video) {
        if (!video || video._zsxqChromeSyncBound) return;
        video._zsxqChromeSyncBound = true;
        video.addEventListener('volumechange', () => syncVolumeUI(video));
        syncVolumeUI(video);
    }

    // 视频区域滚轮调音量（文档级委托，容器被重建后仍然有效）
    function bindVolumeWheel(toastManager) {
        if (document._zsxqVolumeWheelBound) return;
        document._zsxqVolumeWheelBound = true;

        document.addEventListener('wheel', (e) => {
            const target = e.target;
            if (!target || !target.closest) return;
            const videoContainer = target.closest('.video-container');
            if (!videoContainer) return;
            // 倍速/音量弹层打开时，不抢滚轮
            if (target.closest('.play-rate, .video-sound, .rate-select')) return;

            const video = videoContainer.querySelector('video');
            if (!video) return;

            e.preventDefault();
            const direction = e.deltaY < 0 ? 1 : -1;
            const next = Math.min(1, Math.max(0, video.volume + direction * VOLUME_WHEEL_STEP));
            video.volume = next;
            syncVolumeUI(video);
            toastManager.showToast(`音量: ${Math.round(next * 100)}%`);
            zsxqLog(`[zsxq] 滚轮调音量 - ${Math.round(next * 100)}%`);
        }, { passive: false, capture: true });
    }

    // ================== 启动与挂载 ==================
    // 脚本 UI 只初始化一次；播放器扩展按钮可随 .video-container 重建反复挂载。
    const boot = {
        ready: false,
        toastManager: null,
        fullScreenController: null,
        fullScreenButton: null,
        playerFsButton: null,
        nextSectionButton: null,
        buttonManager: null,
        boundVideo: null,
        boundVideoHandlers: null
    };

    function applyFullScreenState(isFullScreen) {
        updateFullscreenUI(boot.fullScreenButton, boot.playerFsButton, isFullScreen);
    }

    function toggleWebFullScreen() {
        const container = document.querySelector('.video-container');
        if (!container) {
            boot.toastManager.showToast('错误：未找到视频');
            return;
        }
        if (container._isPseudoFullScreen) {
            boot.fullScreenController.exitPseudoFullScreen(container);
            boot.toastManager.showToast('退出全屏');
            applyFullScreenState(false);
        } else {
            boot.fullScreenController.enterPseudoFullScreen(container);
            boot.toastManager.showToast('进入全屏 (按ESC退出)');
            applyFullScreenState(true);
        }
    }

    function bindProgressMemory(videoContainer) {
        const videoElement = videoContainer.querySelector('video');
        if (!videoElement || boot.boundVideo === videoElement) return;

        // 换源时解绑旧 video，避免重复监听
        if (boot.boundVideo && boot.boundVideoHandlers) {
            const { onMeta, onTime, onUnload } = boot.boundVideoHandlers;
            boot.boundVideo.removeEventListener('loadedmetadata', onMeta);
            boot.boundVideo.removeEventListener('timeupdate', onTime);
            window.removeEventListener('beforeunload', onUnload);
        }

        const buttonManager = boot.buttonManager;
        const fullScreenController = boot.fullScreenController;
        const toastManager = boot.toastManager;

        const onMeta = () => {
            if (buttonManager.videoProgressMemoryEnabled && fullScreenController.restoreVideoProgress(videoElement)) {
                toastManager.showToast('已恢复播放进度');
            }
        };
        let lastSavedTime = 0;
        const onTime = () => {
            if (!buttonManager.videoProgressMemoryEnabled) return;
            const currentTime = videoElement.currentTime;
            const duration = videoElement.duration;
            if (currentTime > 0 && duration > 0 && (currentTime - lastSavedTime) >= 5) {
                fullScreenController.saveVideoProgress(currentTime, duration);
                lastSavedTime = currentTime;
            }
        };
        const onUnload = () => {
            if (buttonManager.videoProgressMemoryEnabled &&
                videoElement.currentTime > 0 &&
                videoElement.duration > 0) {
                fullScreenController.saveVideoProgress(videoElement.currentTime, videoElement.duration);
            }
        };

        videoElement.addEventListener('loadedmetadata', onMeta);
        videoElement.addEventListener('timeupdate', onTime);
        window.addEventListener('beforeunload', onUnload);
        boot.boundVideo = videoElement;
        boot.boundVideoHandlers = { onMeta, onTime, onUnload };
    }

    function remountPlayerChrome() {
        if (!boot.ready) return;
        const container = document.querySelector('.video-container');
        if (!container) return;

        injectPlayerControlsButton(boot.playerFsButton);
        injectNextSectionButton(boot.nextSectionButton);
        ensureTripleSpeedOption();
        bindProgressMemory(container);
        bindPlayerChromeSync(container.querySelector('video'));
        applyFullScreenState(Boolean(container._isPseudoFullScreen));
    }

    function initCoreOnce() {
        if (boot.ready) return;

        boot.toastManager = new ToastManager();
        boot.fullScreenController = new FullScreenController(boot.toastManager);

        boot.fullScreenButton = document.createElement('button');
        boot.fullScreenButton.className = 'fullscreen-btn';
        boot.fullScreenButton.innerText = '全屏';
        document.body.appendChild(boot.fullScreenButton);

        boot.playerFsButton = createPlayerControlsButton();
        boot.nextSectionButton = createNextSectionButton(boot.toastManager);
        boot.buttonManager = new ButtonManager(boot.fullScreenButton, boot.toastManager);

        boot.fullScreenButton.addEventListener('click', (e) => {
            if (boot.buttonManager.wasJustDragged()) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            toggleWebFullScreen();
        });
        boot.playerFsButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWebFullScreen();
        });

        const keyboardController = new KeyboardController(boot.toastManager);
        keyboardController.setup(boot.fullScreenController, applyFullScreenState);

        bindVolumeWheel(boot.toastManager);
        showFirstTimeNotice();

        // 文档级监听：.video-container 被 Angular 整棵替换后也能重新挂载
        let extrasSyncTimer = null;
        const domObserver = new MutationObserver(() => {
            if (!boot.ready) return;
            if (extrasSyncTimer) return;
            extrasSyncTimer = setTimeout(() => {
                extrasSyncTimer = null;
                remountPlayerChrome();
            }, 200);
        });
        domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        const visibilityFix = new VisibilityFixController({
            onRemount: remountPlayerChrome
        });
        visibilityFix.setup();

        boot.ready = true;
        remountPlayerChrome();
        zsxqLog('[zsxq] 初始化完成');
    }

    // 等 .video-container 出现后启动
    function startWhenVideoContainerExists() {
        if (document.querySelector('.video-container')) {
            initCoreOnce();
            return true;
        }
        return false;
    }

    if (!startWhenVideoContainerExists()) {
        const observer = new MutationObserver(() => {
            if (startWhenVideoContainerExists()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            startWhenVideoContainerExists();
        }, 10000);
    }
})();