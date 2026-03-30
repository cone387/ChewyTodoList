"""创建系统预设卡片配置"""
from django.core.management.base import BaseCommand
from apps.todolist.models import TaskCardConfig


PRESET_CONFIGS = [
    {
        "name": "默认卡片",
        "desc": "简洁实用的默认样式",
        "layout": "comfortable",
        "style": {
            "borderRadius": "medium",
            "shadow": "small",
            "hoverEffect": "lift",
            "checkboxStyle": "rounded",
        },
        "field_configs": [
            {"field": "priority", "visible": True, "position": "header_left", "style": {"variant": "flag"}},
            {"field": "title", "visible": True, "position": "header", "style": {"fontSize": "medium", "fontWeight": "medium", "showStrikethrough": True}},
            {"field": "status", "visible": True, "position": "header_right", "style": {"variant": "badge"}},
            {"field": "tags", "visible": True, "position": "body", "style": {"variant": "pill", "maxCount": 3}},
            {"field": "project", "visible": True, "position": "footer", "style": {}},
            {"field": "due_date", "visible": True, "position": "footer", "style": {"showRelative": True}},
            {"field": "subtasks_count", "visible": True, "position": "footer", "style": {"showProgress": True}},
            {"field": "content", "visible": False, "position": "body", "style": {"maxLines": 2}},
        ],
    },
    {
        "name": "极简卡片",
        "desc": "只显示核心信息",
        "layout": "compact",
        "style": {
            "borderRadius": "small",
            "shadow": "none",
            "hoverEffect": "border",
            "checkboxStyle": "circle",
        },
        "field_configs": [
            {"field": "priority", "visible": True, "position": "header_left", "style": {"variant": "dot"}},
            {"field": "title", "visible": True, "position": "header", "style": {"fontSize": "small", "fontWeight": "normal", "showStrikethrough": True}},
            {"field": "due_date", "visible": True, "position": "footer", "style": {"showRelative": True}},
            {"field": "status", "visible": False, "position": "header_right", "style": {}},
            {"field": "tags", "visible": False, "position": "body", "style": {}},
            {"field": "project", "visible": False, "position": "footer", "style": {}},
            {"field": "subtasks_count", "visible": False, "position": "footer", "style": {}},
            {"field": "content", "visible": False, "position": "body", "style": {}},
        ],
    },
    {
        "name": "详细卡片",
        "desc": "显示完整的任务信息",
        "layout": "spacious",
        "style": {
            "borderRadius": "large",
            "shadow": "medium",
            "hoverEffect": "glow",
            "checkboxStyle": "rounded",
        },
        "field_configs": [
            {"field": "priority", "visible": True, "position": "header_left", "style": {"variant": "border"}},
            {"field": "title", "visible": True, "position": "header", "style": {"fontSize": "large", "fontWeight": "semibold", "showStrikethrough": True}},
            {"field": "status", "visible": True, "position": "header_right", "style": {"variant": "badge"}},
            {"field": "content", "visible": True, "position": "body", "style": {"maxLines": 3}},
            {"field": "tags", "visible": True, "position": "body", "style": {"variant": "badge", "maxCount": 5}},
            {"field": "project", "visible": True, "position": "footer", "style": {}},
            {"field": "due_date", "visible": True, "position": "footer", "style": {"showRelative": True}},
            {"field": "subtasks_count", "visible": True, "position": "footer", "style": {"showProgress": True}},
        ],
    },
    {
        "name": "看板卡片",
        "desc": "适合看板视图的紧凑样式",
        "layout": "compact",
        "style": {
            "borderRadius": "medium",
            "shadow": "small",
            "hoverEffect": "lift",
            "checkboxStyle": "square",
        },
        "field_configs": [
            {"field": "title", "visible": True, "position": "header", "style": {"fontSize": "small", "fontWeight": "medium", "showStrikethrough": False}},
            {"field": "priority", "visible": True, "position": "header_left", "style": {"variant": "flag"}},
            {"field": "tags", "visible": True, "position": "body", "style": {"variant": "pill", "maxCount": 2}},
            {"field": "due_date", "visible": True, "position": "footer", "style": {"showRelative": True}},
            {"field": "subtasks_count", "visible": True, "position": "footer", "style": {"showProgress": True}},
            {"field": "status", "visible": False, "position": "header_right", "style": {}},
            {"field": "project", "visible": False, "position": "footer", "style": {}},
            {"field": "content", "visible": False, "position": "body", "style": {}},
        ],
    },
    {
        "name": "彩色卡片",
        "desc": "使用颜色突出优先级和状态",
        "layout": "comfortable",
        "style": {
            "borderRadius": "large",
            "shadow": "medium",
            "hoverEffect": "glow",
            "checkboxStyle": "rounded",
        },
        "field_configs": [
            {"field": "priority", "visible": True, "position": "header_left", "style": {"variant": "background"}},
            {"field": "title", "visible": True, "position": "header", "style": {"fontSize": "medium", "fontWeight": "semibold", "showStrikethrough": True}},
            {"field": "status", "visible": True, "position": "header_right", "style": {"variant": "border"}},
            {"field": "tags", "visible": True, "position": "body", "style": {"variant": "badge", "maxCount": 3}},
            {"field": "project", "visible": True, "position": "footer", "style": {}},
            {"field": "due_date", "visible": True, "position": "footer", "style": {"showRelative": True}},
            {"field": "subtasks_count", "visible": True, "position": "footer", "style": {"showProgress": True}},
            {"field": "content", "visible": False, "position": "body", "style": {}},
        ],
    },
    {
        "name": "时间线卡片",
        "desc": "强调时间信息的卡片样式",
        "layout": "comfortable",
        "style": {
            "borderRadius": "medium",
            "shadow": "small",
            "hoverEffect": "border",
            "checkboxStyle": "circle",
        },
        "field_configs": [
            {"field": "title", "visible": True, "position": "header", "style": {"fontSize": "medium", "fontWeight": "medium", "showStrikethrough": True}},
            {"field": "priority", "visible": True, "position": "header_left", "style": {"variant": "dot"}},
            {"field": "status", "visible": True, "position": "header_right", "style": {"variant": "icon"}},
            {"field": "start_date", "visible": True, "position": "body", "style": {"showRelative": True, "showIcon": True}},
            {"field": "due_date", "visible": True, "position": "body", "style": {"showRelative": True, "showIcon": True}},
            {"field": "project", "visible": True, "position": "footer", "style": {}},
            {"field": "subtasks_count", "visible": True, "position": "footer", "style": {"showProgress": True}},
            {"field": "tags", "visible": False, "position": "body", "style": {}},
            {"field": "content", "visible": False, "position": "body", "style": {}},
        ],
    },
]


class Command(BaseCommand):
    help = "创建系统预设卡片配置"

    def handle(self, *args, **options):
        created_count = 0
        for preset in PRESET_CONFIGS:
            _, created = TaskCardConfig.objects.get_or_create(
                is_preset=True,
                name=preset["name"],
                defaults={
                    "user": None,
                    "desc": preset["desc"],
                    "layout": preset["layout"],
                    "style": preset["style"],
                    "field_configs": preset["field_configs"],
                    "sort_order": PRESET_CONFIGS.index(preset),
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  ✓ 创建预设: {preset['name']}"))
            else:
                self.stdout.write(f"  - 已存在: {preset['name']}")

        self.stdout.write(self.style.SUCCESS(f"\n完成！新建 {created_count} 个预设配置"))
