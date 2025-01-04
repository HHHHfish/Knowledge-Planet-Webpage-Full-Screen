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
        // 创建一个全屏按钮
        const fullScreenButton = document.createElement('button');
        fullScreenButton.innerText = '全屏'; // 设置按钮文本为"全屏"
        fullScreenButton.style.position = 'fixed'; // 固定按钮位置
        fullScreenButton.style.top = '10px'; // 距离顶部10像素
        fullScreenButton.style.right = '10px'; // 距离右侧10像素
        fullScreenButton.style.zIndex = '9999'; // 设置z-index确保按钮在最上层
        fullScreenButton.style.backgroundColor = '#007BFF'; // 设置背景颜色为蓝色
        fullScreenButton.style.color = '#fff'; // 设置文字颜色为白色
        fullScreenButton.style.border = 'none'; // 去掉边框
        fullScreenButton.style.padding = '10px'; // 设置内边距
        fullScreenButton.style.cursor = 'pointer'; // 设置鼠标悬停时的光标样式为指针
        fullScreenButton.style.borderRadius = '5px'; // 设置圆角

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
                videoContainer._processingElement.remove(); // 移除 processing 元素以便重新设置样式
            }

            // 设置新的样式以覆盖整个页面
            videoContainer.style.position = 'fixed';
            videoContainer.style.top = '0';
            videoContainer.style.left = '0';
            videoContainer.style.right = '0';
            videoContainer.style.bottom = '0';
            videoContainer.style.width = '100vw';
            videoContainer.style.height = '100vh';
            videoContainer.style.backgroundColor = 'black'; // 设置背景颜色为黑色
            videoContainer.style.zIndex = '9998'; // 确保容器在最上层
            videoContainer.style.overflow = 'hidden'; // 防止内容溢出

            // 设置 processing 元素的样式
            if (videoContainer._processingElement) {
                videoContainer._processingElement.style.setProperty('width', '100%', 'important');
                videoContainer._processingElement.style.setProperty('height', '100%', 'important');
                videoContainer.appendChild(videoContainer._processingElement); // 将 processing 元素添加回容器
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

                // 清除保存的原始样式
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

        // 监听全屏按钮的点击事件
        fullScreenButton.addEventListener('click', () => {
            // 找到包含视频的容器元素
            const videoContainer = document.querySelector('.video-container');
            // 得到videoContainer的第一个子盒子
            const processingElement = videoContainer.querySelector('.processing');
            console.log(processingElement);
            if (videoContainer) {
                // 切换伪全屏状态
                if (!videoContainer._isPseudoFullScreen) {
                    enterPseudoFullScreen(videoContainer); // 进入伪全屏
                    // 移除.processing样式

                    // processingElement.classList.remove('processing');
                    videoContainer._isPseudoFullScreen = true; // 标记为伪全屏状态
                } else {
                    exitPseudoFullScreen(videoContainer); // 退出伪全屏
                    videoContainer._isPseudoFullScreen = false; // 取消伪全屏标记
                }
            } else {
                console.error('没有找到视频盒子'); // 如果未找到视频容器，输出错误信息
            }
        });

        // 监听键盘事件，按下 Esc 键退出全屏
        window.addEventListener('keydown', (event) => {
            const videoContainer = document.querySelector('.video-container');
            const videoElement = videoContainer ? videoContainer.querySelector('video') : null;

            // 添加长按检测
            if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && !event.repeat) {
                // 记录原始播放速度
                if (videoElement) {
                    videoElement._originalPlaybackRate = videoElement.playbackRate;
                }
            }

            if (event.key === 'Escape') {
                if (videoContainer && videoContainer._isPseudoFullScreen) {
                    exitPseudoFullScreen(videoContainer); // 退出伪全屏
                    videoContainer._isPseudoFullScreen = false; // 取消伪全屏标记
                }
            } else if (event.key === ' ') { // 空格键暂停/播放
                event.preventDefault(); // 阻止默认行为（如滚动）
                if (videoElement) {
                    if (videoElement.paused) {
                        videoElement.play();
                    } else {
                        videoElement.pause();
                    }
                }
            } else if (event.key === 'ArrowRight') { // 右箭头键快进
                event.preventDefault();
                if (videoElement) {
                    if (event.repeat) {
                        // 长按右键时设置3倍速
                        videoElement.playbackRate = 3.0;
                    } else {
                        // 短按保持原有的快进功能
                        videoElement.currentTime += 5;
                    }
                }
            } else if (event.key === 'ArrowLeft') { // 左箭头键快退
                event.preventDefault();
                if (videoElement) {
                    if (event.repeat) {
                        // 长按左键时设置3倍速
                        videoElement.playbackRate = 3.0;
                    } else {
                        // 短按保持原有的快退功能
                        videoElement.currentTime -= 5;
                    }
                }
            }
        });

        // 添加键盘松开事件监听
        window.addEventListener('keyup', (event) => {
            const videoContainer = document.querySelector('.video-container');
            const videoElement = videoContainer ? videoContainer.querySelector('video') : null;

            if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && videoElement) {
                // 恢复原始播放速度
                videoElement.playbackRate = videoElement._originalPlaybackRate || 1.0;
            }
        });
    });
})();