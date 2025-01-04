# Knowledge-Planet-Webpage-Full-Screen

用于知识星球网页全屏,项目仅供学习使用，请勿非法使用，如有侵权请联系作者进行删除

**脚本仅用于全屏**

仅通过单机测试

**如何使用脚本**

谷歌浏览器，下载油猴插件，添加脚本，然后刷新页面即可

```js
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
                cursor: pointer;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 5px;
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
        fullScreenButton.addEventListener('click', () => {
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
        });

        // 监听键盘事件
        window.addEventListener('keydown', (event) => {
            const videoContainer = document.querySelector('.video-container');
            const videoElement = videoContainer ? videoContainer.querySelector('video') : null;

            // 添加长按检测
            if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && !event.repeat) {
                if (videoElement) {
                    videoElement._originalPlaybackRate = videoElement.playbackRate;
                }
            }

            if (event.key === 'Escape') {
                if (videoContainer && videoContainer._isPseudoFullScreen) {
                    exitPseudoFullScreen(videoContainer);
                    videoContainer._isPseudoFullScreen = false;
                    showToast('退出全屏');
                    fullScreenButton.innerText = '全屏';
                }
            } else if (event.key === ' ') {
                event.preventDefault();
                if (videoElement) {
                    if (videoElement.paused) {
                        videoElement.play();
                        showToast('播放');
                    } else {
                        videoElement.pause();
                        showToast('暂停');
                    }
                }
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                if (videoElement) {
                    if (event.repeat) {
                        videoElement.playbackRate = 3.0;
                        throttledShowToast('3倍速播放中');
                    } else {
                        videoElement.currentTime += 5;
                        throttledShowToast('快进 5 秒');
                    }
                }
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                if (videoElement) {
                    if (event.repeat) {
                        videoElement.playbackRate = 3.0;
                        throttledShowToast('3倍速播放中');
                    } else {
                        videoElement.currentTime -= 5;
                        throttledShowToast('快退 5 秒');
                    }
                }
            }
        });

        // 添加键盘松开事件监听
        window.addEventListener('keyup', (event) => {
            const videoContainer = document.querySelector('.video-container');
            const videoElement = videoContainer ? videoContainer.querySelector('video') : null;

            if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && videoElement) {
                videoElement.playbackRate = videoElement._originalPlaybackRate || 1.0;
                showToast('恢复正常速度');
            }
        });
    });
})();
```
