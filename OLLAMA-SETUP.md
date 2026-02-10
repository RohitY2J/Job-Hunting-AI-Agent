# Ollama Setup Guide 🤖

## What is Ollama?

Ollama lets you run large language models locally on your computer. It's free, private, and works offline.

## Installation

### Windows

1. **Download Ollama**
   - Go to https://ollama.com/download
   - Download Windows installer
   - Run the installer

2. **Verify Installation**
   ```bash
   ollama --version
   ```

3. **Pull DeepSeek-R1 Model**
   ```bash
   ollama pull deepseek-r1:1.5b
   ```

### Mac

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull deepseek-r1:1.5b
```

### Linux

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull model
ollama pull deepseek-r1:1.5b
```

## Available Models

### DeepSeek-R1 (Recommended)
```bash
# 1.5B - Fast, good for extraction (1GB)
ollama pull deepseek-r1:1.5b

# 7B - Better quality (4GB)
ollama pull deepseek-r1:7b

# 14B - Best quality (8GB)
ollama pull deepseek-r1:14b
```

### Llama 3.2 (Alternative)
```bash
# 1B - Very fast (700MB)
ollama pull llama3.2:1b

# 3B - Balanced (2GB)
ollama pull llama3.2:3b
```

## Testing Ollama

### Test in Terminal
```bash
# Start interactive chat
ollama run deepseek-r1:1.5b

# Test prompt
>>> Extract job title from: "Senior Software Engineer at Google"
```

### Test API
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "deepseek-r1:1.5b",
  "prompt": "Say hello",
  "stream": false
}'
```

## Configuration

### Change Model in App

Edit `server/services/llmService.js`:
```javascript
async callOllama(prompt) {
  const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
    model: 'deepseek-r1:1.5b',  // Change this
    prompt,
    stream: false
  });
}
```

### Change Ollama URL

Edit `.env`:
```bash
OLLAMA_URL=http://localhost:11434  # Default
# Or remote server:
# OLLAMA_URL=http://192.168.1.100:11434
```

## Performance Tips

### CPU Only
- Use 1.5B or 3B models
- Expect 5-10 seconds per extraction

### With GPU (NVIDIA)
- Use 7B or 14B models
- Much faster (1-2 seconds)

### Memory Requirements
- 1.5B model: 4GB RAM
- 7B model: 8GB RAM
- 14B model: 16GB RAM

## Troubleshooting

### Ollama not starting?
```bash
# Windows: Check Task Manager for "ollama" process
# Mac/Linux: Check if service is running
ps aux | grep ollama

# Restart Ollama
# Windows: Restart from Start Menu
# Mac/Linux:
sudo systemctl restart ollama
```

### Model not found?
```bash
# List installed models
ollama list

# Pull model again
ollama pull deepseek-r1:1.5b
```

### Slow responses?
- Use smaller model (1.5B)
- Close other applications
- Check CPU usage

### Connection refused?
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama manually
ollama serve
```

## Groq API Alternative

If Ollama doesn't work, use Groq (cloud):

1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Add to `.env`:
   ```bash
   GROQ_API_KEY=gsk_your_key_here
   ```

The app will automatically fallback to Groq if Ollama fails.

## Uninstall

### Windows
- Control Panel → Uninstall Programs → Ollama

### Mac
```bash
sudo rm -rf /usr/local/bin/ollama
sudo rm -rf ~/.ollama
```

### Linux
```bash
sudo systemctl stop ollama
sudo systemctl disable ollama
sudo rm /usr/local/bin/ollama
sudo rm -rf /usr/share/ollama
```

## Resources

- Ollama Docs: https://github.com/ollama/ollama
- Model Library: https://ollama.com/library
- Discord: https://discord.gg/ollama

---

**Need help? Check the main README or open an issue!**
