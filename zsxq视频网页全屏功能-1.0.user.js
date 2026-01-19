// ==UserScript==
// @name         zsxq视频网页全屏功能
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  为zsxq视频网站添加一个网页全屏的功能
// @author       You
// @match        *://wx.zsxq.com/*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    // 等待页面加载完成
    window.addEventListener('load', () => {
        // 添加提示框和按钮样式
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
                cursor: move; /* 修改为可拖拽的光标 */
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 5px;
                user-select: none; /* 防止拖拽时选中文本 */
                white-space: nowrap; /* 防止文字换行 */
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

        // 添加防抖函数
        let toastTimeout = null;
        let currentToast = null;

        function showToast(message, duration = 2000) {
            // 如果已经存在toast，先清除它
            if (currentToast) {
                currentToast.remove();
            }
            // 清除未完成的定时器
            if (toastTimeout) {
                clearTimeout(toastTimeout);
            }

            const toast = document.createElement('div');
            toast.className = 'video-toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            currentToast = toast;

            // 强制重绘
            toast.offsetHeight;
            toast.classList.add('show');

            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    toast.remove();
                    currentToast = null;
                }, 300);
            }, duration);
        }

        // 添加节流函数
        function throttle(func, limit) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            }
        }

        // 创建一个全屏按钮
        const fullScreenButton = document.createElement('button');
        fullScreenButton.className = 'fullscreen-btn';
        fullScreenButton.innerText = '全屏';

        // 将按钮添加到页面
        document.body.appendChild(fullScreenButton);

        // 保存原始 body 样式
        const originalBodyOverflow = document.body.style.overflow;

        // 定义进入伪全屏和退出伪全屏的函数
        const enterPseudoFullScreen = (videoContainer) => {
            // 保存原始样式
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

            // 保存 processing 元素
            videoContainer._processingElement = videoContainer.querySelector('.processing');
            if (videoContainer._processingElement) {
                videoContainer._processingElement._originalStyles = {
                    width: videoContainer._processingElement.style.width,
                    height: videoContainer._processingElement.style.height
                };
                videoContainer._processingElement.remove();
            }

            // 设置新的样式以覆盖整个页面
            videoContainer.style.position = 'fixed';
            videoContainer.style.top = '0';
            videoContainer.style.left = '0';
            videoContainer.style.right = '0';
            videoContainer.style.bottom = '0';
            videoContainer.style.width = '100vw';
            videoContainer.style.height = '100vh';
            videoContainer.style.backgroundColor = 'black';
            videoContainer.style.zIndex = '9998';
            videoContainer.style.overflow = 'hidden';

            // 设置 processing 元素的样式
            if (videoContainer._processingElement) {
                videoContainer._processingElement.style.setProperty('width', '100%', 'important');
                videoContainer._processingElement.style.setProperty('height', '100%', 'important');
                videoContainer.appendChild(videoContainer._processingElement);
            }

            // 禁用 body 滚动
            document.body.style.overflow = 'hidden';
        };

        const exitPseudoFullScreen = (videoContainer) => {
            // 恢复原始样式
            if (videoContainer._originalStyles) {
                videoContainer.style.position = videoContainer._originalStyles.position;
                videoContainer.style.top = videoContainer._originalStyles.top;
                videoContainer.style.left = videoContainer._originalStyles.left;
                videoContainer.style.width = videoContainer._originalStyles.width;
                videoContainer.style.height = videoContainer._originalStyles.height;
                videoContainer.style.backgroundColor = videoContainer._originalStyles.backgroundColor;
                videoContainer.style.zIndex = videoContainer._originalStyles.zIndex;
                videoContainer.style.overflow = videoContainer._originalStyles.overflow;

                delete videoContainer._originalStyles;
            }

            // 恢复 processing 元素的样式并添加回来
            if (videoContainer._processingElement) {
                videoContainer._processingElement.style.width = videoContainer._processingElement._originalStyles.width;
                videoContainer._processingElement.style.height = videoContainer._processingElement._originalStyles.height;
                videoContainer.appendChild(videoContainer._processingElement);
                delete videoContainer._processingElement._originalStyles;
            }

            // 恢复 body 滚动
            document.body.style.overflow = originalBodyOverflow;
        };

        // 对快进快退操作进行节流处理
        const throttledShowToast = throttle(showToast, 200);

        // 监听全屏按钮的点击事件
        const handleClick = (e) => {
            // 新增：如果刚刚拖拽过，不响应点击
            if (fullScreenButton.hasAttribute('data-dragging')) {
                fullScreenButton.removeAttribute('data-dragging');
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            const videoContainer = document.querySelector('.video-container');
            const processingElement = videoContainer.querySelector('.processing');

            if (videoContainer) {
                if (!videoContainer._isPseudoFullScreen) {
                    enterPseudoFullScreen(videoContainer);
                    videoContainer._isPseudoFullScreen = true;
                    showToast('进入全屏 (按ESC退出)');
                    fullScreenButton.innerText = '退出全屏';
                } else {
                    exitPseudoFullScreen(videoContainer);
                    videoContainer._isPseudoFullScreen = false;
                    showToast('退出全屏');
                    fullScreenButton.innerText = '全屏';
                }
            } else {
                console.error('没有找到视频盒子');
                showToast('错误：未找到视频');
            }
        };

        fullScreenButton.addEventListener('click', handleClick);

        // 监听键盘事件
        let keyHoldTimer = null;
        let isLongPress = false;
        const LONG_PRESS_THRESHOLD = 300; // 长按阈值300ms

        window.addEventListener('keydown', (event) => {
            const videoContainer = document.querySelector('.video-container');
            const videoElement = videoContainer ? videoContainer.querySelector('video') : null;

            if (!videoElement) return;

            if (event.key === 'Escape') {
                if (videoContainer && videoContainer._isPseudoFullScreen) {
                    exitPseudoFullScreen(videoContainer);
                    videoContainer._isPseudoFullScreen = false;
                    showToast('退出全屏');
                    fullScreenButton.innerText = '全屏';
                }
            } else if (event.key === ' ') {
                event.preventDefault();
                if (videoElement.paused) {
                    videoElement.play();
                    showToast('播放');
                } else {
                    videoElement.pause();
                    showToast('暂停');
                }
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();

                // 如果已有长按计时器，直接返回（防止重复触发）
                if (keyHoldTimer) return;

                const direction = event.key === 'ArrowRight' ? 1 : -1;

                // 启动长按检测计时器
                keyHoldTimer = setTimeout(() => {
                    isLongPress = true;
                    videoElement._originalPlaybackRate = videoElement.playbackRate;
                    videoElement.playbackRate = 3.0;
                    showToast('3倍速播放中');
                }, LONG_PRESS_THRESHOLD);

                // 短按操作（在长按阈值内松开则执行快进/快退）
                const shortPressAction = () => {
                    if (!isLongPress) {
                        videoElement.currentTime += direction * 5;
                        showToast(direction > 0 ? '快进 5 秒' : '快退 5 秒');
                    }
                };

                // 监听对应的keyup事件
                const handleKeyUp = (upEvent) => {
                    if (upEvent.key === event.key) {
                        clearTimeout(keyHoldTimer);
                        keyHoldTimer = null;
                        isLongPress = false;

                        if (videoElement.playbackRate === 3.0) {
                            videoElement.playbackRate = videoElement._originalPlaybackRate || 1.0;
                            showToast('恢复正常速度');
                        } else {
                            shortPressAction();
                        }

                        window.removeEventListener('keyup', handleKeyUp);
                    }
                };

                window.addEventListener('keyup', handleKeyUp);
            }
        });

        // ===== 新增拖拽功能 =====
        let isDragging = false;
        let offsetX, offsetY;
        // 记录拖拽结束时的位置比例
        let dragEndXRatio = null;
        let dragEndYRatio = null;

        // 鼠标按下事件
        fullScreenButton.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // 只响应左键
            isDragging = true;
            fullScreenButton.setAttribute('data-dragging', 'true'); // 标记正在拖拽

            // 计算鼠标相对于按钮左上角的偏移
            const rect = fullScreenButton.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            // 阻止文本选择
            e.preventDefault();
        });

        // 鼠标移动事件（使用节流）
        const throttledMove = throttle((e) => {
            if (!isDragging) return;

            // 计算新位置（限制在视口范围内）
            const x = Math.max(0, Math.min(e.clientX - offsetX, window.innerWidth - fullScreenButton.offsetWidth));
            const y = Math.max(0, Math.min(e.clientY - offsetY, window.innerHeight - fullScreenButton.offsetHeight));

            fullScreenButton.style.left = x + 'px';
            fullScreenButton.style.top = y + 'px';
            fullScreenButton.style.right = 'auto'; // 清除初始的right样式
        }, 16); // ~60fps

        window.addEventListener('mousemove', throttledMove);

        // 鼠标释放事件
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                // 记录拖拽结束时的位置比例
                const btnRect = fullScreenButton.getBoundingClientRect();
                dragEndXRatio = btnRect.left / window.innerWidth;
                dragEndYRatio = btnRect.top / window.innerHeight;
            }
        });

        // ===== 窗口缩放时确保按钮始终在可视区域内 =====
        const ensureButtonInViewport = throttle(() => {
            if (dragEndXRatio === null && dragEndYRatio === null) {
                fullScreenButton.style.left = 'auto';
                fullScreenButton.style.top = '10px';
                fullScreenButton.style.right = '10px';
                fullScreenButton.style.bottom = 'auto';
                return;
            }

            // 根据比例计算新位置
            const newLeft = dragEndXRatio * window.innerWidth;
            const newTop = dragEndYRatio * window.innerHeight;

            // 限制在视口范围内
            const maxWidth = window.innerWidth - fullScreenButton.offsetWidth;
            const maxHeight = window.innerHeight - fullScreenButton.offsetHeight;

            const clampedLeft = Math.max(0, Math.min(newLeft, maxWidth));
            const clampedTop = Math.max(0, Math.min(newTop, maxHeight));

            fullScreenButton.style.left = clampedLeft + 'px';
            fullScreenButton.style.top = clampedTop + 'px';
            fullScreenButton.style.right = 'auto';
            fullScreenButton.style.bottom = 'auto';
        }, 100);

        window.addEventListener('resize', ensureButtonInViewport);
    });
})();
