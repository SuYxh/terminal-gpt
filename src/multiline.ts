/**
 * 多行输入处理模块
 * 用于支持终端中的多行文本输入功能
 */
import readline from "readline";

/**
 * 处理多行输入的核心函数
 * @returns Promise<string> 返回用户输入的完整文本
 * 
 * 使用方式：
 * - 正常输入文本，按回车换行
 * - 输入空行表示当前段落结束
 * - Ctrl+D 提交所有内容
 *    - 在 Unix-like 系统中（包括 MacOS），Ctrl+D 会触发 EOF（End Of File）信号
      - 当 readline 接收到 EOF 信号时，会自动触发 close 事件
 * - Ctrl+C 取消输入并退出
      - Ctrl+C 会触发 SIGINT（中断信号）
      - readline 接口会自动处理这个信号并关闭接口
      - 同样会触发 close 事件，但是进程会退出
 */
function promptMultilineInput() {
  return new Promise((resolve) => {
    let multilineInput = "";
    console.log(
      "Enter your text (to finish enter an empty line, Ctrl+D to submit, Ctrl+C to exit):\n"
    );

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    rl.on("line", (line) => {
      multilineInput += line + "\n";
    });

    rl.on("close", () => {
      resolve(multilineInput);
    });
  });
}

// Main function to loop input
export default async function multiline(): Promise<string> {
  const input = await promptMultilineInput();
  //  console.log("\nYou entered:\n", input);
  return input as string;
}
