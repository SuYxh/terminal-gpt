/**
 * 上下文管理模块
 * 使用向量存储实现智能上下文管理，支持相似度搜索和令牌限制
 * 
 * 主要功能：
 * 1. 将对话内容转换为向量进行存储
 * 2. 基于余弦相似度进行上下文搜索
 * 3. 管理令牌数量，防止上下文过大
 * 4. 提供上下文的添加、获取和清理功能
 */


/**
 * 这个文件实现了一个智能的上下文管理系统，主要特点：

1. 向量化存储 ：
   - 使用 tiktoken 将文本转换为令牌
   - 使用向量表示文本内容
   - 支持相似度搜索
2. 智能搜索 ：
   - 使用 HNSW (Hierarchical Navigable Small World) 算法
   - 基于余弦相似度进行最近邻搜索
   - 快速找到最相关的上下文
3. 令牌管理 ：
   - 限制上下文总令牌数
   - 自动移除旧的上下文
   - 防止内存占用过大
4. 重复检测 ：
   - 避免添加重复的上下文
   - 保持上下文的简洁性
5. 错误处理 ：
   - 完整的错误捕获和处理
   - 优雅的失败处理
   - 详细的错误日志
这个模块是整个项目的核心组件之一，确保了 AI 助手能够维持连贯的对话，同时避免了上下文窗口过大的问题。
 */


/* eslint-disable @typescript-eslint/no-explicit-any */
import { encoding_for_model, TiktokenModel } from "@dqbd/tiktoken";
import hnswlib from "hnswlib-node";

/**
 * 上下文项接口
 * @property role - 消息角色（user/assistant/system）
 * @property content - 消息内容
 */
export interface ContextItem {
  role: string;
  content: string;
}

/**
 * 向量存储接口
 * @interface VectorStore
 */
interface VectorStore {
  // 添加新的上下文项
  addItem: (item: ContextItem) => void;
  // 获取相关上下文
  getRelevantContext: (query: string, k?: number) => ContextItem[];
}


/**
 * 创建向量存储实例
 * @param model - 使用的语言模型类型
 * @param maxTokens - 最大令牌数限制
 * @returns VectorStore 实例
 */
const createVectorStore = (
  model: TiktokenModel = "gpt-4o",
  maxTokens: number = 4096
): VectorStore => {
  // 向量维度，用于相似度计算
  const dimension: number = 1536; // Fixed dimension size
  // 创建 HNSW 索引用于快速近似最近邻搜索
  let index: hnswlib.HierarchicalNSW = new hnswlib.HierarchicalNSW(
    // 使用余弦相似度
    "cosine",
    dimension
  );
  // 存储上下文项
  const items: ContextItem[] = [];
  // 创建令牌编码器
  let encoder: any = encoding_for_model(model);
  // 当前使用的令牌数
  let currentTokens: number = 0;

  try {
    // 初始化编码器和索引
    encoder = encoding_for_model(model);
    index = new hnswlib.HierarchicalNSW("cosine", dimension);
    // 初始化索引，最大支持1000个元素
    index.initIndex(1000); // Initialize index with a maximum of 1000 elements
  } catch (error) {
    console.error("Error initializing VectorStore:", error);
    throw new Error("Failed to initialize VectorStore");
  }

    /**
   * 将文本转换为向量
   * @param text - 输入文本
   * @returns 文本对应的向量表示
   */
  const textToVector = (text: string): number[] => {
    try {
       // 使用模型的编码器将文本转换为令牌
      const encoded = encoder.encode(text);
      // 创建固定维度的向量
      const vector = new Array(dimension).fill(0);
      for (let i = 0; i < encoded.length && i < dimension; i++) {
        // 简单归一化处理
        vector[i] = encoded[i] / 100; // Simple normalization
      }
      return vector;
    } catch (error) {
      console.error("Error converting text to vector:", error);
      throw new Error("Failed to convert text to vector");
    }
  };

    /**
   * 添加新的上下文项
   * @param item - 要添加的上下文项
   */
  const addItem = (item: ContextItem) => {
    try {
      // 验证输入
      if (!item || typeof item.content !== "string") {
        console.error("Invalid item:", item);
        return;
      }
      // 转换为向量
      const vector = textToVector(item.content);
       // 计算令牌数
      const tokenCount = encoder.encode(item.content).length;

      // Remove old items if adding this would exceed the token limit
       // 如果添加新项会超出令牌限制，则移除旧项
      while (currentTokens + tokenCount > maxTokens && items.length > 0) {
        const removedItem = items.shift();
        if (removedItem) {
          currentTokens -= encoder.encode(removedItem.content).length;
        }
      }

      // 添加新项到索引和存储中
      const id = items.length;
      index.addPoint(vector, id);
      items.push(item);
      currentTokens += tokenCount;
    } catch (error) {
      console.error("Error adding item to VectorStore:", error);
    }
  };


  /**
   * 获取与查询相关的上下文
   * @param query - 查询文本
   * @param k - 返回的相关项数量
   * @returns 相关的上下文项数组
   */
  const getRelevantContext = (query: string, k: number = 5): ContextItem[] => {
    try {
      if (items.length === 0) {
        return [];
      }
      // 将查询转换为向量
      const queryVector = textToVector(query);
      // 使用 KNN 搜索最相关的项
      const results = index.searchKnn(queryVector, Math.min(k, items.length));
      if (!results || !Array.isArray(results.neighbors)) {
        return [];
      }
      // 返回找到的上下文项
      return results.neighbors.map(
        (id) =>
          items[id] || {
            role: "system",
            content: "Context item not found",
          }
      );
    } catch (error) {
      console.error("Error getting relevant context:", error);
      return [];
    }
  };

  return { addItem, getRelevantContext };
};

// 创建全局向量存储实例
let vectorStore: VectorStore;

try {
  vectorStore = createVectorStore();
} catch (error) {
  console.error("Error creating VectorStore:", error);
  throw new Error("Failed to create VectorStore");
}

/**
 * 添加新的上下文项到存储中
 * 如果内容已存在则跳过
 */
export function addContext(item: ContextItem) {
  const existingItems = vectorStore.getRelevantContext(item.content);
  if (
    !existingItems.some(
      (existingItem) =>
        existingItem.role === item.role && existingItem.content === item.content
    )
  ) {
    vectorStore.addItem(item);
  }
}

/**
 * 获取与查询相关的上下文
 */
export function getContext(query: string): ContextItem[] {
  return vectorStore.getRelevantContext(query);
}

/**
 * 清理所有上下文，重新初始化存储
 */
export function clearContext() {
  vectorStore = createVectorStore();
}
