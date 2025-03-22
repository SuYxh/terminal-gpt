/**
 * 终端渐变动画模块
 * 实现终端中的渐变色动画效果，主要用于加载提示和进度展示
 * 
 * 主要功能：
 * 1. 定义渐变色系
 * 2. 生成动画帧
 * 3. 创建带有火箭图标的加载动画
 */

// 用于终端颜色渲染
import chalk from "chalk";
// 用于创建终端加载动画
import ora from "ora";

// 定义渐变色系列表，从橙色到紫色的渐变
const gradientColors: string[] = [
  `#ff5e00`,
  `#ff4c29`,
  `#ff383f`,
  `#ff2453`,
  `#ff0565`,
  `#ff007b`,
  `#f5008b`,
  `#e6149c`,
  `#d629ae`,
  `#c238bd`,
];

// 定义火箭图标的 ASCII 字符
export const rocketAscii = "■■▶";

// 创建完整的渐变参考数组
// 通过组合原始渐变色、反转渐变色和原始渐变色
// 形成一个循环渐变效果：正向渐变 -> 反向渐变 -> 正向渐变
const referenceGradient: string[] = [
  // 原始渐变色
  ...gradientColors,
  // 反转的渐变色
  ...[...gradientColors].reverse(),
  // 再次添加原始渐变色
  ...gradientColors,
];


/**
 * 生成渐变动画的帧序列
 * 通过滑动窗口方式在 referenceGradient 上移动，
 * 每次取出一段颜色生成一帧动画
 * 
 * @return {string[]} 包含所有动画帧的数组
 */
export function getGradientAnimFrames() {
  const frames: string[] = [];
  for (let start = 0; start < gradientColors.length * 2; start++) {
    const end = start + gradientColors.length - 1;
    frames.push(
      referenceGradient
        .slice(start, end)
        .map((g) => chalk.bgHex(g as string)(" "))
        .join("")
    );
  }
  return frames;
}

// 睡眠函数，可用于控制动画速度
// function sleep(time: number) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, time);
//     });
// }
//

// 介绍动画帧生成函数
// function getIntroAnimFrames() {
//     const frames = [];
//     for (let end = 1; end <= gradientColors.length; end++) {
//         const leadingSpacesArr = Array.from(
//             new Array(Math.abs(gradientColors.length - end - 1)),
//             () => " "
//         );
//         const gradientArr = gradientColors
//             .slice(0, end)
//             .map((g) => chalk.bgHex(g)(" "));
//         frames.push([...leadingSpacesArr, ...gradientArr].join(""));
//     }
//     return frames;
// }

/**
 * 创建带有火箭图标的渐变加载动画
 * 使用 ora 库创建加载动画，配合渐变效果
 * 
 * @param text - 加载动画旁边显示的文本
 * @returns Ora 实例，可用于控制动画的开始和停止
 */
export const loadWithRocketGradient = (text: string) =>
  ora({
    spinner: {
      // 动画帧切换间隔
      interval: 80,
      // 使用生成的渐变动画帧
      frames: getGradientAnimFrames(),
    },
     // 组合火箭图标和文本
    text: `${rocketAscii} ${text}`,
  });
