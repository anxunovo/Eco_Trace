#!/usr/bin/env bash
# 碳循校园 EcoTrace — 一键启动演示（Mac / Linux）
# 自动检测并安装 Node.js ≥ 18（使用中国镜像）
set -e

NODE_MIRROR="https://cdn.npmmirror.com/binaries/node"
NODE_VERSION="v22.16.0"
REQUIRED_MAJOR=18

cd "$(dirname "$0")"

echo ""
echo "  🌿 碳循校园 EcoTrace — 一键启动演示"
echo "  ─────────────────────────────────────"
echo ""

# ─── 颜色 ───
ok()   { echo "  ✅ $*"; }
warn() { echo "  ⚠️  $*"; }
err()  { echo "  ❌ $*"; }
step() { echo "  $*"; }

# ─── 检测 Node.js ───
get_node_version() {
  if command -v node &>/dev/null; then
    node -v 2>/dev/null
  fi
}

check_major() {
  local ver="$1"
  if [[ "$ver" =~ ^v([0-9]+)\. ]]; then
    [[ "${BASH_REMATCH[1]}" -ge "$REQUIRED_MAJOR" ]]
  else
    return 1
  fi
}

# ─── 安装 Node.js ───
install_node() {
  local os arch ext url tmp_file
  os="$(uname -s)"
  arch="$(uname -m)"

  # 归一化架构名
  case "$arch" in
    x86_64|amd64)  arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    armv7l)        arch="armv7l" ;;
    *)             err "不支持的架构: $arch"; exit 1 ;;
  esac

  case "$os" in
    Darwin)  ext="tar.gz"; os_name="darwin" ;;
    Linux)   ext="tar.gz"; os_name="linux" ;;
    *)       err "不支持的操作系统: $os (请手动安装 Node.js)"; exit 1 ;;
  esac

  local filename="node-${NODE_VERSION}-${os_name}-${arch}.${ext}"
  local url="${NODE_MIRROR}/${NODE_VERSION}/${filename}"
  tmp_file="/tmp/${filename}"

  step "正在从中国镜像下载 Node.js ${NODE_VERSION} ..."
  step "镜像源: ${NODE_MIRROR}"

  # 下载（3 次重试）
  local downloaded=0
  for i in 1 2 3; do
    step "下载中... (尝试 ${i}/3)"
    if curl -fsSL --connect-timeout 15 --max-time 300 -o "$tmp_file" "$url" 2>/dev/null; then
      downloaded=1
      break
    fi
    # 备用：官方源
    if curl -fsSL --connect-timeout 15 --max-time 300 -o "$tmp_file" \
       "https://nodejs.org/dist/${NODE_VERSION}/${filename}" 2>/dev/null; then
      downloaded=1
      break
    fi
    warn "下载失败，重试中..."
    sleep 2
  done

  if [[ $downloaded -eq 0 ]]; then
    err "下载失败，请手动安装 Node.js ≥ ${REQUIRED_MAJOR}"
    err "中国镜像: https://npmmirror.com/mirrors/node/"
    err "官方下载: https://nodejs.org/"
    exit 1
  fi

  local size_mb
  size_mb=$(du -m "$tmp_file" 2>/dev/null | cut -f1)
  ok "下载完成 (${size_mb} MB)"

  # 解压安装
  step "正在安装 Node.js ..."
  local install_dir="$HOME/.ecotrace/node"

  # 尝试 sudo 安装到 /usr/local（需要密码）
  if sudo -n true 2>/dev/null; then
    step "使用 sudo 安装到 /usr/local ..."
    sudo tar -xzf "$tmp_file" -C /usr/local --strip-components=1
    install_dir="/usr/local"
  else
    # 用户级安装
    step "安装到 ${install_dir} ..."
    mkdir -p "$install_dir"
    tar -xzf "$tmp_file" -C "$install_dir" --strip-components=1
    export PATH="${install_dir}/bin:$PATH"

    # 写入 shell profile
    local profile=""
    if [[ -f "$HOME/.zshrc" ]]; then profile="$HOME/.zshrc"
    elif [[ -f "$HOME/.bashrc" ]]; then profile="$HOME/.bashrc"
    elif [[ -f "$HOME/.bash_profile" ]]; then profile="$HOME/.bash_profile"
    fi
    if [[ -n "$profile" ]]; then
      if ! grep -q "ecotrace/node" "$profile" 2>/dev/null; then
        echo "export PATH=\"${install_dir}/bin:\$PATH\"" >> "$profile"
        step "已添加 PATH 到 $profile"
      fi
    fi
  fi

  rm -f "$tmp_file"

  # 验证
  if command -v node &>/dev/null; then
    ok "安装成功: Node.js $(node -v)"
    return 0
  elif [[ -x "${install_dir}/bin/node" ]]; then
    ok "安装成功: Node.js $(${install_dir}/bin/node -v)"
    export PATH="${install_dir}/bin:$PATH"
    return 0
  else
    err "安装失败，请手动安装"
    exit 1
  fi
}

# ─── 主流程 ───

# 1. 检测 Node.js
NODE_VER="$(get_node_version)"
if [[ -n "$NODE_VER" ]]; then
  ok "Node.js: ${NODE_VER}"
  if ! check_major "$NODE_VER"; then
    warn "版本过低 (需要 ≥ ${REQUIRED_MAJOR})，正在升级..."
    install_node
  fi
else
  warn "未检测到 Node.js，正在自动安装..."
  install_node
fi

# 2. 检查 .env
echo ""
if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    warn ".env 不存在，正在从 .env.example 创建..."
    cp .env.example .env
    warn "请编辑 .env 文件填写 API Key 后重新运行"
    if command -v open &>/dev/null; then open .env
    elif command -v xdg-open &>/dev/null; then xdg-open .env
    else echo "  文件位置: $(pwd)/.env"
    fi
    exit 1
  else
    err ".env 和 .env.example 都不存在"
    exit 1
  fi
fi

# 验证 .env 内容
env_ok=true
for key in TURSO_DATABASE_URL TURSO_AUTH_TOKEN ZHIPUAI_API_KEY; do
  if ! grep -qE "^${key}=.+" .env 2>/dev/null; then
    warn ".env 缺少 ${key}"
    env_ok=false
  fi
done
if [[ "$env_ok" != "true" ]]; then
  err "请编辑 .env 文件填写完整的环境变量"
  exit 1
fi
ok ".env 配置完整"

# 3. 启动服务器
echo ""
echo "  ─────────────────────────────────────"
echo ""
ok "环境就绪，正在启动演示服务器..."
echo ""

exec node demo-server.mjs
