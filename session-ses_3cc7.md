# Pretty Mermaid render and theming guide

**Session ID:** ses_3cc7171cdffeZEFAGCiRiPiXvA
**Created:** 2026/2/6 23:25:06
**Updated:** 2026/2/6 23:26:53

---

## User

# Pretty Mermaid

Render stunning, professionally-styled Mermaid diagrams with one command. Supports SVG for web/docs and ASCII for terminals.

## Quick Start

### Render a Single Diagram

**From a file:**
```bash
node scripts/render.mjs \
  --input diagram.mmd \
  --output diagram.svg \
  --format svg \
  --theme tokyo-night
```

**From user-provided Mermaid code:**
1. Save the code to a `.mmd` file
2. Run the render script with desired theme

### Batch Render Multiple Diagrams

```bash
node scripts/batch.mjs \
  --input-dir ./diagrams \
  --output-dir ./output \
  --format svg \
  --theme dracula \
  --workers 4
```

### ASCII Output (Terminal-Friendly)

```bash
node scripts/render.mjs \
  --input diagram.mmd \
  --format ascii \
  --use-ascii
```

---

## Workflow Decision Tree

**Step 1: What does the user want?**
- **Render existing Mermaid code** → Go to [Rendering](#rendering-diagrams)
- **Create new diagram** → Go to [Creating](#creating-diagrams)
- **Apply/change theme** → Go to [Theming](#theming)
- **Batch process** → Go to [Batch Rendering](#batch-rendering)

**Step 2: Choose output format**
- **SVG** (web, docs, presentations) → `--format svg`
- **ASCII** (terminal, logs, plain text) → `--format ascii`

**Step 3: Select theme**
- **Dark mode docs** → `tokyo-night` (recommended)
- **Light mode docs** → `github-light`
- **Vibrant colors** → `dracula`
- **See all themes** → Run `node scripts/themes.mjs`

---

## Rendering Diagrams

### From File

When user provides a `.mmd` file or Mermaid code block:

1. **Save to file** (if code block):
   ```bash
   cat > diagram.mmd << 'EOF'
   flowchart LR
       A[Start] --> B[End]
   EOF
   ```

2. **Render with theme**:
   ```bash
   node scripts/render.mjs \
     --input diagram.mmd \
     --output diagram.svg \
     --theme tokyo-night
   ```

3. **Verify output**:
   - SVG: Open in browser or embed in docs
   - ASCII: Display in terminal

### Output Formats

**SVG (Scalable Vector Graphics)**
- Best for: Web pages, documentation, presentations
- Features: Full color support, transparency, scalable
- Usage: `--format svg --output diagram.svg`

**ASCII (Terminal Art)**
- Best for: Terminal output, plain text logs, README files
- Features: Pure text, works anywhere, no dependencies
- Usage: `--format ascii` (prints to stdout)
- Options:
  - `--use-ascii` - Use pure ASCII (no Unicode)
  - `--padding-x 5` - Horizontal spacing
  - `--padding-y 5` - Vertical spacing

### Advanced Options

**Custom Colors** (overrides theme):
```bash
node scripts/render.mjs \
  --input diagram.mmd \
  --bg "#1a1b26" \
  --fg "#a9b1d6" \
  --accent "#7aa2f7" \
  --output custom.svg
```

**Transparent Background**:
```bash
node scripts/render.mjs \
  --input diagram.mmd \
  --transparent \
  --output transparent.svg
```

**Custom Font**:
```bash
node scripts/render.mjs \
  --input diagram.mmd \
  --font "JetBrains Mono" \
  --output custom-font.svg
```

---

## Creating Diagrams

### Using Templates

**Step 1: List available templates**
```bash
ls assets/example_diagrams/
# flowchart.mmd  sequence.mmd  state.mmd  class.mmd  er.mmd
```

**Step 2: Copy and modify**
```bash
cp assets/example_diagrams/flowchart.mmd my-workflow.mmd
# Edit my-workflow.mmd with user requirements
```

**Step 3: Render**
```bash
node scripts/render.mjs \
  --input my-workflow.mmd \
  --output my-workflow.svg \
  --theme github-dark
```

### Diagram Type Reference

For detailed syntax and best practices, see [DIAGRAM_TYPES.md](references/DIAGRAM_TYPES.md).

**Quick reference:**

**Flowchart** - Processes, workflows, decision trees
```mermaid
flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
```

**Sequence** - API calls, interactions, message flows
```mermaid
sequenceDiagram
    User->>Server: Request
    Server-->>User: Response
```

**State** - Application states, lifecycle, FSM
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading
    Loading --> [*]
```

**Class** - Object models, architecture, relationships
```mermaid
classDiagram
    User --> Post: creates
    Post --> Comment: has
```

**ER** - Database schema, data models
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
```

### From User Requirements

**Step 1: Identify diagram type**
- **Process/workflow** → Flowchart
- **API/interaction** → Sequence
- **States/lifecycle** → State
- **Object model** → Class
- **Database** → ER

**Step 2: Create diagram file**
```bash
cat > user-diagram.mmd << 'EOF'
# [Insert generated Mermaid code]
EOF
```

**Step 3: Render and iterate**
```bash
node scripts/render.mjs \
  --input user-diagram.mmd \
  --output preview.svg \
  --theme tokyo-night

# Review with user, edit diagram.mmd if needed, re-render
```

---

## Theming

### List Available Themes

```bash
node scripts/themes.mjs
```

**Output:**
```
Available Beautiful-Mermaid Themes:

 1. zinc-light
 2. zinc-dark
 3. tokyo-night
 4. tokyo-night-storm
 5. tokyo-night-light
 6. catppuccin-mocha
 7. catppuccin-latte
 8. nord
 9. nord-light
10. dracula
11. github-dark
12. github-light
13. solarized-dark
14. solarized-light
15. one-dark

Total: 15 themes
```

### Theme Selection Guide

**For dark mode documentation:**
- `tokyo-night` ⭐ - Modern, developer-friendly
- `github-dark` - Familiar GitHub style
- `dracula` - Vibrant, high contrast
- `nord` - Cool, minimalist

**For light mode documentation:**
- `github-light` - Clean, professional
- `zinc-light` - High contrast, printable
- `catppuccin-latte` - Warm, friendly

**Detailed theme information:** See [THEMES.md](references/THEMES.md)

### Apply Theme to Diagram

```bash
node scripts/render.mjs \
  --input diagram.mmd \
  --output themed.svg \
  --theme tokyo-night
```

### Compare Themes

Render the same diagram with multiple themes:
```bash
for theme in tokyo-night dracula github-dark; do
  node scripts/render.mjs \
    --input diagram.mmd \
    --output "diagram-${theme}.svg" \
    --theme "$theme"
done
```

---

## Batch Rendering

### Batch Render Directory

**Step 1: Organize diagrams**
```bash
diagrams/
├── architecture.mmd
├── workflow.mmd
└── database.mmd
```

**Step 2: Batch render**
```bash
node scripts/batch.mjs \
  --input-dir ./diagrams \
  --output-dir ./rendered \
  --format svg \
  --theme tokyo-night \
  --workers 4
```

**Output:**
```
Found 3 diagram(s) to render...
✓ architecture.mmd
✓ workflow.mmd
✓ database.mmd

3/3 diagrams rendered successfully
```

### Batch with Multiple Formats

Render both SVG and ASCII:
```bash
# SVG for docs
node scripts/batch.mjs \
  --input-dir ./diagrams \
  --output-dir ./svg \
  --format svg \
  --theme github-dark

# ASCII for README
node scripts/batch.mjs \
  --input-dir ./diagrams \
  --output-dir ./ascii \
  --format ascii \
  --use-ascii
```

### Performance Options

- `--workers N` - Parallel rendering (default: 4)
- Recommended: `--workers 8` for 10+ diagrams

---

## Common Use Cases

### 1. Architecture Diagram for Documentation

```bash
# User provides architecture description
# → Create flowchart.mmd
# → Render with professional theme

node scripts/render.mjs \
  --input architecture.mmd \
  --output docs/architecture.svg \
  --theme github-dark \
  --transparent
```

### 2. API Sequence Diagram

```bash
# User describes API flow
# → Create sequence.mmd
# → Render with clear theme

node scripts/render.mjs \
  --input api-flow.mmd \
  --output api-sequence.svg \
  --theme tokyo-night
```

### 3. Database Schema Visualization

```bash
# User provides table definitions
# → Create er.mmd
# → Render for database docs

node scripts/render.mjs \
  --input schema.mmd \
  --output database-schema.svg \
  --theme dracula
```

### 4. Terminal-Friendly Workflow

```bash
# For README or terminal display
node scripts/render.mjs \
  --input workflow.mmd \
  --format ascii \
  --use-ascii > workflow.txt
```

### 5. Presentation Slides

```bash
# High-contrast for projectors
node scripts/render.mjs \
  --input slides-diagram.mmd \
  --output presentation.svg \
  --theme zinc-light
```

---

## Troubleshooting

### beautiful-mermaid Not Installed
```
Error: Cannot find module 'beautiful-mermaid'
```
**Note:** This should auto-install on first run. If it fails:
```bash
cd /path/to/pretty-mermaid-skill && npm install
```

### Invalid Mermaid Syntax
```
Error: Parse error on line 3
```
**Solution:**
1. Validate syntax against [DIAGRAM_TYPES.md](references/DIAGRAM_TYPES.md)
2. Test on https://mermaid.live/
3. Check for common errors:
   - Missing spaces in `A --> B`
   - Incorrect node shape syntax
   - Unclosed brackets

### File Not Found
```
Error: Input file not found: diagram.mmd
```
**Solution:** Verify file path is correct, use absolute path if needed

---

## Resources

### scripts/
Executable Node.js scripts for rendering operations:
- `render.mjs` - Main rendering script
- `batch.mjs` - Batch processing script
- `themes.mjs` - Theme listing utility

### references/
Documentation to inform diagram creation:
- `THEMES.md` - Detailed theme reference with examples
- `DIAGRAM_TYPES.md` - Comprehensive syntax guide for all diagram types
- `api_reference.md` - beautiful-mermaid API documentation

### assets/
Template files for quick diagram creation:
- `example_diagrams/flowchart.mmd` - Flowchart template
- `example_diagrams/sequence.mmd` - Sequence diagram template
- `example_diagrams/state.mmd` - State diagram template
- `example_diagrams/class.mmd` - Class diagram template
- `example_diagrams/er.mmd` - ER diagram template

---

## Tips & Best Practices

### Performance
- Batch render for 3+ diagrams (parallel processing)
- Keep diagrams under 50 nodes for fast rendering
- Use ASCII for quick previews

### Quality
- Use `tokyo-night` or `github-dark` for technical docs
- Add transparency for dark/light mode compatibility: `--transparent`
- Test theme in target environment before batch rendering

### Workflow
1. Start with templates from `assets/example_diagrams/`
2. Iterate with user feedback
3. Apply theme last
4. Render both SVG (docs) and ASCII (README) if needed

### Accessibility
- Use high-contrast themes for presentations
- Add text labels to all connections
- Avoid color-only information encoding


\

---

## Assistant (Build · gemini-3-pro-preview · 4.6s)

---

## User

\

---

## User

\

---

## User

\

---

## Assistant (Build · gemini-3-pro-preview · 1.8s)

---

## User

为我绘制mermeid代码的架构图：[Pasted ~16┌──────────────────────────────────────────────────────────────────────────────────┐
│                         Attack Knowledge Store (中央知识库)                        │
│                                                                                  │
│  ┌──────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   │
│  │ attack_pool   │   │ vuln_reports  │   │ labeled_data  │   │ models        │   │
│  │ (攻击技术池)   │   │ (漏洞报告)     │   │ (标注数据集)   │   │ (防御模型)     │   │
│  └──────┬───────┘   └──────┬────────┘   └──────┬────────┘   └──────┬────────┘   │
└─────────┼──────────────────┼───────────────────┼──────────────────┼──────────────┘
          │                  │                   │                  │
    ┌─────▼──────┐    ┌─────▼──────┐     ┌──────▼──────┐   ┌──────▼──────┐
    │ WP1-1      │───→│ WP1-2      │────→│ WP1-3       │──→│ WP1-4       │
    │ 情报采集    │    │ 对抗检测    │     │ 沙盒模拟     │   │ 入侵检测     │
    │ (写入)     │    │ (读1,写2)  │     │ (读2,写3)   │   │ (读3,写4)   │
    └────────────┘    └────────────┘     └────────────┘   └─────────────┘
          ↑                                                       │
          └────────────────── 反馈迭代 ──────────────────────────┘ ~1 lin以上是总架构图，这里有个问题，数据流应该是：WP1-1从网络获取数据，将处理好的结构化数据交给中央数据库的attack_pool，WP1-2调用中央数据集的attack_pool，生成中央数据库中的vuln_reports，WP1-3根据vuln_report生成 labeled_data，WP1-4根据 labeled_data生成防火墙，给出智能体的改进报告 生成nature期刊风格的架构图 给出完好的mermaid代码

---

## Assistant (Build · gemini-3-pro-preview · 38.7s)

_Thinking:_

**Mapping the Diagram's Needs**

I'm currently focused on dissecting the user's requirements. They've given me an ASCII diagram and want a Mermaid rendition. My current priority is to grasp the components and their connections, as well as the specific styling tweaks they need.


**Deciphering the Components**

Now I'm breaking down the ASCII diagram's elements. I've noted the "Attack Knowledge Store" and its core components, including the "attack_pool" and the four work packages. I am carefully mapping the connections between these components and the data flow, using the given corrections as my guide.


**Defining the Architecture**

I'm now concretizing the diagram structure. I'm focusing on crafting Mermaid code for a `flowchart TB`. I've identified nodes like "Network," "Attack Knowledge Store" with its internal components, and the four Work Packages. My next step is to accurately reflect the data flow relationships as specified, ensuring the correct connections between components and work packages, and the implied feedback loop.


**Constructing the Syntax**

I am now focusing on translating the identified components and relationships into Mermaid code. I've begun with `flowchart TB`, defining nodes for the network, the Attack Knowledge Store (as a subgraph containing attack_pool, vuln_reports, labeled_data, and the Firewall/models), and the four work packages (WP1-1 to WP1-4). I'm carefully incorporating the data flow connections and feedback loop, using specific arrow types to indicate read, write, and update operations. I am also working on styling, applying a "Nature" theme with a clean, high-contrast aesthetic and serif fonts.


**Synthesizing the Code**

I'm now integrating the data flow and styling into the Mermaid code, creating the diagram. I've utilized `classDef` elements for the 'Nature' theme, targeting a clean, high-contrast look and feel. I'm focusing on the accurate connection of the nodes, particularly between the external data source, work packages, and the knowledge store, along with an explicit feedback loop to complete the diagram's architecture.


**Fine-Tuning the Diagram**

I'm now refining the Mermaid syntax to meet the "Nature" style. I've switched to a clean sans-serif font and simplified the color palette to achieve a high-contrast aesthetic. My focus is on the correct representation of the data flow and creating a professional and polished diagram.


**Refining the Aesthetics**

I'm now prioritizing the styling, shifting to a more modern, clear sans-serif font like Arial or Helvetica for optimal legibility.  I'm focusing on a high-contrast scheme, and carefully consider the use of colors, ensuring they enhance the diagram's clarity and professionalism while adhering to the user's "Nature" journal style.


**Generating the Output**

I'm now generating the final Mermaid code, making sure to use a `flowchart TB`. I've grouped the "Central Knowledge Store" elements into a subgraph and arranged the Work Packages in a clear data flow. The styling adheres to a high-contrast, professional "Nature" journal style, with sans-serif fonts, thin lines, and a minimalist color palette, including a feedback loop from WP1-4 back to WP1-1. The final diagram should be clear and understandable.

这是一份为您定制的 Mermaid 架构图代码。

为了符合 **Nature 期刊风格**，我采用了以下设计原则：
1.  **极简配色**：使用黑、白、灰度为主，搭配一种低饱和度的学术蓝（#4472C4）作为强调色。
2.  **清晰的几何形状**：使用圆柱体表示数据存储，矩形表示处理单元。
3.  **衬线/无衬线字体搭配**：代码中指定了 `arial, helvetica`（Nature 图表常用字体），保持专业易读。
4.  **明确的数据流向**：按照您纠正后的逻辑，从网络采集到防火墙生成的全链路闭环。

您可以将以下代码保存为 `.mmd` 文件并使用 Mermaid 渲染器（或 Notion/Obsidian）查看。

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#ffffff',
    'primaryTextColor': '#000000',
    'primaryBorderColor': '#000000',
    'lineColor': '#333333',
    'secondaryColor': '#f4f4f4',
    'tertiaryColor': '#ffffff',
    'fontFamily': 'Arial, Helvetica, sans-serif'
  }
}}%%
flowchart LR
    %% 样式定义 (Nature Journal Style)
    classDef process fill:#fff,stroke:#000,stroke-width:1.5px,rx:0,ry:0;
    classDef store fill:#f0f2f5,stroke:#4472C4,stroke-width:1.5px,shape:cylinder;
    classDef external fill:#fff,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;
    classDef groupLabel fill:none,stroke:none,font-weight:bold,font-size:14px;
    %% 外部来源
    Network[("☁ Network / Internet<br/>External Data Source")]:::external
    %% 最终输出
    Report["📄 Defense Agent<br/>Improvement Report"]:::process
    %% 主系统容器
    subgraph System ["Security Knowledge Automation System"]
        direction LR
        %% 1. 采集阶段
        subgraph Stage1 [ ]
            direction TB
            WP1["WP1-1: Intelligence Collection<br/>Collect & Structure"]:::process
        end
        %% 2. 检测阶段
        subgraph Stage2 [ ]
            direction TB
            WP2["WP1-2: Adversarial Detection<br/>Analyze Patterns"]:::process
        end
        %% 3. 模拟阶段
        subgraph Stage3 [ ]
            direction TB
            WP3["WP1-3: Sandbox Simulation<br/>Verify Risks"]:::process
        end
        %% 4. 防御阶段
        subgraph Stage4 [ ]
            direction TB
            WP4["WP1-4: Intrusion Detection<br/>Generate Defense"]:::process
        end
        %% 中央知识库
        subgraph CKS ["Central Attack Knowledge Store (Core Database)"]
            direction LR
            Store1[("attack_pool<br/>Attack Techniques")]:::store
            Store2[("vuln_reports<br/>Vulnerability Logs")]:::store
            Store3[("labeled_data<br/>Annotated Datasets")]:::store
            Store4[("Firewall / Models<br/>Defense Models")]:::store
        end
    end
    %% --- 核心数据流逻辑 ---
    %% 步骤 1: 网络 -> WP1-1 -> Attack Pool
    Network ==>|Fetch Raw Data| WP1
    WP1 ==>|Write Structured Data| Store1
    %% 步骤 2: Attack Pool -> WP1-2 -> Vuln Reports
    Store1 -->|Read Attack Patterns| WP2
    WP2 ==>|Generate Reports| Store2
    %% 步骤 3: Vuln Reports -> WP1-3 -> Labeled Data
    Store2 -->|Read Reports| WP3
    WP3 ==>|Generate Labels| Store3
    %% 步骤 4: Labeled Data -> WP1-4 -> Firewall
    Store3 -->|Training Data| WP4
    WP4 ==>|Deploy/Update| Store4
    %% 最终输出
    Store4 -.->|Generate| Report
    %% 反馈闭环 - 修复了这里的语法错误
    WP4 -.->|Feedback Loop: Optimized Strategy| WP1
    %% 布局调整链接
    linkStyle default stroke:#333,stroke-width:1px,fill:none;
```

### 设计说明：

1.  **布局结构 (Flowchart LR)**：采用了从左到右的流式布局，因为您描述的是一个处理流水线（Pipeline）。
2.  **节点形状**：
    *   **圆柱体**：专门用于表示数据库/存储（`attack_pool`, `vuln_reports` 等），符合架构图标准。
    *   **矩形**：表示处理过程（WP1-1 到 WP1-4）。
    *   **虚线框**：表示外部网络和最终报告，表明它们在系统边界之外或作为输出物。
3.  **连接线**：
    *   **实线**：表示主要的数据流动和写入操作。
    *   **细实线**：表示读取操作。
    *   **虚线**：表示反馈循环（Feedback Loop）或非直接数据流（生成报告）。
4.  **Nature 风格微调**：
    *   去除了默认彩虹色，使用了专业的冷色调。
    *   字体统一，边框加粗但线条简洁。

---

