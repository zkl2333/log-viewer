type LogLoaderOptions = {
  logUrl: string;
  chunkSize: number;
  pollingInterval: number;
  onNewLogChunk: (chunk: string) => void;
};

export class LogLoader {
  private logUrl: string;
  private chunkSize: number;
  private start: number = 0;
  private pollingInterval: number;
  private intervalId?: number;
  private onNewLogChunk: (chunk: string) => void;
  private buffer: Uint8Array = new Uint8Array(0);

  constructor(options: LogLoaderOptions) {
    this.logUrl = options.logUrl;
    this.chunkSize = options.chunkSize;
    this.pollingInterval = options.pollingInterval;
    this.onNewLogChunk = options.onNewLogChunk;
  }

  private fetchLogChunk(): Promise<ArrayBuffer> {
    const headers = new Headers({
      Range: `bytes=${this.start}-${this.start + this.chunkSize - 1}`,
    });

    return fetch(this.logUrl, { headers })
      .then((response) => {
        if (!response.ok) {
          // 检查是否是416错误
          if (response.status === 416) {
            console.log("已经读取到文件末尾");
            return new ArrayBuffer(0); // 返回一个空的ArrayBuffer
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
      })
      .then((data) => {
        this.start += this.chunkSize;
        return data;
      });
  }

  private processChunk(data: ArrayBuffer): void {
    // 将新数据追加到现有缓冲区
    let newData = new Uint8Array(data);
    let combinedData = new Uint8Array(this.buffer.length + newData.length);
    combinedData.set(this.buffer);
    combinedData.set(newData, this.buffer.length);
    this.buffer = combinedData;

    // 将缓冲区中的数据转换为字符串
    let textDecoder = new TextDecoder();
    let text = textDecoder.decode(this.buffer, { stream: true });

    // 查找最后一个换行符
    let lastNewlineIndex = text.lastIndexOf("\n");
    if (lastNewlineIndex === -1) {
      return; // 如果没有换行符，则保持当前缓冲区不变
    }

    // 获取完整的日志条目
    let completeLogEntries = text.slice(0, lastNewlineIndex + 1);

    // 使用回调函数处理完整的日志条目
    this.onNewLogChunk(completeLogEntries);

    // 更新缓冲区，移除已处理的数据
    this.buffer = this.buffer.slice(new TextEncoder().encode(completeLogEntries).length);
  }

  public loadInitialChunks(): Promise<void> {
    return this.fetchLogChunk()
      .then((data) => {
        this.processChunk(data);
      })
      .catch((error) => console.error("Error fetching initial log chunk:", error));
  }

  public startPolling(): void {
    this.intervalId = setInterval(() => {
      this.fetchLogChunk()
        .then((data) => {
          if (data) {
            this.processChunk(data);
          }
        })
        .catch((error) => console.error("Error fetching new log chunk:", error));
    }, this.pollingInterval);
  }

  public stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
