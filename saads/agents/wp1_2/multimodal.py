"""
WP1-2 Multimodal Attack Agent — 生成多模态攻击脚本。

攻击类型:
  - 图像中嵌入隐藏文本指令（对抗样本）
  - 音频攻击
  - 跨模态注入（image + text 组合攻击）

工具:
  - generate_adversarial_image: 生成对抗图像（需 PIL/numpy）
  - generate_cross_modal_script: 生成跨模态注入脚本
"""

from __future__ import annotations

# TODO: 实现 Multimodal Attack Agent
# - 读取 category=multimodal 的 AttackEntry
# - 生成图像对抗样本 / 音频攻击 / 跨模态注入脚本
