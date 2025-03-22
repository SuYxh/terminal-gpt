#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */

import chalk from "chalk";
import * as process from "process";
import { Command } from "commander";
import intro from "./intro";
import { apiKeyPrompt, checkIsLatestVersion, promptResponse } from "./utils";
// 凭证管理
import { deleteCredentials } from "./creds";
// 命令行输入
import readline from "readline";
import { findPlugin, executePlugin, initializePlugins } from "./commands";
import determinePlugins from "./rag";
import multiline from "./multiline";
import { clearContext } from "./context";

// 创建命令行程序实例
const program = new Command();


/**
 * 交互式聊天命令
 * 支持参数：
 * -e, --engine: 选择 LLM 引擎
 * -t, --temperature: 控制回答的随机性
 */
program
  .command("chat")
  .option("-e, --engine <engine>", "LLM to use")
  .option("-t, --temperature <temperature>", "Response temperature")
  .usage(`"<project-directory>" [options]`)
  .action(async (opts) => {
    // 显示欢迎界面
    intro();
    // 检查是否是最新版本
    await checkIsLatestVersion();
    // 获取 API 凭证
    const creds = await apiKeyPrompt();
    // 初始化插件系统
    initializePlugins();


     /**
     * 处理用户输入的主循环
     * 1. 获取用户输入
     * 2. 判断是否使用插件
     * 3. 处理响应
     */
    const prompt = async () => {
      // 向终端输出内容: 显示蓝色的输入提示符
      process.stdout.write(chalk.blueBright("\nYou: "));
      // - process.stdin : Node.js 中标准输入流 resume() : 恢复输入流的读取 作用：允许程序继续接收用户输入  默认情况下，输入流是暂停的，需要手动恢复
      // 准备接收用户输入
      process.stdin.resume();
      // 设置输入流的字符编码为 UTF-8: 确保正确处理各种字符编码
      process.stdin.setEncoding("utf-8");

      // 获取用户输入（支持多行）
      const data = await multiline();
      const userInput = data.toString().trim();

      if (creds.apiKey != null) {
        try {
          // 检查是否直接调用插件（以 @ 开头的命令）
          const plugin = findPlugin(userInput);
          console.log('plugin', plugin);

          if (plugin) {
            console.log(chalk.yellow(`Executing plugin: ${plugin.name}`));
            await executePlugin(plugin, {
              userInput,
              engine: creds.engine,
              apiKey: creds.apiKey,
              opts: { ...opts, model: creds.model || undefined },
            });
          } else {
            // 使用 LLM 智能判断是否需要使用插件
            const pluginKeyword = await determinePlugins(
              creds.engine,
              creds.apiKey,
              userInput,
              { ...opts, model: creds.model || undefined }
            );

            console.log('pluginKeyword', pluginKeyword);

            // 清空上下文
            clearContext();

            // 处理插件执行结果
            if (pluginKeyword.trim() !== "none") {
              const plugin = findPlugin(pluginKeyword);
              if (plugin) {
                console.log(chalk.yellow(`Executing plugin: ${plugin.name}`));
                await executePlugin(plugin, {
                  userInput,
                  engine: creds.engine,
                  apiKey: creds.apiKey,
                  opts: { ...opts, model: creds.model || undefined },
                });
              } else {
                console.log(chalk.red(`Plugin not found: ${pluginKeyword}`));
              }
            } else {
              // 没有匹配的插件，直接使用 LLM 回答
              await promptResponse(creds.engine, creds.apiKey, userInput, {
                ...opts,
                model: creds.model || undefined,
              });
            }
          }
        } catch (error) {
          console.error(chalk.red("An error occurred:"), error);
        }
      } else {
        console.log(chalk.red("API key is required for chat functionality."));
      }

      // 继续下一轮对话
      prompt();
    };

    // 启动对话循环
    prompt();
  });


/**
 * 一次性问答命令
 * 用于快速获取答案，执行完立即退出
 */
program
  .command("one-shot <question>")
  .description("Ask a one-shot question and get a quick answer")
  .option("-e, --engine <engine>", "LLM to use")
  .option("-t, --temperature <temperature>", "Response temperature")
  .action(async (question, opts) => {
    await checkIsLatestVersion();
    const creds = await apiKeyPrompt();

    if (creds.apiKey != null) {
      try {
        // 智能判断是否使用插件
        const pluginKeyword = await determinePlugins(
          creds.engine,
          creds.apiKey,
          question,
          { ...opts, model: creds.model || undefined }
        );

        if (pluginKeyword.trim() !== "none") {
          const plugin = findPlugin(pluginKeyword);
          if (plugin) {
            console.log(chalk.yellow(`Executing plugin: ${plugin.name}`));
            await executePlugin(plugin, {
              userInput: question,
              engine: creds.engine,
              apiKey: creds.apiKey,
              opts: { ...opts, model: creds.model || undefined },
            });
          } else {
            console.log(chalk.red(`Plugin not found: ${pluginKeyword}`));
          }
        } else {
          // 直接使用 LLM 回答
          await promptResponse(creds.engine, creds.apiKey, question, {
            ...opts,
            model: creds.model || undefined,
          });
        }
      } catch (error) {
        console.error(chalk.red("An error occurred:"), error);
      }
    } else {
      console.log(chalk.red("API key is required for chat functionality."));
    }

    // 回答完成后退出程序
    process.exit(0);
  });

/**
 * 删除 API 凭证命令
 * 用于清除已保存的 API key
 */
program
  .command("delete")
  .description("Delete your API key")
  .action(async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // 确认是否删除
    rl.question("Are you sure? (yes/no): ", (answer) => {
      if (answer.toLowerCase() === "yes") {
        const apiKeyDeleted = deleteCredentials();
        if (apiKeyDeleted) {
          console.log("API key deleted");
        } else {
          console.log("API key file not found, no action taken.");
        }
      } else {
        console.log("Deletion cancelled");
      }
      rl.close();
      process.exit(0);
    });
  });

// 解析命令行参数
program.parse(process.argv);
