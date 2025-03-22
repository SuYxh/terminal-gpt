import OpenAI from "openai";
import chalk from "chalk";
import { addContext, getContext } from "../context";
import { loadWithRocketGradient } from "../gradient";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { combineConsecutiveMessages, ensureMessagesAlternate } from "./common";


/**
 * OpenAI 引擎的主要处理函数
 * @param apiKey - OpenAI API 密钥，支持字符串或 Promise
 * @param prompt - 用户输入的提示文本
 * @param opts - 配置选项
 *   - model: 使用的模型名称
 *   - temperature: 回答的随机性程度
 * @param hasContext - 是否需要保持上下文
 * @returns Promise<string> 返回 AI 的回答内容
 */
export const OpenAIEngine = async (
  apiKey: string | Promise<string>,
  prompt: string,
  opts: {
    model: string;
    temperature: unknown;
  },
  hasContext: boolean = false
) => {
  // 解析 API 密钥（如果是 Promise）
  const apiKeyValue = await apiKey;
  // 初始化 OpenAI 客户端，使用自定义 API 地址
  const openai = new OpenAI({ apiKey: apiKeyValue, baseURL: 'https://api.siliconflow.cn/v1' });
  // 创建加载动画
  const spinner = loadWithRocketGradient("Thinking...").start();

  try {
    // 获取相关上下文历史记录
    const relevantContext = getContext(prompt);
    console.log('openai-relevantContext', relevantContext);

    // Process and combine messages
    // 处理消息历史：
    // 1. 合并连续的相同角色消息
    // 2. 确保消息角色交替（用户/助手）
    let processedMessages = combineConsecutiveMessages(relevantContext);
    processedMessages = ensureMessagesAlternate(processedMessages);

    // 将当前用户输入添加到消息列表
    processedMessages.push({ role: "user", content: prompt });

    // 将消息转换为 OpenAI API 所需的格式
    const messages: ChatCompletionMessageParam[] = processedMessages.map(
      (item) => ({
        role: item.role as "system" | "user" | "assistant",
        content: item.content,
      })
    );

    // 调用 OpenAI API 创建聊天完成
    const completion = await openai.chat.completions.create({
      model: opts.model || "gpt-4o-2024-08-06",
      messages: messages,
      temperature: opts.temperature ? Number(opts.temperature) : 1,
    });

    // 获取 AI 的回答
    const message = completion.choices[0].message;
    // 如果需要保持上下文，将回答添加到上下文历史
    if (hasContext) {
      addContext({ role: message.role, content: message.content || "" });
    }
    
    // 停止加载动画
    spinner.stop();
    return message.content;
  } catch (err) {
    spinner.stop();
    if (err instanceof Error) {
      console.log(err);
      throw new Error(`${chalk.red(err.message)}`);
    } else {
      throw new Error(`${chalk.red("An unknown error occurred")}`);
    }
  }
};
